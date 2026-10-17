---
title: 'Environment Setup'
description: 'Environment variable reference for TMA Cloud.'
---

Environment variable reference for TMA Cloud.

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

**Note:** The Redis server is optional. If the app cannot reach it, caching is disabled.

## Authentication

| Variable                 | Required | Default | Description                                     |
| ------------------------ | -------- | ------- | ----------------------------------------------- |
| `JWT_SECRET`             | Yes      | -       | Secret key for JWT tokens                       |
| `FORCE_INSECURE_COOKIES` | No       | `false` | If `true`, the auth cookie has no `Secure` flag |

Configure reverse proxy trust after the first login under **Settings** → **Administration** → **Known proxies**. See [Known Proxies](/docs/guides/admin/known-proxies). The session timeout and last-opened tracking are set there too; see [Session Timeout and Last Opened](/docs/guides/admin/sessions-and-activity).

## Google Sign-In (Optional)

Google sign-in is not configured through environment variables. After the first login, the first user enters the OAuth client in **Settings** → **Administration** → **Google Sign-In**. See [Google Sign-In](/docs/guides/admin/google-sign-in).

## File Storage

The S3-compatible bucket is not set in `.env`. After the first account is created, connect it in **Settings** → **Storage**. See [Storage Bucket](/docs/guides/admin/storage-bucket).

| Variable                   | Required         | Default | Description                            |
| -------------------------- | ---------------- | ------- | -------------------------------------- |
| `FILE_ENCRYPTION_KEY`      | Yes (production) | -       | Random 32-byte key in base64 or hex    |
| `FILE_ENCRYPTION_KEY_FILE` | No               | -       | Path to a file holding the key instead |

Generate a key with `openssl rand -base64 32`, or `tma-server key generate`. Back it up outside the server: files cannot be decrypted without it.

**Note:** Storage limits are configured per-user in Settings (admin only). See [Environment Variables](/docs/reference/environment-variables#file-storage) for key rotation.

## Logging Configuration

| Variable              | Required | Default                          | Description                                 |
| --------------------- | -------- | -------------------------------- | ------------------------------------------- |
| `LOG_LEVEL`           | No       | `info`                           | Log level (error, warn, info, debug, trace) |
| `LOG_FORMAT`          | No       | text                             | `json` for one JSON object per line         |
| `METRICS_ALLOWED_IPS` | No       | `127.0.0.1,::ffff:127.0.0.1,::1` | IPs allowed to access `/metrics`            |

## Background Worker

| Variable                   | Required | Default | Description                                     |
| -------------------------- | -------- | ------- | ----------------------------------------------- |
| `AUDIT_WORKER_CONCURRENCY` | No       | `5`     | The most jobs the worker runs at once per queue |

## Web App

The web app needs no environment variables. The server serves it from the same origin as the API, so it uses relative URLs.

## Next Steps

- [First Login](/docs/getting-started/first-login) - Create your first account
- [Reference: Environment Variables](/docs/reference/environment-variables) - Complete reference
