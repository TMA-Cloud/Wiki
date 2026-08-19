---
title: 'API Overview'
description: 'REST API reference for TMA Cloud backend.'
---

REST API reference for TMA Cloud backend.

## Base URL

All API endpoints are prefixed with `/api` unless otherwise specified.

## Authentication

Most endpoints require JWT token sent as httpOnly cookie. Rate limiting: 25 attempts per 15 minutes for login/signup.

## CSRF Header

Every state-changing request under `/api` — `POST`, `PUT`, `PATCH`, `DELETE` those must carry the header:

```bash
X-Requested-With: XMLHttpRequest
```

Requests without it are rejected with `403`:

```json
{ "message": "Forbidden: missing CSRF header" }
```

Safe methods (`GET`, `HEAD`, `OPTIONS`) are exempt. Because the auth token is a cookie, a cross-origin page could otherwise trigger writes on a signed-in user's behalf; a browser will not attach a custom header cross-origin without a preflight the server refuses, so the header is what blocks that. The Electron desktop client sends `X-TMA-Desktop-Client` instead, which is accepted in its place.

The check is not applied to the public routes (`GET /api/signup-status`), the OnlyOffice routes under `/api/onlyoffice`, the version routes under `/api/version`, or the share routes under `/s`.

## Authorization

Endpoints act on the caller's account rather than the individual login, so an account owner and its sub-users share the same files and quota. File endpoints additionally check the caller's permission and return `403` when it is missing. See [Authorization](/docs/concepts/authorization).

## API Sections

- **[Authentication](/docs/api/authentication)** - Login, signup, sessions
- **[Sessions](/docs/api/sessions)** - Session management
- **[Files](/docs/api/files)** - File operations
- **[Sharing](/docs/api/sharing)** - Share links
- **[Users](/docs/api/users)** - User management
- **[OnlyOffice](/docs/api/onlyoffice)** - Document editing
- **[Monitoring](/docs/api/monitoring)** - Health and metrics
- **[Errors](/docs/api/errors)** - Error handling
- **[Examples](/docs/api/examples)** - Code examples

## Rate Limiting

The API employs rate limiting to prevent abuse and ensure service stability. Different limits are applied to authentication, file uploads, and general API endpoints. For detailed information, see the [Rate Limits](/docs/reference/rate-limits) reference.

## Response Format

Success responses return the requested data directly as a JSON object or array.

### Error Response

```json
{
  "message": "Error message"
}
```

For validation errors, the response includes a `details` field:

```json
{
  "message": "Validation failed",
  "details": [{ "field_name": "Specific error message" }]
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created (sub-user creation)
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden (also: missing CSRF header, missing permission, desktop-only mode)
- `404` - Not Found
- `409` - Conflict (email already in use, unique constraint violation)
- `410` - Gone (expired share link)
- `413` - Payload Too Large (storage limit exceeded)
- `415` - Unsupported Media Type (file content contradicts its extension)
- `422` - Unprocessable Entity (Validation Error)
- `429` - Too Many Requests (rate limit or backup-code cooldown)
- `499` - Client Closed Request (upload cancelled by the client)
- `500` - Server Error
- `503` - Service Unavailable (Google OAuth requested while disabled)

## Related Topics

- [Authentication](/docs/concepts/authentication) - Authentication concepts
- [API Examples](/docs/api/examples) - Code examples
- [Error Codes](/docs/api/errors) - Error reference
