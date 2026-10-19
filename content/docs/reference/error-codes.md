---
title: 'Error Codes'
description: 'Every machine-readable error code the TMA Cloud API returns.'
---

Every machine-readable error code the TMA Cloud API returns.

## How Errors Are Returned

Every error response carries a `message`. Some also carry a machine-readable `error` code:

```json
{
  "message": "Storage limit exceeded",
  "error": "STORAGE_LIMIT_EXCEEDED"
}
```

The tables below list every `error` code the server sends. Any other error has a `message` only, so branch on the HTTP status and show `message` rather than expecting a code.

## Upload and Storage

| Code                     | Status | When                                                                  |
| ------------------------ | ------ | --------------------------------------------------------------------- |
| `STORAGE_LIMIT_EXCEEDED` | 413    | The upload or save would take the account past its storage limit      |
| `STORAGE_NOT_CONFIGURED` | 503    | No bucket is saved yet; returned by any request for file contents     |
| `STORAGE_PROBE_FAILED`   | 422    | A bucket connection check failed; the body includes the failed `step` |

## Documents

| Code                 | Status | When                                                                                                                                                      |
| -------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MIME_TYPE_MISMATCH` | 400    | OnlyOffice: the file content does not match its extension. Returned as JSON for API requests; a browser opening the link directly gets an HTML error page |

## Access Restrictions

| Code                  | Status | When                                                                   |
| --------------------- | ------ | ---------------------------------------------------------------------- |
| `DESKTOP_ONLY_ACCESS` | 403    | Instance is in desktop-app-only mode and the request is from a browser |

Failed sign-ins, missing two-factor codes, expired sessions and permission denials have no code. Use the status: `401` for sign-in and session problems, `403` for a missing permission.

## Database

| Code                 | Status | When                                       |
| -------------------- | ------ | ------------------------------------------ |
| `DUPLICATE_RESOURCE` | 409    | PostgreSQL unique violation (`23505`)      |
| `INVALID_REFERENCE`  | 400    | PostgreSQL foreign key violation (`23503`) |

## System

| Code                 | Status | When                                                                      |
| -------------------- | ------ | ------------------------------------------------------------------------- |
| `INTERNAL_ERROR`     | 500    | An unexpected failure. The full error is in the server log, not the reply |
| `FRONTEND_NOT_BUILT` | 404    | A non-API route was requested but the web app build is missing            |

## Validation Errors

Validation failures return `422` with a `details` array rather than an `error` code:

```json
{
  "message": "Validation failed",
  "details": [{ "email": "Invalid email format" }]
}
```

## Rate Limit Errors

The rate limiters return `429` with the same sentence in `message` and in `error`; it is not a code:

```json
{
  "message": "Too many requests, please try again later",
  "error": "Too many requests, please try again later"
}
```

The backup-code cooldown returns `message` plus `retryAfterMs` instead. See [Rate Limits](/docs/reference/rate-limits).

## Related Topics

- [API Errors](/docs/api/errors) - Error handling
- [Debugging](/docs/debugging/common-errors) - Troubleshooting
