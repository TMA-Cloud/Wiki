---
title: 'API Overview'
description: 'REST API reference for TMA Cloud backend.'
---

REST API reference for TMA Cloud backend.

## Base URL

All API endpoints are prefixed with `/api` unless otherwise specified.

## Authentication

Most endpoints require JWT token sent as httpOnly cookie. Rate limiting: 25 attempts per 15 minutes for login/signup.

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
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Unprocessable Entity (Validation Error)
- `500` - Server Error
- `503` - Service Unavailable

## Related Topics

- [Authentication](/docs/concepts/authentication) - Authentication concepts
- [API Examples](/docs/api/examples) - Code examples
- [Error Codes](/docs/api/errors) - Error reference
