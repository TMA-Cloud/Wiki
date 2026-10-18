---
title: 'Files API'
description: 'File management endpoints for TMA Cloud.'
---

File management endpoints for TMA Cloud.

**Note:** All endpoints that accept `ids` arrays process multiple files in bulk operations. This includes move, copy, star, share, delete, restore, and download operations. One request accepts at most 500 IDs; split larger selections into batches.

## Account Scope and Permissions

File endpoints operate on the caller's **account**, not on the individual login. An account owner and its sub-users read and write the same files, folders and storage quota.

Listing, searching, and reading file details are available to every member of an account. The remaining endpoints require a permission, which owners always hold and sub-users are granted individually:

| Permission       | Endpoints                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| `files.download` | `GET /:id/download`, `POST /download/bulk`, `POST /download/bulk/ticket`, `POST /download/bulk/form`         |
| `files.upload`   | `POST /folder`, `POST /upload`, `POST /upload/bulk`, `POST /upload/check`, `POST /copy`, `POST /:id/derived` |
| `files.edit`     | `POST /move`, `POST /rename`, `POST /star`, `POST /:id/replace`                                              |
| `files.share`    | `POST /share`, `POST /share/links`, `POST /link-parent-share`                                                |
| `files.delete`   | `POST /delete`                                                                                               |
| `files.restore`  | `POST /trash/restore`                                                                                        |
| `files.purge`    | `POST /trash/delete`, `POST /trash/empty`                                                                    |

A request without the required permission returns `403` with a message naming it:

```json
{
  "message": "You do not have permission to do that. Ask the account owner to enable \"Upload & create\"."
}
```

The check runs before the request body is read, so a rejected upload does not transfer its file. See [Authorization](/docs/concepts/authorization).

Opening a document in OnlyOffice also requires `files.download`: `GET /api/onlyoffice/config/:id` and `GET /api/onlyoffice/viewer/:id` return `403` without it. See [OnlyOffice API](/docs/api/onlyoffice).

## List Files

### GET `/api/files`

List files and folders.

**Query Parameters:**

- `parentId` - Parent folder ID (optional)
- `sortBy` - Sort field: `name`, `size`, `modified`, `accessedAt`, `deletedAt` (optional, defaults to `modified`)
- `order` - Sort order: `asc`, `desc` (optional, defaults to `desc`)
- `limit` - Page size from 1 to 500 (optional, defaults to 200)
- `cursor` - Opaque value from the previous response's `X-Next-Cursor` header

Any other `sortBy` value is ignored and the default is used. `deletedAt` is only meaningful on `/api/files/trash`.

Pagination uses a stable folder-first cursor rather than row offsets. If another page exists, the response includes `X-Next-Cursor`; send that value unchanged as `cursor`. The web file list loads the next batch automatically near the bottom, keeps earlier items available, and renders only visible rows, so there are no Previous/Next pages. Size sorting uses exact folder totals maintained when files change and remains paginated.

**Response:**

An array of file and folder objects.

```json
[
  {
    "id": "file_123",
    "name": "document.pdf",
    "type": "file",
    "size": 1024,
    "mimeType": "application/pdf",
    "parentId": "folder_456",
    "starred": false,
    "shared": true,
    "modified": "2024-01-01T00:00:00Z",
    "accessedAt": "2024-01-02T09:15:00Z",
    "sharedAt": "2024-01-03T10:30:00Z",
    "expiresAt": "2024-01-10T10:30:00Z"
  }
]
```

**`accessedAt`:** When the item was last read. Listing a folder updates that folder's own `accessedAt`, not the entries returned. The value is approximate — it is written at most once per update window per item (one hour by default) and may lag by the cache TTL of this response. See [File System](/docs/concepts/file-system#last-access-time).

**Share fields:** `sharedAt` is when the item joined a share. `expiresAt` is when access ends, or `null` for a link with no expiration. Both are `null` when `shared` is false. For an item that belongs to more than one share, `expiresAt` is `null` if any link has no expiration; otherwise it is the latest expiration.

## File Statistics

### GET `/api/files/stats`

Get file statistics for the current user.

**Response fields:**

- `totalFiles` — total number of files owned by the user
- `totalFolders` — total number of folders owned by the user
- `sharedCount` — number of share links the user has created (not items shared _with_ the user)
- `starredCount` — number of files/folders the user has starred

