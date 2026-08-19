---
title: 'Sharing API'
description: 'Share link endpoints for TMA Cloud.'
---

Share link endpoints for TMA Cloud.

**Note:** There is no share-specific limiter. Routes under `/s/` use the general API limiter: 10000 requests per 15 minutes. Share links are unauthenticated, so the key is the IP address. Because these are the only routes reachable without a session, put a tighter limit in front of `/s/` at your reverse proxy if you publish links widely. See [Rate Limits](/docs/reference/rate-limits).

## Share Links (Public)

### GET `/s/:token`

View shared files/folders.

**Validation:**

- `token`: Required. Must be a non-empty string.

**Responses:**

- **200** - HTML page with shared files
- **404** - Link does not exist or has been removed
- **410** - Link has expired

### GET `/s/:token/file/:id`

Download a file from a share link.

**Validation:**

- `token`: Required. Must be a non-empty string.
- `id`: Required. Must be a non-empty string.

**Responses:**

- **200** - File download
- **404** - Link or file not found
- **410** - Link has expired

### GET `/s/:token/zip`

Download a folder as ZIP from a share link.

**Validation:**

- `token`: Required. Must be a non-empty string.

**Responses:**

- **200** - ZIP archive download
- **404** - Link not found or not a folder
- **410** - Link has expired

## Related Topics

- [Files](/docs/api/files) - File management endpoints
- [Sharing Model](/docs/concepts/sharing-model) - How sharing works
