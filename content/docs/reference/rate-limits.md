---
title: 'Rate Limits'
description: 'Rate limiting configuration and limits for TMA Cloud API.'
---

Rate limiting configuration and limits for TMA Cloud API.

## Rate Limit Configuration

Rate limits are enforced per IP address and/or user for different endpoint types to prevent abuse and ensure service stability.

**Behind a reverse proxy:** limits keyed by IP need `TRUST_PROXY` set correctly, otherwise every request looks like it came from the proxy and all users share a single bucket. See [Environment Variables](/docs/reference/environment-variables). Sub-users count separately from their account owner, since keys use the individual login.

## Endpoint Limits

### Authentication Limiter

- **Limit:** 25 requests per 15 minutes per IP/email combination.
- **Purpose:** Limits login/signup attempts per IP and email.
- **Endpoints:**
  - `POST /api/login`
  - `POST /api/signup`
  - `POST /api/change-password`
  - `GET /api/google/callback`

### General API Limiter

- **Limit:** 10000 requests per 15 minutes, keyed per user when authenticated and per IP address otherwise.
- **Purpose:** Limits general API usage. Keying on the user means colleagues sharing an office IP do not share a bucket.
- **Endpoints:**
  - Public endpoints (e.g. `GET /api/signup-status`).
  - Authenticated auth and profile endpoints (e.g. `/api/profile`, `/api/sessions`, `/api/mfa/*`, `/api/logout`).
  - All file operation endpoints under `/api/files/`.
  - All user management endpoints under `/api/user/` (including `GET /api/user/signup-status`).
  - All version check endpoints under `/api/version/`.
  - OnlyOffice configuration, viewer, and file-serving endpoints under `/api/onlyoffice/`.
  - All public share link endpoints under `/s/`.

### Public Share Links

There is no share-specific limiter. Routes under `/s/` use the General API Limiter above.

- **Limit:** 10000 requests per 15 minutes. Share links are unauthenticated, so the key is the IP address.
- **Endpoints:** All endpoints under `/s/`.

Because share links are the only routes reachable without a session, this budget is the one most exposed to anonymous traffic. If you publish links widely, put a lower limit in front of `/s/` at your reverse proxy.

### Upload Limiter

- **Limit:** 20000 uploads per 30 minutes per user (or per IP if unauthenticated).
- **Purpose:** Limits upload volume per user.
- **Endpoints:**
  - `POST /api/files/upload`
  - `POST /api/files/upload/bulk`
  - `POST /api/files/upload/check`
  - `POST /api/files/:id/replace`
  - `POST /api/files/:id/derived`

### Specialized MFA Limiters

- **MFA Verification/Disabling:** 5 attempts per minute, keyed on IP + user ID. The limit is this tight because each attempt runs a bcrypt comparison, which is deliberately expensive.
  - `POST /api/mfa/verify`
  - `POST /api/mfa/disable`
  - `POST /api/google/mfa-verify` (only registered when Google OAuth is configured)
- **Backup Code Regeneration:** 3 attempts per 10 minutes, keyed on IP + user ID.
  - `POST /api/mfa/backup-codes/regenerate`

### SSE Connection Limiter

- **Limit:** 20 concurrent Server-Sent Events connections per user.
- **Purpose:** Limits real-time event streams per user.
- **Endpoint:** `GET /api/files/events`

## Rate Limit Headers

Responses for rate-limited requests include the following headers:

- `RateLimit-Limit`: The maximum number of requests allowed in the current window.
- `RateLimit-Remaining`: The number of requests remaining in the current window.
- `RateLimit-Reset`: The time when the limit resets, in UTC seconds.
- `Retry-After`: The number of seconds to wait before making a new request (sent with 429 responses).

## Rate Limit Errors

When a rate limit is exceeded:

**Status Code:** `429 Too Many Requests`

**Response:**

```json
{
  "error": "Too many requests, please try again later"
}
```

Note that the limiters put the sentence in an `error` field rather than a `message` field, unlike the rest of the API.

The backup-code cooldown is separate from the limiter above it and answers in the normal shape, with the remaining wait included:

```json
{
  "message": "Please wait 3 minutes and 45 seconds before regenerating backup codes again",
  "retryAfterMs": 225000
}
```

A regeneration request therefore hits `429` for either of two reasons: the 3-per-10-minutes limiter, or the 5-minute cooldown between successful regenerations.

## Best Practices

- Implement exponential backoff for retries.
- Use the `Retry-After` header to time subsequent requests.
- Cache API responses when possible to reduce unnecessary requests.
- Use bulk endpoints where available to consolidate operations.

## Related Topics

- [API Overview](/docs/api/overview) - API reference
- [Environment Variables](/docs/reference/environment-variables) - `TRUST_PROXY` and other settings
- [Error Codes](/docs/reference/error-codes) - Error reference
