---
title: 'Environment Variables'
description: 'Complete reference for all environment variables in TMA Cloud.'
---

Complete reference for all environment variables in TMA Cloud.

## Application Configuration

| Variable      | Required         | Default       | Description                                   |
| ------------- | ---------------- | ------------- | --------------------------------------------- |
| `NODE_ENV`    | No               | `development` | Environment mode                              |
| `BPORT`       | No               | `3000`        | Backend server port                           |
| `BACKEND_URL` | Yes (OnlyOffice) | -             | Public backend URL                            |
| `TRUST_PROXY` | No               | `1`           | Reverse proxy hops to trust for the client IP |

**`TRUST_PROXY`:** Behind a reverse proxy, the client IP is taken from `X-Forwarded-For` rather than the socket. Without this, every request appears to come from the proxy and all users share one rate-limit bucket. The default of `1` matches a single nginx or Traefik in front of the app, as in the shipped Compose files. Set it to the number of proxies if you have more than one, to a comma-separated list of proxy IPs or subnets, or to `0` when there is no proxy.

## Database Configuration

| Variable              | Required | Default             | Description                                       |
| --------------------- | -------- | ------------------- | ------------------------------------------------- |
| `DB_HOST`             | No       | `localhost`         | PostgreSQL host                                   |
| `DB_PORT`             | No       | `5432`              | PostgreSQL port                                   |
| `DB_USER`             | No       | `postgres`          | Database username                                 |
| `DB_PASSWORD`         | Yes      | -                   | Database password                                 |
| `DB_NAME`             | No       | `tma_cloud_storage` | Database name                                     |
| `DB_SSLMODE`          | No       | `disable`           | SSL mode (`require` for TLS)                      |
| `PGBOSS_SCHEMA`       | No       | `pgboss`            | pg-boss job queue schema                          |
| `DB_CONTAINER`        | No       | auto-detected       | Docker container name for backup/restore script   |
| `BACKUP_RETAIN_COUNT` | No       | `10`                | Number of database backups to keep before pruning |

## Redis Configuration

| Variable         | Required | Default     | Description                  |
| ---------------- | -------- | ----------- | ---------------------------- |
| `REDIS_HOST`     | No       | `localhost` | Redis host                   |
| `REDIS_PORT`     | No       | `6379`      | Redis port                   |
| `REDIS_PASSWORD` | No       | -           | Redis password (recommended) |
| `REDIS_DB`       | No       | `0`         | Redis database number        |

**Note:** Redis is optional. App works without it but caching is disabled.

## Authentication

| Variable                 | Required | Default | Description                                               |
| ------------------------ | -------- | ------- | --------------------------------------------------------- |
| `JWT_SECRET`             | Yes      | -       | Secret key for JWT tokens                                 |
| `FORCE_INSECURE_COOKIES` | No       | `false` | If `true`, auth cookie has no `Secure` flag in production |
| `SESSION_IDLE_DAYS`      | No       | `30`    | Days of inactivity before a session ends                  |