```json
{
  "totalFiles": 100,
  "totalFolders": 50,
  "sharedCount": 10,
  "starredCount": 25
}
```

## Search Files

### GET `/api/files/search`

Search files.

**Query Parameters:**

- `q` or `query` - Search query (required)
- `limit` - Result limit (optional)

**Response:**

An array of file and folder objects matching the search query.

```json
[
  {
    "id": "file_123",
    "name": "document.pdf",
    "type": "file",
    "size": 1024,
    "mimeType": "application/pdf",
    "parentId": "folder_456",
    "starred": false,
    "shared": true,
    "modified": "2024-01-01T00:00:00Z",
    "accessedAt": "2024-01-02T09:15:00Z",
    "sharedAt": "2024-01-03T10:30:00Z",
    "expiresAt": "2024-01-10T10:30:00Z"
  }
]
```

Characters in `q` match literally. `%` and `_` are not wildcards, so searching for `50%` finds names that start with or resemble `50%`, not every name.

Searching does not count as reading. The `accessedAt` values returned are unchanged by the search itself.

## Create Folder

### POST `/api/files/folder`

Create a new folder.

**Request Body:**

```json
{
  "name": "New Folder",
  "parentId": "parent_folder_id"
}
```

**Validation:**

- `name`: Required. Must not be empty after trimming. Max length 255. Any character is allowed except `/`, `\` and control characters, so spaces, accents, non-Latin scripts and the characters Windows reserves are accepted. See [File Names](/docs/concepts/file-system#file-names).
- `parentId`: Optional. Must be a string.

**Response:**

The created folder object.

```json
{
  "id": "folder_123",
  "name": "New Folder",
  "type": "folder",
  "size": null,
  "modified": "2024-01-01T00:00:00Z"
}
```

**Errors:**

- `404`: `parentId` is not a folder in the account, or it is in the trash. The message is `Target folder not found` and nothing is created.
- `409`: A file or folder in the parent already has this name, ignoring letter case. The message is `An item with this name is already here`. See [Name Clashes](/docs/concepts/file-system#name-clashes).
- `422`: The name breaks the rules above.

## Check Upload Storage

### POST `/api/files/upload/check`

Check whether an upload would fit the storage quota, before sending the file. Only the size is checked; file content is not inspected, because any file is accepted regardless of whether its content matches its extension.

**Request Body:**

```json
{
  "fileSize": 1024
}
```

**Validation:**

- `fileSize`: Required. Must be a non-negative integer representing the total size in bytes.

**Response (200, allowed):**

```json
{
  "allowed": true
}
```

**Response (413, quota exceeded):**

```json
{
  "message": "Storage limit exceeded. Required: 1 GB, available: 500 MB."
}
```

Checking before the upload starts is what lets the client stop an over-quota upload without transferring the file first.

## Recent Files

### GET `/api/files/recent`

List the account's most recently read files, ordered by `accessed_at` descending. Folders and trashed items are excluded.

**Query Parameters:**

- `limit` - Optional, from 1 to 50. Defaults to 10, which is also used for a value outside that range.

**Response:**

An array of file objects, same shape as [List Files](#list-files), plus `openedBy` on files whose last read was by a signed-in user:

```json
"openedBy": { "id": "user_123", "name": "Sam Rivera" }
```

`openedBy` is the account owner or one of its sub-users, and `name` falls back to the email when the user has no name. It is left out for share-link visitors, deleted users and reads from before the server recorded it. The dashboard's **Recent files** shows it as "Opened 2:18 AM by Sam Rivera", or "by you".

## Upload File

### POST `/api/files/upload`

Upload a file.

**Form Data:**

- `file` - File to upload (required). The part's filename is stored as the name and must follow the [File Names](/docs/concepts/file-system#file-names) rule.
- `parentId` - Parent folder ID (optional). Must be a folder in the account that is not in the trash.
- `lastModifiedTimes` - Optional. The client's original modification time for the file. A value that fails validation is ignored and the row keeps the upload time.

**MIME Type Handling:**

- The stored MIME type is detected from the file's content (magic bytes), not the filename or the client-sent `Content-Type` as both of which can lie. When the content is not recognisable, the client-sent type is kept.
- A mismatch between content and extension never rejects the upload so all files are stored.
- Normal downloads are served as attachments. The authenticated image viewer can request `inline=1`; the server permits inline delivery only for a detected image type that is not executable content.

**Duplicate names:** If a file with the same name already exists in the parent folder, the server assigns a unique display name (e.g. `document (1).pdf`). The client can instead overwrite the existing file by calling `POST /api/files/:id/replace` with the existing file's ID.

**Response:**

The uploaded file object.

**Client abort:** If the client cancels the request, the server returns HTTP 499 with `error: "REQUEST_ABORTED"` and `message: "Upload cancelled by client"`

```json
{
  "id": "file_123",
  "name": "uploaded_file.pdf",
  "type": "file",
  "size": 1024,
  "mimeType": "application/pdf",
  "parentId": null,
  "modified": "2024-01-01T00:00:00Z"
}
```

**Errors:**

- `400`: The file name breaks the [File Names](/docs/concepts/file-system#file-names) rule. The message is `Invalid file name`.
- `404`: `parentId` is a file, a folder in another account, or a folder in the trash. The message is `Target folder not found`. The uploaded object is queued for deletion and no row is written.

## Bulk Upload Files

### POST `/api/files/upload/bulk`

Upload multiple files at once using `multipart/form-data`.

**Form Data:**

- `files` - Files to upload (required). Each filename, and each folder in its relative path, must follow the [File Names](/docs/concepts/file-system#file-names) rule.
- `parentId` - Parent folder ID (optional). Must be a folder in the account that is not in the trash.
- `relativePaths` - Optional. One value per file, same order as `files`. When present, the server uses these relative paths (e.g. `"MyFolder/sub/file.txt"`) to recreate folder structure under `parentId`.
- `clientIds` - Optional. One value per file, same order as `files`. Echoed back in the response for easier client-side matching.
- `lastModifiedTimes` - Optional. One value per file, same order as `files`. The client's original modification times. Entries that fail validation are ignored individually rather than failing the batch.

`relativePaths`, `clientIds` and `lastModifiedTimes` are repeated fields joined to the file parts by ordinal, so all three must carry one entry per file in the same order.

**Duplicate names:** For each file, if a file with the same name already exists in the parent folder, the server assigns a unique display name (e.g. `document (1).pdf`).

**Folders in relative paths:** Each folder named in a relative path is reused when its parent already holds a folder of that name, compared without regard to case. A folder whose name matches exactly is preferred over one that differs only in case. Otherwise the folder is created. The lookup and the insert run in one transaction under a lock on the account, parent and lowercased name, so parallel requests that name the same new folder create it once.

**Response:**

On success, returns a summary object. `files` contains created file records; `failed` contains per-file errors (if any).

**Client abort:** If the client cancels the request (e.g. user clicks Cancel upload), the server returns HTTP 499 with `error: "REQUEST_ABORTED"` and `message: "Upload cancelled by client"`

```json
{
  "files": [
    {
      "id": "file_123",
      "name": "file1.pdf",
      "type": "file",
      "size": 1024,
      "mimeType": "application/pdf",
      "parentId": null,
      "modified": "2024-01-01T00:00:00Z",
      "clientId": "entry-0"
    },
    {
      "id": "file_456",
      "name": "file2.jpg",
      "type": "file",
      "size": 2048,
      "mimeType": "image/jpeg",
      "parentId": null,
      "modified": "2024-01-01T00:00:00Z",
      "clientId": "entry-1"
    }
  ],
  "failed": [
    {
      "fileName": "bad-file.exe",
      "error": "Invalid file type",
      "clientId": "entry-2"
    }
  ],
  "total": 3,
  "successful": 2,
  "failedCount": 1
}
```

**Errors:**

- `400`: A filename breaks the [File Names](/docs/concepts/file-system#file-names) rule. The message is `Invalid file name: <name>` and no file in the request is stored.
- `400`: Every file failed. The message is the first file's error. When `parentId` is a file, a folder in another account or a folder in the trash, every file fails with `Target folder not found`.

A folder in a relative path that breaks the rule fails only the files below it, with `Invalid folder name: <name>`. The other files are still stored.

## Move Files

### POST `/api/files/move`

Move files and/or folders to a different location.

**Request Body:**

```json
{
  "ids": ["file_123", "file_456"],
  "parentId": "target_folder_id"
}
```

**Validation:**

- `ids`: Required. Must be a non-empty array of strings.
- `parentId`: Optional. Must be a string.

**Response:**

```json
{
  "message": "Files moved successfully."
}
```

**Name conflicts:** A moved item that has the same name as an item of the same type in the target folder gets a unique name, such as `document (1).pdf` or `Photos (1)`. Names are compared without regard to case. Items that are already in the target folder keep their names and are not moved.

**Errors:**

- `404`: One or more items are missing or in the trash, or the target folder is missing or in the trash. Nothing is moved.
- `400`: A folder would be moved into itself or one of its subfolders.

## Copy Files

### POST `/api/files/copy`

Copy files and/or folders to a different location.

**Request Body:**

```json
{
  "ids": ["file_123", "file_456"],
  "parentId": "target_folder_id"
}
```

**Validation:**

- `ids`: Required. Must be a non-empty array of strings.
- `parentId`: Optional. Must be a string.

**Response:**

```json
{
  "message": "Copy queued.",
  "queued": true,
  "jobId": "34d6ea50-2adb-4e4f-9dce-f97d1ab219db"
}
```

Copy always returns `202`. The `account-file-operations` worker copies the tree and publishes the normal file events after completion. If the queue is unavailable, the endpoint returns `503`.

**Name conflicts:** Each copied file or folder at the top of the selection gets a unique name in the target folder when its name is already taken by an item of the same type, such as `document (1).pdf` or `Photos (1)`. Names are compared without regard to case. Items inside a copied folder keep their names.

If one or more items are missing or in the trash, or the target folder is missing or in the trash, the endpoint returns `404` and nothing is queued.

The worker checks the target folder again before it copies any object, and once more in the transaction that writes the new rows. If the folder was moved to the trash while the job waited, the job fails with `Target folder not found` and nothing is copied.

## Rename File

### POST `/api/files/rename`

Rename a file or folder.

**Request Body:**

```json
{
  "id": "file_123",
  "name": "New Name"
}
```

**Validation:**

- `id`: Required. Must be a string.
- `name`: Required. Must not be empty after trimming. Max length 255. Any character is allowed except `/`, `\` and control characters, so spaces, accents, non-Latin scripts and the characters Windows reserves are accepted. See [File Names](/docs/concepts/file-system#file-names).

**Response:**

The updated file or folder object.

```json
{
  "id": "file_123",
  "name": "New Name",
  "type": "file",
  "modified": "2024-01-01T00:00:00Z"
}
```

**Errors:**

- `404`: No item with this `id` in the account.
- `409`: Another file or folder in the same folder already has this name, ignoring letter case. The message is `An item with this name is already here`. Changing only the letter case of the item's own name is allowed.
- `422`: The name breaks the rules above.

## Star Files

### POST `/api/files/star`

Star or unstar one or more files/folders.

**Request Body:**

```json
{
  "ids": ["file_123", "file_456"],
  "starred": true
}
```

**Validation:**

- `ids`: Required. Must be a non-empty array of strings.
- `starred`: Required. Must be a boolean.

**Response:**

```json
{
  "message": "File starred status updated."
}
```

## Get Starred Files

### GET `/api/files/starred`

List all starred files and folders.

**Query Parameters:**

- `sortBy` - Sort field (optional)
- `order` - Sort order (optional)
- `limit` - Page size from 1 to 500 (optional, defaults to 200)
- `cursor` - Value from the previous `X-Next-Cursor` response header

**Response:**

An array of file and folder objects.

```json
[
  {
    "id": "file_123",
    "name": "document.pdf",
    "type": "file",
    "size": 1024,
    "mimeType": "application/pdf",
    "parentId": "folder_456",
    "starred": true,
    "modified": "2024-01-01T00:00:00Z",
    "accessedAt": "2024-01-02T09:15:00Z"
  }
]
```

## Share Files

### POST `/api/files/share`

Share or unshare files. Creates share links if they don't exist, or removes sharing if `shared: false`.

**Request Body:**

```json
{
  "ids": ["file_123", "file_456"],
  "shared": true,
  "expiry": "7d"
}
```

**Validation:**

- `ids`: Required. Must be a non-empty array of strings.
- `shared`: Required. Must be a boolean.
- `expiry`: Optional. One of `"7d"`, `"30d"`, or `"never"`.

When sharing, every ID must be a file or folder in the caller's account that is not in Trash. Otherwise the request returns `404` with `{ "message": "File not found" }` and no link is created for any of the IDs.

**Response (when sharing):**

```json
{
  "links": {
    "file_123": "http://example.com/s/token123",
    "file_456": "http://example.com/s/token456"
  }
}
```

**Response (when unsharing):**

```json
{
  "message": "Files unshared successfully."
}
```

## Get Share Links

### POST `/api/files/share/links`

Get existing share links for multiple files without creating new ones.

**Request Body:**

```json
{
  "ids": ["file_123", "file_456"]
}
```

**Validation:**

- `ids`: Required. Must be a non-empty array of strings.

**Response:**

```json
{
  "links": {
    "file_123": "http://example.com/s/token123"
  }
}
```

## Link to Parent Share

### POST `/api/files/link-parent-share`

Link files to their parent folder's share link. If the parent folder is shared, the files will be added to that share.

This endpoint links synchronously and returns the resulting share URLs. Uploads and folder creations inside a shared folder are linked automatically as well, but on the `share-linking` background queue, so the link is written shortly after the response.

**Request Body:**

```json
{
  "ids": ["file_123", "file_456"]
}
```

**Validation:**

- `ids`: Required. Must be a non-empty array of strings.

**Response:**

```json
{
  "links": {
    "file_123": "http://example.com/s/parent_token"
  }
}
```

## Get Shared Files

### GET `/api/files/shared`

List files and folders shared by the current user. Includes share link expiry information.

**Query Parameters:**

- `sortBy` - Sort field (optional)
- `order` - Sort order (optional)
- `limit` - Page size from 1 to 500 (optional, defaults to 200)
- `cursor` - Value from the previous `X-Next-Cursor` response header

**Response:**

An array of shared file and folder objects. Each object includes `sharedAt` and `expiresAt`. `expiresAt` is `null` if the link has no expiration.

```json
[
  {
    "id": "file_123",
    "name": "document.pdf",
    "type": "file",
    "size": 1024,
    "mimeType": "application/pdf",
    "starred": false,
    "shared": true,
    "modified": "2024-01-01T00:00:00Z",
    "accessedAt": "2024-01-02T09:15:00Z",
    "sharedAt": "2024-01-03T10:30:00Z",
    "expiresAt": "2024-01-08T00:00:00Z"
  }
]
```

## Progress Streaming

`POST /api/files/delete` and `POST /api/files/trash/restore` can stream progress for selections that remain in the web process. Send an `Accept: application/x-ndjson` request header and the response is `application/x-ndjson` — one JSON object per line — instead of a single JSON body.

The selected ids are processed in batches. One line is written after each batch completes, followed by a final line:

```json
{"type":"progress","done":0,"total":40}
{"type":"progress","done":25,"total":40}
{"type":"progress","done":40,"total":40}
{"type":"done","message":"Files moved to trash."}
```

- `progress` — `done` of `total` ids processed so far. The first line reports `done: 0`.
- `done` — the operation finished. Its remaining fields are the same body the endpoint returns without streaming (for example `message`).
- `error` — the operation failed partway; `message` describes the failure. HTTP status is already `200`, so read the stream to detect this.

Without the `Accept: application/x-ndjson` header, each endpoint returns the single JSON object documented for it below. Trees over 1,000 items are queued before streaming starts. The streamed batches are not a single transaction: a failure after the first batch leaves earlier batches applied.

## Delete Files

### POST `/api/files/delete`

Move one or more files/folders to the trash.

**Request Body:**

```json
{
  "ids": ["file_123", "file_456"]
}
```

**Validation:**

- `ids`: Required. Must be a non-empty array of strings.

**Response:**

```json
{
  "message": "Files moved to trash."
}
```

**Progress streaming:** With an `Accept: application/x-ndjson` request header, progress is streamed line by line. See [Progress Streaming](#progress-streaming).

If the selected roots contain more than 1,000 items, Move to Trash returns `202` with `queued: true` and a `jobId`; the `account-file-operations` worker completes it.

## Get Trash

### GET `/api/files/trash`

List all files and folders currently in the trash.

**Query Parameters:**

- `sortBy` - Sort field (optional)
- `order` - Sort order (optional)
- `limit` - Page size from 1 to 500 (optional, defaults to 200)
- `cursor` - Value from the previous `X-Next-Cursor` response header

**Response:**

An array of trashed file and folder objects.

```json
[
  {
    "id": "file_123",
    "name": "document.pdf",
    "type": "file",
    "size": 1024,
    "mimeType": "application/pdf",
    "parentId": "folder_456",
    "starred": false,
    "modified": "2024-01-01T00:00:00Z"
  }
]
```

## Restore Files

### POST `/api/files/trash/restore`

Restore one or more files/folders from the trash.

**Request Body:**

```json
{
  "ids": ["file_123", "file_456"]
}
```

**Validation:**

- `ids`: Required. Must be a non-empty array of strings.

**Response:**

```json
{
  "message": "Restored 2 file(s) from trash"
}
```

**Progress streaming:** With an `Accept: application/x-ndjson` request header, progress is streamed line by line. See [Progress Streaming](#progress-streaming).

If the selected roots contain more than 1,000 items, Restore returns `202` with `queued: true` and a `jobId`; the `account-file-operations` worker completes it.

## Permanent Delete

### POST `/api/files/trash/delete`

Permanently delete one or more files/folders from the trash. This action is irreversible.

**Request Body:**

```json
{
  "ids": ["file_123", "file_456"]
}
```

**Validation:**

- `ids`: Required. Must be a non-empty array of strings.

**Response:**

```json
{
  "message": "Permanent deletion queued.",
  "queued": true,
  "jobId": "34d6ea50-2adb-4e4f-9dce-f97d1ab219db"
}
```

Permanent Delete always returns `202`. The `account-file-operations` worker deletes storage objects and database rows in batches. If the queue is unavailable, the endpoint returns `503`.

## Empty Trash

### POST `/api/files/trash/empty`

Permanently delete all files and folders in the trash.

**Response:**

```json
{
  "message": "Deletion of 5 item(s) queued",
  "queued": true,
  "jobId": "..."
}
```

The `account-file-operations` worker deletes storage objects and database rows in batches. If the queue is unavailable, this endpoint returns `503` instead of doing the full purge in the web request. If trash is already empty, it returns `{"message": "Trash is already empty"}`.

## Get Background File Job

### GET `/api/files/jobs/:jobId`

Get the state or result of a queued copy, move-to-trash, restore, permanent-delete, or Empty Trash operation.

The job must belong to the authenticated account. A missing job or a job owned by another account returns `404`.

**Pending response (`202`):**

```json
{
  "jobId": "34d6ea50-2adb-4e4f-9dce-f97d1ab219db",
  "status": "active"
}
```

**Completed response (`200`):**

```json
{
  "jobId": "34d6ea50-2adb-4e4f-9dce-f97d1ab219db",
  "status": "completed",
  "result": {
    "count": 2,
    "ids": ["file_789", "file_790"]
  }
}
```

`ids` is present for copy jobs. A failed or cancelled job returns `500`. An invalid job ID returns `400`, and an unavailable queue returns `503`.

## Download File

### GET `/api/files/:id/download`

Download a single file or a folder (folders are returned as a ZIP archive).

**Validation:**

- `id`: Required. Must be a string.

**Query Parameters:**

- `inline=1` - Display a safe image inline. Other file types remain attachments.

**Response:**
The raw file content or a ZIP archive.

Folder ZIPs are built as they stream. If the client disconnects, the server stops the archive and closes the storage and database resources it was using. A folder download does not block uploads or other operations on the account while it runs.

Entry names in a ZIP replace `: * ? " < > |` and control characters with `_` and drop trailing dots and spaces, so the archive extracts on Windows. The stored names do not change. See [File Names](/docs/concepts/file-system#file-names).

