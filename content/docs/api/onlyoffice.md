---
title: 'OnlyOffice API'
description: 'OnlyOffice integration endpoints for TMA Cloud.'
---

OnlyOffice integration endpoints for TMA Cloud.

## Editor Configuration

### GET `/api/onlyoffice/config/:id`

Get OnlyOffice editor configuration for a file.

**Rate limiting:** General API limit (10000 per 15 minutes per IP).

**Validation:**

- The file `id` from the URL is required.
- The file's extension must be one supported by OnlyOffice.
- The file's actual MIME type must match the expected type for its extension.
- The server will return a `400 Bad Request` if a MIME type mismatch is detected.

**Response:**

```json
{
  "config": {
    "document": {
      "fileType": "docx",
      "key": "file_key",
      "title": "document.docx",
      "url": "https://example.com/api/onlyoffice/file/123"
    },
    "editorConfig": {
      "mode": "edit",
      "callbackUrl": "https://example.com/api/onlyoffice/callback"
    }
  },
  "token": "signed_jwt_token",
  "onlyofficeJsUrl": "https://onlyoffice.example.com/web-apps/apps/api/documents/api.js"
}
```

## Viewer

### GET `/api/onlyoffice/viewer/:id`

Get standalone viewer page for a file.

**Rate limiting:** General API limit (10000 per 15 minutes per IP).

**Validation:**

- The file `id` from the URL is required.
- The file's extension must be one supported by OnlyOffice.
- The file's actual MIME type must match the expected type for its extension.
- The server will return a `400 Bad Request` (as JSON or HTML) if a MIME type mismatch is detected.

**Response:**
HTML page with OnlyOffice viewer

## File Serving

### GET `/api/onlyoffice/file/:id`

Serve file to OnlyOffice server (requires signed token).

**Rate limiting:** General API limit (10000 per 15 minutes per IP).

**Response:**
File content

## Callback

### POST `/api/onlyoffice/callback`

OnlyOffice callback endpoint. Called by the OnlyOffice Document Server when document state changes.

**Request Body:**
OnlyOffice callback data including `status`, `key`, `url`, and `forcesavetype`.

**Callback Statuses:**

| Status | Meaning                                                   |
| ------ | --------------------------------------------------------- |
| 0      | Document is being edited                                  |
| 2      | Document is ready for saving (all users closed)           |
| 3      | Document saving error                                     |
| 4      | Document closed with no changes                           |
| 6      | Document is being edited, current state saved (forcesave) |

**Forcesave Types (when status = 6):**

| Type | Trigger                                     |
| ---- | ------------------------------------------- |
| 0    | Command service request (auto-save service) |
| 1    | Save button click (Ctrl+S)                  |
| 2    | Timer-based (autoAssembly)                  |
| 3    | Form submission                             |

**Response:**

```json
{
  "error": 0
}
```

**Note:** The callback returns `error: 0` after it accepts or handles a save callback. A quota rejection returns `error: 1`; an invalid callback token returns `401`.

## Auto-Save

Documents are saved to storage periodically while being edited, not just on close.

**How it works:**

1. When a document is opened through the viewer or config endpoint, the app creates one durable pg-boss schedule for its document key.
2. Every five minutes by default, the standalone worker sends a `forcesave` command to the OnlyOffice Document Server command service API (`/command`). The document key is also sent as the recommended `shardkey` query parameter. If `/command` returns 404, the worker switches to the pre-8.2 path `/coauthoring/CommandService.ashx` for that process run.
3. OnlyOffice responds by calling the callback endpoint with status 6 and `forcesavetype: 0`.
4. The callback handler streams the current document through encryption to object storage, without loading the whole document into memory. After the database points at the new object, deletion of the old object is queued.
5. When all users close the document (status 2 or 4), the app removes its schedule. A command response that says the document is no longer open also removes it.

The command service is an OnlyOffice-supported server API. A successful command returns `error: 0`; `error: 4` means there are no changes to save. Other command and network errors are retried by the queue.

`ONLYOFFICE_AUTOSAVE_INTERVAL_MS` is optional. If omitted, the application uses five minutes. Valid overrides are 1-60 whole minutes that divide evenly into an hour. The background worker must be running for scheduled force-save commands.

**Editor configuration:**

The editor config includes `customization.forcesave: true`, which allows manual saves through Ctrl+S or the save button without closing the document. The worker's command-service request does not depend on that UI setting.

**Command service request format:**

```json
{
  "c": "forcesave",
  "key": "userId-fileId-timestamp"
}
```

When JWT is enabled, the payload is signed and sent as `{ "token": "signed_jwt" }`.

**Files:**

- `backend/services/onlyofficeAutoSave.js` - Auto-save service
- `backend/controllers/onlyoffice/onlyoffice.callback.controller.js` - Callback handler

## Related Topics

- [Files](/docs/api/files) - File management
- [OnlyOffice Integration](/docs/concepts/architecture) - Architecture overview
- [OnlyOffice Issues](/docs/debugging/onlyoffice-issues) - Troubleshooting
