---
title: 'Error Codes'
description: 'Complete reference for all error codes in TMA Cloud API.'
---

Complete reference for all error codes in TMA Cloud API.

## How Errors Are Returned

Every error response carries a `message`. Only some carry a machine-readable `error` code as well:

```json
{
  "message": "File too large",
  "error": "FILE_TOO_LARGE"
}
```

The list below is the complete set of `error` values the backend emits. Anything not listed here returns `message` alone, so clients should branch on the HTTP status code and fall back to `message` rather than expecting a code for every failure.

## Upload and Storage

| Code                     | Status | When                                                                          |
| ------------------------ | ------ | ----------------------------------------------------------------------------- |
| `FILE_TOO_LARGE`         | 400    | Upload exceeds the configured max upload size (multer `LIMIT_FILE_SIZE`)      |
| `UNEXPECTED_FILE`        | 400    | File arrived on a form field the endpoint does not accept                     |
| `STORAGE_LIMIT_EXCEEDED` | 413    | The upload would push the account past its quota                              |
| `STORAGE_CHECK_FAILED`   | 500    | The quota could not be read, so the upload is refused rather than let through |
| `REQUEST_ABORTED`        | 499    | Client cancelled the upload mid-request                                       |

## Files and Documents

| Code                 | Status | When                                                                                                                                                        |
| -------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FILE_NOT_FOUND`     | 404    | Filesystem `ENOENT` reached the error handler                                                                                                               |
| `MIME_TYPE_MISMATCH` | 400    | OnlyOffice viewer: stored MIME type contradicts the extension. Returned as JSON for XHR requests; direct browser navigation gets an HTML error page instead |

## Authentication

| Code            | Status | When                    |
| --------------- | ------ | ----------------------- |
| `INVALID_TOKEN` | 401    | JWT failed verification |
| `TOKEN_EXPIRED` | 401    | JWT is past its expiry  |

Login failures, missing MFA codes and permission denials return a `message` only — there is no `INVALID_CREDENTIALS` or `FORBIDDEN` code to match on. Use the status code.

## Access Restrictions

| Code                  | Status | When                                                                   |
| --------------------- | ------ | ---------------------------------------------------------------------- |
| `DESKTOP_ONLY_ACCESS` | 403    | Instance is in desktop-app-only mode and the request is from a browser |
| `PERMISSION_DENIED`   | 403    | Filesystem `EACCES` reached the error handler                          |

## Database

| Code                 | Status | When                                       |
| -------------------- | ------ | ------------------------------------------ |
| `DUPLICATE_RESOURCE` | 409    | PostgreSQL unique violation (`23505`)      |
| `INVALID_REFERENCE`  | 400    | PostgreSQL foreign key violation (`23503`) |

## System

| Code                 | Status | When                                                         |
| -------------------- | ------ | ------------------------------------------------------------ |
| `INTERNAL_ERROR`     | 500    | Anything that reaches the error handler unmatched            |
| `FRONTEND_NOT_BUILT` | 404    | A non-API route was requested but `frontend/dist` is missing |

## Validation Errors

Validation failures return `422` with a `details` array rather than an `error` code:

```json
{
  "message": "Validation failed",
  "details": [{ "email": "Invalid email format" }]
}
```

## Rate Limit Errors

The rate limiters return `429` with an `error` field holding a **human-readable sentence**, not a code:

```json
{ "error": "Too many requests, please try again later" }
```

The backup-code cooldown is the exception — it returns `message` plus `retryAfterMs`. See [Rate Limits](/docs/reference/rate-limits).

## Related Topics

- [API Errors](/docs/api/errors) - Error handling
- [Debugging](/docs/debugging/common-errors) - Troubleshooting
