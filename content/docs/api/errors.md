---
title: 'Error Handling'
description: 'The shape of API error responses and the status codes the server uses.'
---

The shape of API error responses and the status codes the server uses.

## Error Response Format

Every error response has a `message`. Some also have an `error` code; see [Error Codes](/docs/reference/error-codes).

```json
{
  "message": "Error description"
}
```

### Validation Errors

Validation errors (HTTP status `422`) provide additional detail in a `details` array, specifying which fields failed validation and why.

**Format:**

```json
{
  "message": "Validation failed",
  "details": [
    { "field_name": "Specific error message for the field." },
    { "another_field": "Another specific error." }
  ]
}
```

**Example:**

```json
{
  "message": "Validation failed",
  "details": [
    { "email": "Invalid email format" },
    { "password": "Password must be between 8 and 128 characters" }
  ]
}
```

## Common HTTP Status Codes

- `400 Bad Request`: The request was malformed, such as containing invalid JSON.
- `401 Unauthorized`: Authentication is required and has failed or has not been provided.
- `403 Forbidden`: The authenticated user does not have permission to perform the action, or a state-changing request arrived without the `X-Requested-With: XMLHttpRequest` CSRF header (see [API Overview](/docs/api/overview#csrf-header)).
- `404 Not Found`: The requested resource could not be found.
- `409 Conflict`: The resource already exists, for example a sub-user email already in use, or someone else holds the file's edit lock.
- `410 Gone`: The share link has expired.
- `413 Payload Too Large`: The file is larger than the maximum upload size, or the upload would take the account past its storage limit (`STORAGE_LIMIT_EXCEEDED`).
- `422 Unprocessable Entity`: The request was well-formed but could not be processed due to validation errors. Check the `details` field for more information.
- `429 Too Many Requests`: A rate limit was reached. See [Rate Limits](/docs/reference/rate-limits).
- `500 Internal Server Error`: An unexpected condition was encountered on the server.
- `503 Service Unavailable`: The server is not ready to handle the request. File content requests return `503` with `STORAGE_NOT_CONFIGURED` until a bucket is saved in **Settings** → **Storage**.

### Desktop-Only Instances

When an instance is configured for desktop app access only, browser requests to main app routes return `403 Forbidden` with:

```json
{
  "message": "This instance is configured for desktop app access only.",
  "error": "DESKTOP_ONLY_ACCESS"
}
```

Share links (`/s/*`), `/health`, `/metrics`, `/api/onlyoffice/file/*`, and `/api/onlyoffice/callback` are not affected. The two OnlyOffice endpoints are called by the Document Server, which does not send the desktop header.

## Handling Errors

- Branch on the HTTP status, and on `error` where one is sent.
- Show `message` to the user; it is written for people.
- For `422`, show each entry of `details` next to its field.

## Related Topics

- [API Overview](/docs/api/overview) - General API structure and formats.
- [Debugging](/docs/debugging/common-errors) - Troubleshooting common errors.
