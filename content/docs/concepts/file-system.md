---
title: 'File System'
description: 'File system architecture and organization in TMA Cloud.'
---

File system architecture and organization in TMA Cloud.

## File Structure

### Hierarchical Organization

- **Root Level:** User's root directory
- **Folders:** Nested folder structure
- **Files:** Stored within folders or root
- **Parents:** An item's parent is always a folder in the same account. An upload, new folder or copy into a file, a folder in the trash or another account's folder is refused with `Target folder not found`. See [Database Schema](/docs/reference/database-schema#files) for the triggers that enforce this.

### File Metadata

- **ID:** Unique identifier (stable across operations)
- **Name:** File or folder name
- **Type:** 'file' or 'folder'
- **Size:** File size in bytes
- **MIME Type:** Actual MIME type detected from file content (not from extension)
- **Parent ID:** Parent folder reference
- **Path:** The storage key, not a user-visible path
- **User ID:** The account the item belongs to
- **Last Access Time:** When the item was last read (`accessed_at`), shown in the UI as "Last opened"
- **Shared At:** When the item most recently became shared (`shared_at`); null while the item is not shared

### File Names

A name is stored exactly as the user's system wrote it. Uploads, new folders and renames all follow one rule, close to Nextcloud's default, which also refuses only separators and control characters:

- Up to 255 characters, and not empty, `.` or `..`.
- No `/` or `\`, which are path separators, and no control characters (ASCII 0–31 and 127).

Everything else is allowed, including spaces, accents, emoji, the narrow no-break space that newer Windows time formats put before AM and PM, and the characters Windows reserves (`: * ? " < > |`). Names such as `CON` or ones ending in a dot are also accepted, since macOS, Linux, and Android allow them.

Where a name has to become a Windows file, it is translated rather than refused:

- **Folder ZIP downloads** replace `: * ? " < > |` with `_` and drop trailing dots and spaces in each entry, as browsers do for single downloads.
- **The desktop app** writes local copies (Open on Desktop, copy to Explorer, Save As) under names that follow Microsoft's naming rules: reserved and control characters become `_`, trailing dots and spaces are dropped, and device names such as `CON`, `NUL.txt` or `COM1.log` get a leading `_`. Copies to Explorer also add a `(n)` suffix to names that differ only in letter case and shorten long names so the staged path stays within 260 characters.
- **The Cloud Drive** shows each reserved character, and a trailing dot or space, as the private-use character `U+F000` plus its code, the mapping Cygwin, WSL and Syncthing use. Renames and saves turn it back, so the stored name never changes. WSL and Git Bash show the original characters.

## File Operations

### Supported Operations

- **Upload:** Add new files
- **Download:** Retrieve files
- **Create Folder:** Create new directories
- **Move:** Move files/folders
- **Copy:** Duplicate files/folders
- **Rename:** Change file/folder names
- **Delete:** Move to trash
- **Star:** Mark as favorite
- **Share:** Create share links

### Large File Handling

- **Streaming:** Files streamed without loading into memory
- **Upload:** Files encrypted and streamed directly to the bucket
- **Download:** Files streamed from storage to client; single-file downloads support HTTP `Range` (partial content) for seeking
- **ZIP Archives:** Archive entries are read through a database cursor and streamed one at a time, keeping database pages and open storage streams bounded. Trees of up to 20,000 entries are read at the start so the database connection is released right away; larger trees are limited by `DB_HELD_CURSOR_LIMIT`. Each entry already carries its wrapped data key, so no per-file key lookup is made. The archive stops when the client disconnects
- **Rename:** Change file/folder names

### Performance

- Streaming prevents memory exhaustion for large files (>1GB)
- Rename operations update database metadata without moving stored objects
- Copy operations are queued on the background worker, use server-side object-store copy with four transfers at most, and read folder trees once before batched inserts
- File lists use stable cursor batches and load continuously as the user scrolls. Only visible grid/list rows plus a small overscan are rendered
- Folder sizes and descendant counts are maintained by database triggers. Size sorting uses those stored totals and the matching page-order index instead of walking a folder tree during a listing. Nothing recomputes them on read; a weekly worker job recomputes them from the rows and reports any folder whose stored totals were wrong. See [Background Workers](/docs/guides/operations/background-workers#maintenance-schedule)
- No file size limits imposed by memory constraints

### Path Management

- Renaming or moving an item changes its `parent_id` and `name`, not its storage key, so no stored object is touched
- Stored object keys are validated as flat keys without path separators or traversal sequences

## Last Access Time

Every file and folder carries an `accessed_at` timestamp, surfaced in the UI as **Last opened** in Get Info and as a sort option in the file list. It answers "when was this last read", which `modified` cannot, since `modified` only moves when the contents change.

### What Counts as Reading

| Action                              | Updates                           |
| ----------------------------------- | --------------------------------- |
| Downloading a file                  | That file                         |
| Downloading a folder as ZIP         | The folder and everything in it   |
| Bulk download                       | Every item in the archive         |
| Opening a document in OnlyOffice    | That file                         |
| Reading a file through a share link | That file                         |
| Opening a folder in the file list   | The folder only, not its contents |
| Uploading or replacing a file       | That file                         |

Listing a folder marks the folder and leaves its children alone. This matches how Windows treats directory enumeration, and it keeps the value meaningful: if browsing past a file counted as opening it, every file in a folder you visit would look recently used.

Searching, viewing Get Info, renaming, moving, starring and sharing do not count as reads.

### Write Behavior

Recording a read on every request would turn each read into a database write. Two rules keep that cost bounded, both taken from how filesystems handle the same problem:

- **Update window, one hour by default.** Once an item's timestamp is written, further reads of it are ignored until the window passes. NTFS guarantees its last-access time only to within an hour for the same reason; Linux's `relatime` uses a comparable rule.
- **Buffered writes.** Updates accumulate in memory and are written in one batched statement every 10 seconds by default, so no read waits on a write. Linux's `lazytime` works the same way.

The effect is at most one write per item per window, batched. The number of statements is set by the flush interval rather than by how many users are reading, so it does not grow with traffic. Timestamps may lag by the flush interval plus the window, which is why the value is documented as approximate.

The first user can turn tracking off and change the window and the write interval under **Settings** → **Administration** → **Last opened tracking**. See [Session Timeout and Last Opened](/docs/guides/admin/sessions-and-activity).

### On the Cloud Drive

On Windows the drive reports this value as the NTFS `LastAccessTime`, so Explorer's **Date accessed** column reflects it. The other three NTFS timestamps come from the modification time. Times Windows writes back locally are never sent to the server, because the server decides what counts as a read. See [Desktop App](/docs/getting-started/desktop-app#cloud-drive).

## Storage

### Physical Storage

- **S3:** Files stored in S3-compatible object storage. Database stores object key.
- The first user connects the bucket in **Settings** → **Storage**; file contents cannot be stored or read until it is saved.
- Original filenames preserved in database

### File Encryption

- Files encrypted with AES-256-GCM in Google Tink's AES-GCM-HKDF-STREAMING format (the `AES256_GCM_HKDF_1MB` scheme)
- Each newly encrypted object version uses a random data key (DEK). `FILE_ENCRYPTION_KEY` is the key-encryption key (KEK) that wraps the DEK; a server-side logical copy reuses the source ciphertext and wrapped DEK
- Each object has a 40-byte header (a random salt and nonce prefix) followed by 1 MB segments, each sealed with its own authentication tag. The per-file encryption key is derived from the DEK with HKDF-SHA256
- Segments make stored objects seekable: a download serves an HTTP `Range` request by fetching and decrypting only the overlapping segments, so a large file opens without reading all of it
- Automatic decryption on download
- Rotating `FILE_ENCRYPTION_KEY` only rewraps the stored DEKs and never re-encrypts the objects. See [Key Rotation](/docs/guides/operations/key-rotation)

### Storage Limits

- Per-user storage limits
- Configurable by administrators
- Real-time usage tracking

## Trash System

### Soft Delete

- Files moved to trash (not deleted)
- `deleted_at` timestamp set
- Restorable within retention period
- Share links stop serving trashed items until they are restored

### Automatic Cleanup

- Trash items deleted after 15 days
- Background worker handles cleanup
- Permanent deletion after retention
- Manual permanent deletion and Empty Trash run on background worker

## Search

### Trigram Similarity Search

- PostgreSQL pg_trgm extension for fuzzy text matching
- GIN index on file names for fast searches
- Prefix matching for short queries
- Indexed trigram matching for longer queries
- Real-time search results
- User-scoped searches
- `%` and `_` in a query match literally, not as wildcards

## Related Topics

- [Storage Management](/docs/concepts/storage-management) - Storage limits
- [Sharing Model](/docs/concepts/sharing-model) - How files are shared
- [User Guide: Upload Files](/docs/guides/user/upload-files) - How to use the file system
