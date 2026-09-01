---
title: 'Storage Management'
description: 'Storage limits and management in TMA Cloud.'
---

Storage limits and management in TMA Cloud.

## Storage Driver

- **Local:** Files stored on disk under `UPLOAD_DIR`. Paths stored in database.
- **S3:** Files stored in S3-compatible object storage. Object keys stored in database.
- Set `STORAGE_DRIVER=local` (default) or `STORAGE_DRIVER=s3`. When S3, set endpoint, bucket, and credentials (see [Environment Variables](/docs/reference/environment-variables)).
- Upload, download, copy, rename, delete, and share work the same for both; implementation uses streaming for S3 (no temp files).

## Storage Limits

### Per-User Limits

- Configurable storage limits per user
- **Local:** Default uses actual available disk space. Limits validated against disk capacity.
- **S3:** No disk; default is unlimited when no limit set. Display: "X used of Unlimited" or "X used of Y" (when limit set). Only per-user limit enforced.
- Set by administrators; real-time usage tracking

### Storage Calculation

- **Files:** Sum of all file sizes
- **Folders:** Counted as 0 bytes
- **Trash:** Counted until permanently deleted

## Storage Usage

### Tracking

- Real-time usage calculation (sum of file sizes in DB)
- **Local:** Total/free derived from disk and per-user limit.
- **S3:** Total = per-user limit or null (Unlimited). Free = limit − used or null. No disk.
- Visual charts and indicators; per-user usage statistics

### Monitoring

- Usage warnings at thresholds
- Limit enforcement on upload (per-user limit only)
- Storage quota exceeded errors

## Per-User Access (Strict DB Permissions)

File access is enforced with **strict database permissions** so that User A cannot download or access User B's files, even if they guess a file ID.

- **Main file API:** All file operations (download, rename, move, etc.) use `getFile(id, userId)` or equivalent queries that require `id AND user_id` and `deleted_at IS NULL`. Only the owning user sees their files.
- **OnlyOffice:** The file-serving and callback endpoints use a **per-user encryption context**: the JWT and document key include `userId`. The server only serves or saves a file when the database row matches both `id` and `user_id` from the token/key.
- **Share links:** Shared-item download requires a valid share token and returns the file only if it is in that share (join with `share_link_files`), so access is scoped to the share.

This ensures that guessing or enumerating file IDs does not grant access to another user's data.

## File Encryption

Files are automatically encrypted. Encryption uses AES-256-GCM in Google Tink's AES-GCM-HKDF-STREAMING format (`AES256_GCM_HKDF_1MB`), which splits each object into 1 MB segments, each with its own authentication tag.

### Behavior

- **Scope:** Files in `UPLOAD_DIR` (local) or S3 object key (S3) are encrypted
- **Transparent:** Encryption and decryption happen automatically
- **Streaming:** Large files processed in streams to avoid memory issues
- **Seekable:** Because segments are independent, a single-file download can serve an HTTP `Range` request by decrypting only the overlapping segments

### File Operations

- **Read/Write:** All file operations use streaming (local path or S3 key)
- **Upload:** Files streamed from client to storage (S3: multipart upload when needed)
- **Download:** Files streamed from storage to client (S3: GetObject stream); supports HTTP `Range` for partial reads
- **Copy:** Files streamed from source to destination (S3: stream copy with re-encrypt)
- **Share:** Share link download uses same path/key resolution; works for both local and S3

### Key Configuration

- Set `FILE_ENCRYPTION_KEY` environment variable — the master key from which each file's key is derived (HKDF-SHA256)
- Generate key: `openssl rand -base64 32` (a 32-byte base64 or hex key is recommended)
- Key can be base64, hex, or a passphrase (stretched with PBKDF2)
- Development fallback key used if not set (not secure for production)

### Key Rotation and Migration

- `FILE_ENCRYPTION_KEY` is used for both encryption and decryption
- Changing `FILE_ENCRYPTION_KEY` without re-encrypting existing data will break decryption for those existing files/objects
- Use `rotate-file-encryption-local.js` or `rotate-file-encryption-s3.js` to re-encrypt existing data with a new key
- Upgrading from the earlier single-blob (`[IV][DATA][TAG]`) format: run `migrate-to-streaming-encryption.js` once, with the app stopped, before deploying. See [CLI Commands](/docs/reference/cli-commands)