**`SESSION_IDLE_DAYS`:** Tokens are issued for this window and re-issued while the user is active, so an active user is not logged out mid-use. A session ends after this many days with no requests. Values below 1 are ignored and fall back to 30. See [Authentication](/docs/concepts/authentication#session-lifetime).

## Google OAuth (Optional)

| Variable               | Required | Description                              |
| ---------------------- | -------- | ---------------------------------------- |
| `GOOGLE_CLIENT_ID`     | No       | Google OAuth Client ID                   |
| `GOOGLE_CLIENT_SECRET` | No       | Google OAuth Client Secret               |
| `GOOGLE_REDIRECT_URI`  | No       | Redirect URI (must match Google Console) |

**Note:** All three must be set to enable Google OAuth.

## File Storage

| Variable              | Required | Default             | Description                        |
| --------------------- | -------- | ------------------- | ---------------------------------- |
| `STORAGE_DRIVER`      | No       | `local`             | `local` or `s3`                    |
| `UPLOAD_DIR`          | No       | `backend/uploads`   | Upload directory (local only)      |
| `FILE_ENCRYPTION_KEY` | No       | Development default | Encryption key for file encryption |

**Note:** All file operations use streaming for large files. No memory limits for file size.

## S3-compatible (when STORAGE_DRIVER=s3)

Supported: **Cloudflare R2** (R2*), **RustFS / other S3** (RUSTFS*), **AWS S3** (AWS\_). Use one set of vars.

### Cloudflare R2

| Setting    | Required | Default | Env var                    |
| ---------- | -------- | ------- | -------------------------- |
| Account ID | Yes\*    | -       | `R2_ACCOUNT_ID`            |
| Bucket     | Yes\*    | -       | `R2_BUCKET`                |
| Access key | Yes\*    | -       | `R2_ACCESS_KEY_ID`         |
| Secret key | Yes\*    | -       | `R2_SECRET_ACCESS_KEY`     |
| Endpoint   | No       | derived | `R2_ENDPOINT` (optional)   |
| Public URL | No       | -       | `R2_PUBLIC_URL` (optional) |

`R2_ACCESS_KEY` and `R2_SECRET_KEY` are accepted as fallbacks for the two key variables, but `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` take precedence when both are set.

\*Required when using R2. Endpoint is `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com` unless `R2_ENDPOINT` is set. Region is set to `auto` for R2.

### Other S3-compatible (RustFS, AWS, etc.)

| Setting    | Required | Default     | Env var (either name)                              |
| ---------- | -------- | ----------- | -------------------------------------------------- |
| Endpoint   | Yes\*    | -           | `RUSTFS_ENDPOINT` or `AWS_S3_ENDPOINT`             |
| Bucket     | Yes\*    | -           | `RUSTFS_BUCKET` or `AWS_S3_BUCKET`                 |
| Access key | Yes\*    | -           | `RUSTFS_ACCESS_KEY` or `AWS_ACCESS_KEY_ID`         |
| Secret key | Yes\*    | -           | `RUSTFS_SECRET_KEY` or `AWS_SECRET_ACCESS_KEY`     |
| Region     | No       | `us-east-1` | `RUSTFS_REGION` or `AWS_REGION`                    |
| Path style | No       | `true`      | `RUSTFS_FORCE_PATH_STYLE` (set `false` to disable) |

\*Required when `STORAGE_DRIVER=s3` and not using R2. Use one set of names consistently.

**Note:** From backend, `npm run s3:protect-all` applies bucket protections (public access block, HTTPS-only policy, versioning, optional encryption, lifecycle). Lifecycle aborts incomplete multipart after 1 day and deletes noncurrent versions after 7 days. Review orphans periodically from **Settings** → **Administration**; see [Orphan Review](/docs/guides/admin/orphan-review).

## Logging Configuration

| Variable              | Required | Default                          | Description                                        |
| --------------------- | -------- | -------------------------------- | -------------------------------------------------- |
| `LOG_LEVEL`           | No       | `info`                           | Log level (fatal, error, warn, info, debug, trace) |
| `LOG_FORMAT`          | No       | `json` (prod), `pretty` (dev)    | Log format (json, pretty)                          |
| `METRICS_ALLOWED_IPS` | No       | `127.0.0.1,::ffff:127.0.0.1,::1` | Comma-separated IPs allowed to access `/metrics`   |

## Audit Logging Configuration

| Variable                   | Required | Default       | Description                       |
| -------------------------- | -------- | ------------- | --------------------------------- |
| `AUDIT_WORKER_CONCURRENCY` | No       | `5`           | Concurrent audit events processed |
| `AUDIT_JOB_TTL_SECONDS`    | No       | `82800` (23h) | Job TTL (must be < 24h)           |

## Last Access Time

| Variable                     | Required | Default | Description                                             |
| ---------------------------- | -------- | ------- | ------------------------------------------------------- |
| `ACCESS_TIME_TRACKING`       | No       | `1`     | Set to `0` or `false` to stop recording access times    |
| `ACCESS_TIME_WINDOW_MINUTES` | No       | `60`    | How stale a stored value must be before it is rewritten |
| `ACCESS_TIME_FLUSH_SECONDS`  | No       | `10`    | How long updates are buffered before being written      |

**`ACCESS_TIME_WINDOW_MINUTES`:** Repeat reads of the same item inside this window are not written down at all. The default of 60 matches the one-hour accuracy NTFS guarantees for its last-access time. Lower it for finer timestamps at the cost of more writes, or set it to `0` to record every read.

**`ACCESS_TIME_FLUSH_SECONDS`:** Updates are held in memory and written in one batched statement per interval, so a download never waits on the write. Raising it reduces the number of statements; lowering it makes timestamps appear sooner. Buffered updates are flushed on shutdown.

**`ACCESS_TIME_TRACKING`:** Turning it off leaves existing `accessed_at` values in place but stops updating them. Windows offers the same switch as `NtfsDisableLastAccessUpdate`. See [File System](/docs/concepts/file-system#last-access-time).

## Related Topics

- [Environment Setup](/docs/getting-started/environment-setup) - Setup guide
- [Docker Compose / Docker](/docs/getting-started/docker) - Docker Compose and env configuration