Single-file downloads accept an HTTP `Range` header and reply `206 Partial Content` with `Content-Range` for the requested bytes; the response advertises `Accept-Ranges: bytes`. Only the segments overlapping the range are read and decrypted. Folder/bulk downloads are streamed ZIP archives and do not support ranges.

Downloading marks the item as read. For a folder, the folder and every entry in the archive are marked. See [Last Access Time](/docs/concepts/file-system#last-access-time).

## Get File or Folder Info

### GET `/api/files/:id/info`

Get basic metadata for a single file or folder.

**Path Parameters:**

- `id` - File or folder ID (required)

**Response (file):**

```json
{
  "id": "file_123",
  "name": "document.pdf",
  "type": "file",
  "size": 1024,
  "modified": "2024-01-01T00:00:00Z",
  "accessedAt": "2024-01-02T09:15:00Z",
  "shared": true,
  "sharedAt": "2024-01-03T10:30:00Z",
  "expiresAt": "2024-01-10T10:30:00Z",
  "parentId": "folder_456"
}
```

**Response (folder):**

```json
{
  "id": "folder_123",
  "name": "Reports",
  "type": "folder",
  "size": null,
  "modified": "2024-01-01T00:00:00Z",
  "accessedAt": "2024-01-02T09:15:00Z",
  "parentId": null,
  "folderInfo": {
    "totalSize": 1048576,
    "fileCount": 25,
    "folderCount": 3
  }
}
```

- `size` and `folderInfo.totalSize` are in bytes.
- For folders, `size` may be `null`; use `folderInfo.totalSize` for the recursive size.
- `accessedAt` is the last read time. Calling this endpoint does not update it.
- `sharedAt` is when the item joined a share.
- `expiresAt` is the effective share expiration, or `null` when the item is unshared or at least one associated link has no expiration.

**Errors:**

- `404` - File or folder not found or not owned by the user

## Replace File Contents

### POST `/api/files/:id/replace`

Replace the contents of an existing file. The file ID and name stay the same; size, modified time and last access time are updated. Used by the desktop app when it uploads a save of a file opened in a desktop app, and by Cloud Drive when a file is saved over.

**Path Parameters:**

- `id` - File ID (required)

**Form Data:**

- `file` - New file content (required). Single file in `multipart/form-data`.
- `baseVersion` - Optional. The `contentVersion` the client's copy came from. If the file has been saved since (by someone else, or by OnlyOffice), the replace is refused with `409` and nothing changes. Without it the replace always lands, as the web app's deliberate **Replace** does.

**Validation:**

- The file must exist and belong to the authenticated user.
- MIME type is detected from file content. Stored MIME type is updated to match.

**Response:**

The updated file object.

```json
{
  "id": "file_123",
  "name": "document.docx",
  "type": "file",
  "size": 2048,
  "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "parentId": "folder_456",
  "starred": false,
  "modified": "2024-01-01T12:00:00Z",
  "contentVersion": 4
}
```

Every file object carries `contentVersion`, which every replace and OnlyOffice save raises by one. `modified` cannot serve as a version, because uploads keep the client's own file time.

**Errors:**

- `404` - File not found or not owned by the user
- `400` - No file in request or invalid file type
- `409` - `baseVersion` is not the file's current `contentVersion`: someone else saved after this copy was opened. The refusal is recorded in the audit log as a failed `file.update` with reason `stale_version`.
- `409` - Someone else holds the file's [edit lock](#edit-locks): "Name is editing this file".

## Edit Locks

While a file is open for editing in the desktop app, the app holds an edit lock on it. Others see who is editing, Cloud Drive gives them the file read-only, and the server refuses their saves until the lock is gone.

A lock is a two-minute lease that the app renews about every 40 seconds. If the app stops renewing it (it crashed, or the computer went offline), the lock simply runs out, so a file is never stuck locked.

A lock belongs to a user on one desktop install. The desktop app sends its install id in the `X-TMA-Device` header with every request, and the lock records it as `deviceId`. The same user signed in on another computer, or in the browser, is kept out like anyone else: they cannot take the lock, and their saves are refused.

While a file is locked, every file object in listings and search results carries a `lock`:

```json
{
  "id": "file_123",
  "name": "Budget.xlsx",
  "lock": {
    "userId": "user_789",
    "name": "Sam",
    "since": "2026-10-18T09:12:00Z",
    "expiresAt": "2026-10-18T09:14:00Z",
    "deviceId": "6f1c2e0a-8f4b-4d2a-9a51-3c0e7b2d9f10"
  }
}
```

An OnlyOffice editing session in the browser holds the lock too. Its `deviceId` starts with `onlyoffice:` followed by the document key, which no desktop install id can look like. OnlyOffice opens a locked file in view mode, also for the user who holds the lock.

### POST `/api/files/:id/lock`

Take the edit lock on a file, or renew your own from the same install (`X-TMA-Device`). Needs the **files.edit** permission.

**Response:**

```json
{
  "acquired": true,
  "lock": {
    "userId": "user_123",
    "name": "Alex",
    "since": "2026-10-18T09:12:00Z",
    "expiresAt": "2026-10-18T09:14:00Z"
  }
}
```

When someone else holds it, or you hold it from another install, `acquired` is `false` and `lock` says who. Taking and releasing a lock are recorded in the audit log as `file.lock` and `file.unlock`.

**Errors:**

- `404` - File not found, not a file, or in the trash

### DELETE `/api/files/:id/lock`

Release your edit lock, taken from the same install. Releasing a lock you do not hold does nothing.

**Response:**

```json
{ "released": true }
```

## Upload Derived File (e.g. Exported Document/PDF)

### POST `/api/files/:id/derived`

Upload a new file that is derived from an existing one while keeping the original file unchanged. This is used by the desktop app when a user opens a document in its desktop app and then uses **Save As** or **Export** (for example, exporting a Word document to PDF or saving a copy as `.docx`, `.xlsx`, or `.pptx`).

The new file is created as a separate entry in the same folder as the original file.

**Path Parameters:**

- `id` - Source file ID (required). The new file is created as a sibling of this file.

**Form Data:**

- `file` - Derived file content (required). Single file in `multipart/form-data`.

The server streams and encrypts the multipart upload directly to the configured bucket, then creates the file metadata.

**Validation:**

- The source file must exist and belong to the authenticated user.
- The derived file name must be a valid file name.
- MIME type is detected from file content and stored accordingly.
- Storage quota and max upload size checks apply in the same way as for normal uploads.

**Response:**

The created file object for the derived file. Common use cases include exported PDFs and alternate Office document formats saved from Word, Excel, or PowerPoint.

```json
{
  "id": "file_derived_123",
  "name": "document.pdf",
  "type": "file",
  "size": 4096,
  "mimeType": "application/pdf",
  "parentId": "folder_456",
  "starred": false,
  "modified": "2024-01-01T12:05:00Z"
}
```

**Errors:**

- `404` - Source file not found or not owned by the user
- `400` - No file in request or invalid file type
- `413` - Storage limit exceeded

## Bulk Download Files

### POST `/api/files/download/bulk`

Download multiple files and/or folders as a single ZIP archive.

**Request Body:**

```json
{
  "ids": ["file_123", "file_456", "folder_789"]
}
```

**Validation:**

- `ids`: Required. An array of 1 to 500 IDs.

**Response:**
A ZIP archive containing all selected files and folders. Entry names follow the same Windows-safe rule as a [folder download](#get-apifilesiddownload).

**Note:** For single file downloads, use the GET endpoint. This endpoint is optimized for downloading multiple items at once.

### POST `/api/files/download/bulk/ticket`

Get a one-minute ticket for [`POST /api/files/download/bulk/form`](#post-apifilesdownloadbulkform). The web app uses the pair so that the browser's own download manager saves a large ZIP straight to disk, instead of the page holding it in memory.

**Request Body:** the same as `POST /api/files/download/bulk`.

**Response:**

```json
{
  "ticket": "eyJhbGciOiJIUzI1NiJ9...",
  "expiresIn": 60
}
```

The ticket names the selected IDs and is bound to the user and session that asked for it. `404` if none of the IDs exist in the account.

### POST `/api/files/download/bulk/form`

Download the selection named by a ticket, as a ZIP archive. The browser sends this as a plain HTML form post, which cannot carry the `X-Requested-With` header, so this route is outside the CSRF header check. The ticket stands in for it: it can only be obtained by a request that passed the check.

**Request Body** (`application/x-www-form-urlencoded`):

- `ticket`: Required. A ticket from `POST /api/files/download/bulk/ticket`.

**Response:** the same ZIP archive as `POST /api/files/download/bulk`, with the same audit event.

**Errors:**

- `401` - Not signed in, or the ticket is expired, altered, or belongs to another session
- `403` - The caller lacks `files.download`

## File Events

### GET `/api/files/events`

Establish a real-time event stream (Server-Sent Events) for file system changes. Redis carries events between the server and worker processes; without it, the stream gets only the events of the process it is connected to.

**Response:**
A Server-Sent Events stream.

## Related Topics

- [Sharing](/docs/api/sharing) - Share link endpoints
- [Authorization](/docs/concepts/authorization) - Account scope and permissions
- [File System Concepts](/docs/concepts/file-system) - File system overview