## Disk Space Monitoring (Local only)

### System-Level

- Total disk space available
- Used space calculation
- Free space tracking
- Base path configuration

### User-Level

- Per-user storage usage
- Limit enforcement
- Usage visualization

**Note:** S3 has no disk; total/free in UI come from per-user limit or "Unlimited" when no limit set.

## Storage Operations

### Upload Limits

- **Max upload size:** Per-file size limit, configurable by admin in **Settings** → **Storage** (default 10 GB). Stored in `app_settings.max_upload_size_bytes`. Enforced on frontend (before upload) and backend (during upload).
- Pre-upload validation (Content-Length check)
- Final safeguard check (actual file size)
- Prevents file upload if limit exceeded
- Clear error messages with usage details
- Files cleaned up if validation fails

### Cleanup

- Trash cleanup frees space
- Automatic background processes handle trash, expired share links, and audit logs
- Orphaned files are **not** removed automatically; an admin reviews and deletes them from **Settings** → **Administration** → **Review orphans**
- **S3:** Upload validation (e.g. `parentId`) runs after stream upload. The controller deletes failed bulk-upload objects when possible, but some rejected uploads can still leave orphan objects behind. Review them periodically.

### Orphans

An orphan is either an object in storage that no `files` row points at, or a `files` row whose stored object is missing. Both are reported by an on-demand scan.

- Scanning is read-only and makes a single pass over the bucket or upload directory, with no per-row HEAD requests. Memory is bounded by the number of database rows, not the number of stored objects.
- A grace window (1 hour minimum, 24 hours default, 1 year maximum) hides anything younger on either side, so an upload or paste still in progress is never reported.
- Row age comes from `files.created_at`, not `files.modified`, because uploads and copies preserve the client's original mtime.
- Deletion is itemised. Every entry is re-verified against the database and the storage timestamp at the moment of deletion, so a stale scan cannot remove a live file.
- Trashed rows still own their objects and count as referenced.

See [Orphan Review](/docs/guides/admin/orphan-review) for the admin workflow.

## S3 Bucket Protection (when STORAGE_DRIVER=s3)

Backend scripts apply bucket settings using the project S3 config. Run from backend directory.

### Apply all protections

```bash
npm run s3:protect-all
```

Applies in one run: block public access; bucket policy that denies HTTP (HTTPS only); versioning; default SSE if supported; lifecycle rules.

### Lifecycle rules

- **Abort incomplete multipart uploads** after 1 day (no effect on completed objects).
- **Delete noncurrent versions** after 7 days (versioning cleanup).
- **Remove expired delete markers** (tombstones from deletes on versioned bucket).

From backend: `npm run s3:lifecycle` applies both lifecycle rules. See [CLI Commands](/docs/reference/cli-commands).

### Individual scripts

| Command                   | Effect                                                                         |
| ------------------------- | ------------------------------------------------------------------------------ |
| `npm run s3:protect-all`  | All of the below in one run                                                    |
| `npm run s3:lifecycle`    | Lifecycle: abort incomplete multipart + delete old versions and delete markers |
| `npm run s3:policy-https` | Bucket policy: deny HTTP (HTTPS only)                                          |
| `npm run s3:public-block` | Block public access (private bucket)                                           |
| `npm run s3:versioning`   | Enable versioning                                                              |
| `npm run s3:encryption`   | Enable default SSE (AES256); not supported by all S3-compatible stores         |

PutBucketPolicy replaces the entire bucket policy. If you add other policy statements in the storage UI, re-running `s3:policy-https` or `s3:protect-all` overwrites them.

## Related Topics

- [File System](/docs/concepts/file-system) - How files are stored
- [Admin Guide: Storage Limits](/docs/guides/admin/storage-limits) - Configure limits
- [CLI Commands](/docs/reference/cli-commands) - S3 scripts reference
