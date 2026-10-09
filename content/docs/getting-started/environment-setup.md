---
title: 'Environment Setup'
description: 'Environment variable reference for TMA Cloud.'
---

Environment variable reference for TMA Cloud.

## Application Configuration

| Variable      | Required         | Default       | Description         |
| ------------- | ---------------- | ------------- | ------------------- |
| `NODE_ENV`    | No               | `development` | Environment mode    |
| `BPORT`       | No               | `3000`        | Backend server port |
| `BACKEND_URL` | Yes (OnlyOffice) | -             | Public backend URL  |

## Database Configuration

| Variable        | Required | Default             | Description              |
| --------------- | -------- | ------------------- | ------------------------ |
| `DB_HOST`       | No       | `localhost`         | PostgreSQL host          |
| `DB_PORT`       | No       | `5432`              | PostgreSQL port          |
| `DB_USER`       | No       | `postgres`          | Database username        |
| `DB_PASSWORD`   | Yes      | -                   | Database password        |
| `DB_NAME`       | No       | `tma_cloud_storage` | Database name            |
| `DB_SSLMODE`    | No       | `disable`           | SSL mode                 |
| `PGBOSS_SCHEMA` | No       | `pgboss`            | pg-boss job queue schema |

## Redis Configuration

| Variable         | Required | Default     | Description                  |
| ---------------- | -------- | ----------- | ---------------------------- |
| `REDIS_HOST`     | No       | `localhost` | Redis host                   |
| `REDIS_PORT`     | No       | `6379`      | Redis port                   |
| `REDIS_PASSWORD` | No       | -           | Redis password (recommended) |
| `REDIS_DB`       | No       | `0`         | Redis database number        |

**Note:** Redis is optional. App works without it but caching is disabled.

## Authentication

| Variable                 | Required | Default | Description                                     |
| ------------------------ | -------- | ------- | ----------------------------------------------- |
| `JWT_SECRET`             | Yes      | -       | Secret key for JWT tokens                       |
| `SESSION_IDLE_DAYS`      | No       | `30`    | Days of inactivity before a session ends        |
| `FORCE_INSECURE_COOKIES` | No       | `false` | If `true`, the auth cookie has no `Secure` flag |

Configure reverse proxy trust after the first login under **Settings** → **Administration** → **Known Proxies**. See [Known Proxies](/docs/guides/admin/known-proxies).

## Google OAuth (Optional)

| Variable               | Required | Description                              |
| ---------------------- | -------- | ---------------------------------------- |
| `GOOGLE_CLIENT_ID`     | No       | Google OAuth Client ID                   |
| `GOOGLE_CLIENT_SECRET` | No       | Google OAuth Client Secret               |
| `GOOGLE_REDIRECT_URI`  | No       | Redirect URI (must match Google Console) |

**Note:** All three must be set to enable Google OAuth.

The sign-in flow uses a `state` value and PKCE, and only links or creates an account when Google reports the email as verified. See [Authentication](/docs/concepts/authentication#google-oauth-optional).

## File Storage

The S3-compatible bucket is not set in `.env`. After the first account is created, connect it in **Settings** → **Storage**. See [Storage Bucket](/docs/guides/admin/storage-bucket).

| Variable                   | Required         | Default | Description                            |
| -------------------------- | ---------------- | ------- | -------------------------------------- |
| `FILE_ENCRYPTION_KEY`      | Yes (production) | -       | Random 32-byte key in base64 or hex    |
| `FILE_ENCRYPTION_KEY_FILE` | No               | -       | Path to a file holding the key instead |

Generate a key with `openssl rand -base64 32`, or `npm run key:generate` from the `backend` directory. Back it up outside the server: files cannot be decrypted without it.

**Note:** Storage limits are configured per-user in Settings (admin only). See [Environment Variables](/docs/reference/environment-variables#file-storage) for key rotation.

## Logging Configuration

| Variable                         | Required | Default                          | Description                                        |
| -------------------------------- | -------- | -------------------------------- | -------------------------------------------------- |
| `LOG_LEVEL`                      | No       | `info`                           | Log level (fatal, error, warn, info, debug, trace) |
| `LOG_FORMAT`                     | No       | `json` (prod), `pretty` (dev)    | Log format (json, pretty)                          |
| `METRICS_ALLOWED_IPS`            | No       | `127.0.0.1,::ffff:127.0.0.1,::1` | IPs allowed to access `/metrics`                   |
| `QUEUE_METRICS_INTERVAL_SECONDS` | No       | `60`                             | Audit queue gauge refresh interval                 |

## Audit Logging Configuration

| Variable                   | Required | Default       | Description                       |
| -------------------------- | -------- | ------------- | --------------------------------- |
| `AUDIT_WORKER_CONCURRENCY` | No       | `5`           | Concurrent audit events processed |
| `AUDIT_JOB_TTL_SECONDS`    | No       | `82800` (23h) | Job TTL (must be < 24h)           |

## OnlyOffice Background Save

| Variable                          | Required | Default  | Description                |
| --------------------------------- | -------- | -------- | -------------------------- |
| `ONLYOFFICE_AUTOSAVE_INTERVAL_MS` | No       | `300000` | Worker force-save interval |

Omit this variable to keep the five-minute default. See [Environment Variables](/docs/reference/environment-variables#onlyoffice-background-save) for accepted overrides.

## Last Access Time

| Variable                     | Required | Default | Description                   |
| ---------------------------- | -------- | ------- | ----------------------------- |
| `ACCESS_TIME_TRACKING`       | No       | `1`     | Set to `0` or `false` to stop |
| `ACCESS_TIME_WINDOW_MINUTES` | No       | `60`    | Per-item suppression window   |
| `ACCESS_TIME_FLUSH_SECONDS`  | No       | `10`    | Buffer flush interval         |

## Frontend Environment Variables

**No frontend environment variables required!**

Single-Origin Architecture means frontend uses relative URLs and is served from the same origin as the backend.

## Next Steps

- [First Login](/docs/getting-started/first-login) - Create your first account
- [Reference: Environment Variables](/docs/reference/environment-variables) - Complete reference
