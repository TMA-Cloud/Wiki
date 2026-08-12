---
title: "Users API"
description: "User management endpoints for TMA Cloud."
---

User management endpoints for TMA Cloud.

**Note:** All endpoints in this section use the general API rate limit (10000 requests per 15 minutes, per user when authenticated). Most also require admin privileges (first user). The sub-user endpoints require an account owner instead — see [Sub-users](#sub-users).

## List Users

### GET `/api/user/all`

List all users (admin only). Sub-users are listed after the owner they belong to.

**Response:**

An object containing an array of all user objects.

```json
{
  "users": [
    {
      "id": "user_123",
      "email": "user@example.com",
      "name": "User Name",
      "createdAt": "2024-01-01T00:00:00Z",
      "mfaEnabled": false,
      "storageUsed": 1073741824,
      "storageLimit": 107374182400,
      "storageTotal": 107374182400,
      "actualDiskSize": 1099511627776,
      "parentUserId": null,
      "permissions": null
    }
  ]
}
```

**Fields:**

- `parentUserId`: The account this login belongs to. `null` for top-level accounts.
- `permissions`: Granted permissions for sub-users. `null` for owners, who hold all of them.

## Sub-users

A sub-user is an extra login that shares the owner's files, folders and storage quota. These endpoints are restricted to account owners; a sub-user calling them receives `403`.

See [Authorization](/docs/concepts/authorization) for the permission list and [Sub-users](/docs/guides/user/sub-users) for the interface.

### GET `/api/user/sub-users`

List the current owner's sub-users, along with the permissions the server recognises.

**Response:**

```json
{
  "subUsers": [
    {
      "id": "user_456",
      "email": "colleague@example.com",
      "name": "Colleague Name",
      "permissions": ["files.download", "files.upload"],
      "createdAt": "2024-01-01T00:00:00Z",
      "mfaEnabled": false
    }
  ],
  "availablePermissions": [
    {
      "key": "files.download",
      "label": "Download",
      "description": "Download files and folders, and open them in the document viewer"
    }
  ]
}
```

**Note:** `availablePermissions` is the full catalog in display order. Clients should render this rather than a hard-coded list, so the options always match what the server enforces.

### POST `/api/user/sub-users`

Create a sub-user under the current owner.

**Request Body:**

```json
{
  "email": "colleague@example.com",
  "password": "securepassword",
  "name": "Colleague Name",
  "permissions": ["files.download", "files.upload"]
}
```

**Validation:**

- `email`: Required. Valid email, max 254 characters. Must not already exist on the instance.
- `password`: Required. Between 6 and 128 characters.
- `name`: Required. Non-empty after trimming, max 100 characters.
- `permissions`: Required. Array of permission keys. May be empty. Unknown keys are rejected.

**Response (201):**

```json
{
  "subUser": {
    "id": "user_456",
    "email": "colleague@example.com",
    "name": "Colleague Name",
    "permissions": ["files.download", "files.upload"],
    "createdAt": "2024-01-01T00:00:00Z",
    "mfaEnabled": false
  }
}
```

**Error cases:**

- `403 Only the account owner can perform this action.` - Caller is a sub-user
- `409 Email already in use`
- `422 Validation failed` - Missing name, short password, or an unknown permission key; `details` names the field

### PUT `/api/user/sub-users/:id`

Replace a sub-user's permissions. The array is the complete new set, not a delta.

**Request Body:**

```json
{
  "permissions": ["files.download"]
}
```

**Validation:**

- `permissions`: Required. Array of permission keys. May be empty. Unknown keys are rejected.

**Response:**

```json
{
  "subUser": {
    "id": "user_456",
    "email": "colleague@example.com",
    "name": "Colleague Name",
    "permissions": ["files.download"],
    "createdAt": "2024-01-01T00:00:00Z",
    "mfaEnabled": false
  }
}
```

**Note:** Changes apply to the sub-user's next request. They do not need to log in again.

### DELETE `/api/user/sub-users/:id`

Remove a sub-user. Files are not affected — they belong to the owner. The sub-user's sessions and desktop heartbeats are dropped immediately.

**Response:**

```json
{
  "message": "Sub-user removed"
}
```

**Error cases:**

- `403 Only the account owner can perform this action.` - Caller is a sub-user
- `404 Sub-user not found` - No such sub-user under this owner

## Storage

### GET `/api/user/storage`

Get storage usage information for the authenticated user's account. For a sub-user this reports the owner's usage and limit, since the quota is shared.

**Response:**

- **Local:** `used`, `total`, `free` (total/free from disk and per-user limit).
- **S3:** `used`; `total` and `free` are per-user limit and (limit − used), or `null` when no limit (Unlimited).

```json
{
  "used": 1073741824,
  "total": 107374182400,
  "free": 106300440576
}
```

When S3 and no limit set: `total` and `free` may be `null` (Unlimited).

### PUT `/api/user/storage-limit`

Update a user's storage limit (admin only).

**Request Body:**

```json
{
  "targetUserId": "user_123",
  "storageLimit": 107374182400
}
```

**Validation:**

- `targetUserId`: Required. Must be a string.
- `storageLimit`: Optional. Must be a positive integer or `null` to reset to the default limit.

**Response:**

```json
{
  "storageLimit": 107374182400
}
```

## Signup Status

### GET `/api/signup-status`

Public endpoint. No authentication. Use to show or hide the signup link on the login page.

**Response:**

```json
{
  "signupEnabled": true
}
```

### GET `/api/user/signup-status`

Requires authentication. Returns signup status, hide file extensions setting, and whether the current user can toggle them. The first user (admin) also receives `totalUsers` and `additionalUsers`.

**Response (any authenticated user):**

```json
{
  "signupEnabled": true,
  "canToggle": false,
  "hideFileExtensions": false,
  "canToggleHideFileExtensions": false,
  "electronOnlyAccess": false,
  "canToggleElectronOnlyAccess": false,
  "allowPasswordChange": false,
  "canToggleAllowPasswordChange": false
}
```

**Response (first user / admin):**

```json
{
  "signupEnabled": true,
  "canToggle": true,
  "totalUsers": 3,
  "additionalUsers": 2,
  "hideFileExtensions": false,
  "canToggleHideFileExtensions": true,
  "electronOnlyAccess": false,
  "canToggleElectronOnlyAccess": true,
  "allowPasswordChange": true,
  "canToggleAllowPasswordChange": true
}
```

### POST `/api/user/signup-toggle`

Enable or disable public user signup (admin only).

**Request Body:**

```json
{
  "enabled": true
}
```

**Validation:**

- `enabled`: Required. Must be a boolean.

**Response:**

```json
{
  "signupEnabled": true
}
```

## OnlyOffice Configuration

### GET `/api/user/onlyoffice-configured`

Check if OnlyOffice is configured on the server. This endpoint is accessible to all authenticated users and only indicates if the integration is active.

**Response:**

```json
{
  "configured": true
}
```

### GET `/api/user/onlyoffice-config`

Get the current OnlyOffice configuration (admin only). This does not expose the JWT secret.

**Response:**

```json
{
  "jwtSecretSet": true,
  "url": "https://onlyoffice.example.com"
}
```

### PUT `/api/user/onlyoffice-config`

Update the OnlyOffice configuration (admin only).

**Request Body:**

```json
{
  "jwtSecret": "your_jwt_secret",
  "url": "https://onlyoffice.example.com"
}
```

**Validation:**

- `jwtSecret`: Optional. Must be a string.
- `url`: Optional. Must be a valid URL.

**Note:** Both `jwtSecret` and `url` must be provided together, or both must be empty/null to disable the integration.

**Response:**

The updated OnlyOffice configuration status.

```json
{
  "jwtSecretSet": true,
  "url": "https://onlyoffice.example.com"
}
```

## Share Base URL Configuration

### GET `/api/user/share-base-url-config`

Get the share base URL configuration (admin only).

**Response:**

```json
{
  "url": "https://share.example.com"
}
```

### PUT `/api/user/share-base-url-config`

Update the share base URL configuration (admin only).

**Request Body:**

```json
{
  "url": "https://share.example.com"
}
```

**Validation:**

- `url`: Optional. Must be a valid URL.

**Note:** Set `url` to `null` to clear the configuration and use the request origin instead.

**Response:**

The updated share base URL configuration.

```json
{
  "url": "https://share.example.com"
}
```

## Max Upload Size Configuration

### GET `/api/user/max-upload-size-config`

Get the current max upload size. Accessible to any authenticated user (used by the frontend for validation).

**Response:**

```json
{
  "maxBytes": 10737418240
}
```

### PUT `/api/user/max-upload-size-config`

Update the max upload size (admin only).

**Request Body:**

```json
{
  "maxBytes": 5368709120
}
```

**Validation:**

- `maxBytes`: Required. Integer between 1048576 (1 MB) and 107374182400 (100 GB).

**Response:**

```json
{
  "maxBytes": 5368709120
}
```

## Hide File Extensions Configuration

### GET `/api/user/hide-file-extensions-config`

Get the current hide file extensions setting. Accessible to any authenticated user (used by the frontend for display).

**Response:**

```json
{
  "hideFileExtensions": false
}
```

### PUT `/api/user/hide-file-extensions-config`

Update the hide file extensions setting (admin only). When true, file names are shown without extensions in the file manager and rename dialog.

**Request Body:**

```json
{
  "hidden": true
}
```

**Validation:**

- `hidden`: Required. Must be a boolean.

**Response:**

```json
{
  "hideFileExtensions": true
}
```

## Password Change Configuration

### GET `/api/user/password-change-config`

Get the current password change setting. Accessible to any authenticated user (used by the frontend for display).

**Response:**

```json
{
  "allowPasswordChange": true
}
```

## Active Desktop Clients

### GET `/api/user/active-clients`

List active Electron desktop clients seen in the last 5 minutes (first user/admin only).

**Response:**

```json
{
  "clients": [
    {
      "id": "user_123:client_abc",
      "userId": "user_123",
      "userName": "User Name",
      "userEmail": "user@example.com",
      "appVersion": "X.Y.Z",
      "platform": "win32",
      "ipAddress": "::ffff:192.168.1.1",
      "lastSeenAt": "2026-04-07T10:41:00.000Z",
      "connectedSince": "2026-04-07T10:20:00.000Z"
    }
  ]
}
```

### POST `/api/user/client-heartbeat`

Record or refresh an Electron desktop client heartbeat (authenticated users).

**Request Body:**

```json
{
  "appVersion": "X.Y.Z",
  "platform": "win32",
  "clientId": "0ca7c806-8ee8-4fde-80e1-f2f43e5f9bfa"
}
```

**Validation:**

- `appVersion`: Required. String.
- `platform`: Optional. String.
- `clientId`: Optional. String. When omitted, backend falls back to token `sessionId`.

**Response:**

```json
{
  "ok": true
}
```

### PUT `/api/user/password-change-config`

Update the password change setting (admin only). When enabled, users can change their password from **Settings** → **Security**.

**Request Body:**

```json
{
  "enabled": true
}
```

**Validation:**

- `enabled`: Required. Must be a boolean.

**Response:**

```json
{
  "allowPasswordChange": true
}
```

## Orphaned Files

First user (admin) only. Any other caller receives `403 Only the first user can review orphaned files`, and the attempt is audited.

### GET `/api/user/orphans`

Scan storage and the database for orphans. Read-only; nothing is deleted.

**Query Parameters:**

- `graceMinutes`: Optional. Integer between 60 and 525600 (1 year). Defaults to 1440 (24 hours). Items younger than this are held back on both sides so in-flight uploads are never reported.

**Response:**

```json
{
  "scannedAt": "2026-08-12T14:05:00.000Z",
  "graceMinutes": 1440,
  "driver": "s3",
  "totals": {
    "storedObjects": 12043,
    "databaseRows": 12038,
    "skippedTooRecent": 3
  },
  "storageOrphans": {
    "items": [
      {
        "key": "9f2c1b7a-3c5e-4f11-8a90-2b0d5c7e1a44",
        "size": 5242880,
        "lastModified": "2026-08-01T09:12:00.000Z"
      }
    ],
    "count": 1,
    "totalBytes": 5242880,
    "truncated": false
  },
  "databaseOrphans": {
    "items": [
      {
        "id": "file_123",
        "name": "report.pdf",
        "path": "3a1f9c0d-77b2-4e6a-9d31-8c5b2e4f0a17",
        "size": 1048576,
        "mimeType": "application/pdf",
        "modified": "2026-07-20T11:00:00.000Z",
        "createdAt": "2026-07-20T11:00:00.000Z",
        "trashed": false,
        "ownerEmail": "user@example.com",
        "ownerName": "User Name"
      }
    ],
    "count": 1,
    "totalBytes": 1048576,
    "truncated": false
  }
}
```

**Fields:**

- `driver`: `s3` or `local`.
- `totals.skippedTooRecent`: Entries held back because they are younger than the grace window.
- `storageOrphans`: Objects in storage with no `files` row pointing at them.
- `databaseOrphans`: `files` rows whose stored object is missing. Trashed rows are included and flagged with `trashed`.
- `truncated`: `true` when `count` exceeds the number of returned `items`. Each category returns at most 2000 items.

### POST `/api/user/orphans/delete`

Delete the orphans named in the request. Each entry is re-verified against the database and storage before removal; entries that no longer qualify come back as skipped with a reason.

**Request Body:**

```json
{
  "storageKeys": ["9f2c1b7a-3c5e-4f11-8a90-2b0d5c7e1a44"],
  "fileIds": ["file_123"],
  "graceMinutes": 1440
}
```

**Validation:**

- `storageKeys`: Optional. Array of strings, at most 500 entries.
- `fileIds`: Optional. Array of strings, at most 500 entries.
- `graceMinutes`: Optional. Integer between 60 and 525600. Defaults to 1440.

At least one of `storageKeys` or `fileIds` must be non-empty.

**Response:**

```json
{
  "graceMinutes": 1440,
  "storage": {
    "results": [{ "key": "9f2c1b7a-3c5e-4f11-8a90-2b0d5c7e1a44", "deleted": true }],
    "deleted": 1,
    "skipped": 0
  },
  "database": {
    "results": [{ "id": "file_123", "deleted": false, "reason": "Stored object exists again" }],
    "deleted": 0,
    "skipped": 1
  }
}
```

**Skip reasons:**

- Storage keys: `Not a valid storage key`, `A file now references this object`, `Object no longer exists`, `Object was written too recently`
- File IDs: `Row no longer exists`, `Row does not map to a storage key`, `Row was created too recently`, `Stored object exists again`

**Error cases:**

- `400 Select at least one orphan to delete` - Both arrays empty
- `403 Only the first user can review orphaned files` - Caller is not the first user
- `422 Validation failed` - Grace window out of range, array over 500 entries, or a non-string entry

## Related Topics

- [Admin Guides](/docs/guides/admin/user-management) - User management
- [Orphan Review](/docs/guides/admin/orphan-review) - Reviewing orphaned files
- [Sub-users](/docs/guides/user/sub-users) - Creating and managing sub-users
- [Authorization](/docs/concepts/authorization) - Permission model
- [Storage Management](/docs/concepts/storage-management) - Storage concepts
