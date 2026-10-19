---
title: 'API Overview'
description: 'How the TMA Cloud REST API authenticates, protects and answers requests.'
---

How the TMA Cloud REST API authenticates, protects and answers requests.

## Base URL

All API endpoints are prefixed with `/api` unless otherwise specified.

## Authentication

Most endpoints need a signed-in session: the `token` cookie that `POST /api/login` sets. It is httpOnly, so page scripts cannot read it. See [Authentication API](/docs/api/authentication).

## CSRF Header

Every state-changing request under `/api` (`POST`, `PUT`, `PATCH`, `DELETE`) must carry the header:

```bash
X-Requested-With: XMLHttpRequest
```

Requests without it are rejected with `403`:

```json
{ "message": "Forbidden: missing CSRF header" }
```

Safe methods (`GET`, `HEAD`, `OPTIONS`) are exempt. Because the auth token is a cookie, a cross-origin page could otherwise trigger writes on a signed-in user's behalf; a browser will not attach a custom header cross-origin without a preflight the server refuses, so the header is what blocks that. The desktop app sends `X-TMA-Desktop-Client` instead, which is accepted in its place.

The check is not applied to the public routes (`GET /api/signup-status`), the OnlyOffice routes under `/api/onlyoffice`, the version routes under `/api/version`, the share routes under `/s`, or `POST /api/files/download/bulk/form`, which checks a ticket from a guarded request instead (see [Files](/docs/api/files#post-apifilesdownloadbulkform)).

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

Separate limits apply to sign-in, uploads and the general API. See [Rate Limits](/docs/reference/rate-limits).

## Responses

A success returns the data as JSON. A queued file operation returns `202` with a `jobId` to poll. An error returns a status and a `message`; see [Error Handling](/docs/api/errors) and [Error Codes](/docs/reference/error-codes).

## Related Topics

- [Authentication](/docs/concepts/authentication) - Authentication concepts
- [API Examples](/docs/api/examples) - Code examples
- [Error Codes](/docs/reference/error-codes) - Error reference
