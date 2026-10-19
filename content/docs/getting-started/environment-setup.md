---
title: 'Environment Setup'
description: 'The settings a new install needs in .env.'
---

The settings a new install needs in `.env`. Every variable, with its full details, is in [Environment Variables](/docs/reference/environment-variables).

## Application Configuration

| Variable      | Required         | Default       | Description                   |
| ------------- | ---------------- | ------------- | ----------------------------- |
| `APP_ENV`     | No               | `development` | `production` or `development` |
| `PORT`        | No               | `3000`        | App is served on              |
| `BACKEND_URL` | Yes (OnlyOffice) | -             | Public backend URL            |

## Database Configuration

| Variable       | Required | Default | Description               |
| -------------- | -------- | ------- | ------------------------- |
| `DATABASE_URL` | Yes      | -       | PostgreSQL connection URL |

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/tma_cloud_storage
```

Add libpq parameters as a query string, for example `?sslmode=require` for TLS. Percent-encode `@`, `:`, `/`, and `%` in the password. See [Environment Variables](/docs/reference/environment-variables#database-configuration).

## Redis Configuration

| Variable    | Required | Default | Description          |
| ----------- | -------- | ------- | -------------------- |
| `REDIS_URL` | Yes      | -       | Redis connection URL |

```bash
REDIS_URL=redis://:password@localhost:6379/0
```

Use `rediss://` for TLS. The number after the last `/` is the Redis database.

The server does not start without `REDIS_URL`, but it keeps running while Redis is unreachable: caching is off, and live updates reach only clients of the same server process.

## Authentication

| Variable                 | Required | Default | Description                                     |
| ------------------------ | -------- | ------- | ----------------------------------------------- |
| `JWT_SECRET`             | Yes      | -       | Secret key for JWT tokens                       |
| `FORCE_INSECURE_COOKIES` | No       | `false` | If `true`, the auth cookie has no `Secure` flag |

Configure reverse proxy trust after the first login under **Settings** → **Administration** → **Known proxies**. See [Known Proxies](/docs/guides/admin/known-proxies). The session timeout and **Recently opened** tracking are set there too; see [Session Timeout and Recently Opened](/docs/guides/admin/sessions-and-activity).

## File Storage

The S3-compatible bucket is not set in `.env`. After the first account is created, connect it in **Settings** → **Storage**. See [Storage Bucket](/docs/guides/admin/storage-bucket).

| Variable                   | Required         | Default | Description                            |
| -------------------------- | ---------------- | ------- | -------------------------------------- |
| `FILE_ENCRYPTION_KEY`      | Yes (production) | -       | Random 32-byte key in base64 or hex    |
| `FILE_ENCRYPTION_KEY_FILE` | No               | -       | Path to a file holding the key instead |

Generate a key with `openssl rand -base64 32`, or `tma-server key generate`. Back it up outside the server: files cannot be decrypted without it.

Storage limits are not environment variables; the first user sets them per account in **Settings** → **Administration**. See [Storage Limits](/docs/guides/admin/storage-limits).

## Logging Configuration

| Variable              | Required | Default                          | Description                                 |
| --------------------- | -------- | -------------------------------- | ------------------------------------------- |
| `LOG_LEVEL`           | No       | `info`                           | Log level (error, warn, info, debug, trace) |
| `LOG_FORMAT`          | No       | text                             | `json` for one JSON object per line         |
| `METRICS_ALLOWED_IPS` | No       | `127.0.0.1,::ffff:127.0.0.1,::1` | IPs allowed to access `/metrics`            |

## Background Worker

| Variable             | Required | Default | Description                                                                                                                                                             |
| -------------------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WORKER_CONCURRENCY` | No       | `5`     | The most jobs the worker runs at once per queue                                                                                                                         |
| `UPLOAD_MEMORY_MB`   | No       | `512`   | Memory uploads may buffer at once across the server (at least 64). When it is in use, further large uploads wait their turn instead of the server running out of memory |

## Web App

The web app needs no environment variables. The server serves it from the same origin as the API, so it uses relative URLs.

## Next Steps

- [First Login](/docs/getting-started/first-login) - Create your first account
- [Reference: Environment Variables](/docs/reference/environment-variables) - Complete reference
