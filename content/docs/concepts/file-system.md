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
- **Upload:** Temp files streamed directly to destination
- **Download:** Files streamed from storage to client
- **Range requests:** A download can ask for a byte range and get only that part
- **ZIP Archives:** Files streamed into archive without buffering
- **Rename:** Change file/folder names

### Performance

- Streaming prevents memory exhaustion for large files (>1GB)
- Rename operations use OS-level rename when available
- No file size limits imposed by memory constraints

### Path Management

- Renaming or moving an item changes its `parent_id` and `name`, not its storage key, so no stored object is touched
- Every resolved path is checked to stay inside `UPLOAD_DIR`, which is what blocks traversal attempts

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

- **One-hour window.** Once an item's timestamp is written, further reads of it are ignored until the window passes. NTFS guarantees its last-access time only to within an hour for the same reason; Linux's `relatime` uses a comparable rule.
- **Buffered writes.** Updates accumulate in memory and are written in one batched statement every 10 seconds, so no read waits on a write. Linux's `lazytime` works the same way.

The effect is at most one write per item per hour, batched. The number of statements is set by the flush interval rather than by how many users are reading, so it does not grow with traffic. Timestamps may lag by the flush interval plus the window, which is why the value is documented as approximate.

Set `ACCESS_TIME_TRACKING=0` to switch the feature off. See [Environment Variables](/docs/reference/environment-variables#last-access-time) for the tuning knobs.

### On the Cloud Drive

The mounted Windows drive reports this value as the NTFS `LastAccessTime`, so Explorer's **Date accessed** column reflects it. The other three NTFS timestamps come from the modification time. Windows writes `LastAccessTime` back when a handle closes; the drive accepts and discards those writes, because the server decides what counts as a read. See [Desktop App](/docs/getting-started/desktop-app#cloud-drive-mounted-windows-drive).

## Storage

### Physical Storage

- **Local:** Files stored in `UPLOAD_DIR`. Database stores path.
- **S3:** Files stored in S3-compatible object storage. Database stores object key.
- Set `STORAGE_DRIVER=local` (default) or `s3`. Same operations (upload, download, copy, share) work for both.
- Original filenames preserved in database

### File Encryption

- Files encrypted with AES-GCM-HKDF-STREAMING, the segmented scheme from Google's Tink library
- Encryption key configured via `FILE_ENCRYPTION_KEY` environment variable
- Each file gets its own key, derived from `FILE_ENCRYPTION_KEY` and a random salt stored in the file's header
- The plaintext is split into 1 MiB segments, each with its own authentication tag
- Automatic decryption on download
- If `FILE_ENCRYPTION_KEY` changes, existing encrypted files will not decrypt with the new key unless you re-encrypt them using the rotation scripts documented in [CLI Commands](/docs/reference/cli-commands)

Files written before the segmented format was introduced use the older layout: one AES-256-GCM pass over the whole file, stored as `[IV][ENCRYPTED_DATA][TAG]`. Both formats are readable. Which one a file uses is recorded in `files.enc_version` (1 for the old layout, 2 for the segmented one), and the conversion script in [CLI Commands](/docs/reference/cli-commands#convert-files-to-the-segmented-format) rewrites the old ones.

## Partial Downloads

A download can ask for part of a file instead of all of it, using a standard HTTP `Range` header. The server reads only the segments the range falls in, so opening a large file does not require transferring what comes before the part you want.

This is what the segmented encryption format is for. A file stored in the older format carries one authentication tag over the whole thing, which cannot be verified from a fragment, so those files are always sent whole and report `Accept-Ranges: none` until they are converted.

### What Uses It

| Client            | What ranges are used for                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| Cloud Drive       | Reads the 4 MiB blocks a read touches instead of downloading the file first                                           |
| OnlyOffice        | The document-serving endpoint accepts ranges, so a large document does not have to arrive whole before editing starts |
| Browsers          | Seeking in audio or video opened straight from a link, and PDF viewers that read a page at a time                     |
| Download managers | Resuming an interrupted transfer                                                                                      |

### Response Details

- `Accept-Ranges: bytes` on files in the segmented format, `none` on the older format
- `Content-Length` is exact on every download, so clients can show real progress
- An `ETag` and `Last-Modified` are sent, and a repeat request that includes them gets `304 Not Modified`
- A range past the end of the file returns `416`

See [Download File](/docs/api/files#download-file) for the request format.

### Storage Limits

- Per-user storage limits
- Configurable by administrators
- Real-time usage tracking

## Trash System

### Soft Delete

- Files moved to trash (not deleted)
- `deleted_at` timestamp set
- Restorable within retention period

### Automatic Cleanup

- Trash items deleted after 15 days
- Background worker handles cleanup
- Permanent deletion after retention

## Search

### Trigram Similarity Search

- PostgreSQL pg_trgm extension for fuzzy text matching
- GIN index on file names for fast searches
- Prefix matching for short queries
- Similarity-based matching for longer queries
- Real-time search results
- User-scoped searches

## Related Topics

- [Storage Management](/docs/concepts/storage-management) - Storage limits
- [Sharing Model](/docs/concepts/sharing-model) - How files are shared
- [User Guide: Upload Files](/docs/guides/user/upload-files) - How to use the file system
