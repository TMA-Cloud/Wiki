---
title: 'Environment Variables'
description: 'Complete reference for all environment variables in TMA Cloud.'
---

Complete reference for all environment variables in TMA Cloud.

## Application Configuration

| Variable      | Required         | Default       | Description         |
| ------------- | ---------------- | ------------- | ------------------- |
| `NODE_ENV`    | No               | `development` | Environment mode    |
| `BPORT`       | No               | `3000`        | Backend server port |
| `BACKEND_URL` | Yes (OnlyOffice) | -             | Public backend URL  |

Reverse proxy trust is configured in **Settings** → **Administration** → **Known Proxies**, not through an environment variable. See [Known Proxies](/docs/guides/admin/known-proxies).

## Database Configuration

| Variable               | Required | Default             | Description                                                      |
| ---------------------- | -------- | ------------------- | ---------------------------------------------------------------- |
| `DB_HOST`              | No       | `localhost`         | PostgreSQL host                                                  |
| `DB_PORT`              | No       | `5432`              | PostgreSQL port                                                  |
| `DB_USER`              | No       | `postgres`          | Database username                                                |
| `DB_PASSWORD`          | Yes      | -                   | Database password                                                |
| `DB_NAME`              | No       | `tma_cloud_storage` | Database name                                                    |
| `DB_SSLMODE`           | No       | `disable`           | SSL mode (`require` for TLS)                                     |
| `PGBOSS_SCHEMA`        | No       | `pgboss`            | pg-boss job queue schema                                         |
| `DB_CONTAINER`         | No       | auto-detected       | Docker container name for backup/restore script                  |
| `BACKUP_RETAIN_COUNT`  | No       | `10`                | Number of database backups to keep before pruning                |
| `DB_HELD_CURSOR_LIMIT` | No       | `3`                 | Folder ZIP downloads that may hold a database connection at once |

**`DB_HELD_CURSOR_LIMIT`:** A folder ZIP lists its files through a database cursor. Trees of up to 20,000 entries are read at the start and the connection goes back to the pool within milliseconds. A larger tree keeps its connection for the whole download, and this variable caps how many such downloads can do that at once, per API process. Every folder ZIP takes a slot while it reads its tree, so when all slots are held by large downloads, new folder downloads wait for a free slot before they start. The API process uses the `pg` default pool of 10 connections, so keep this well below 10.

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

| Variable                   | Required         | Default             | Description                                               |
| -------------------------- | ---------------- | ------------------- | --------------------------------------------------------- |
| `FILE_ENCRYPTION_KEY`      | Yes (production) | Development default | Key-encryption keys (KEK) for files and the bucket secret |
| `FILE_ENCRYPTION_KEY_FILE` | No               | -                   | Path to a file holding `FILE_ENCRYPTION_KEY`              |

**`FILE_ENCRYPTION_KEY`:** A single key, or a keyring of `version:key` entries after a rotation: one per line in a key file, comma-separated in `.env`. A key without a version is version 1. The highest version encrypts new data and the others still decrypt. In production the newest key must be a random 32-byte key, written as base64 (44 characters) or hex (64 characters). The server refuses to start with a passphrase. Generate a key from the `backend` directory with `npm run key:generate`. Outside production a passphrase is accepted and stretched with PBKDF2.

**Docker:** `docker-compose.yml` sets `FILE_ENCRYPTION_KEY_FILE=/run/secrets/file_encryption_key` for the app and worker and mounts `secrets/file_encryption_key` there. Leave `FILE_ENCRYPTION_KEY` empty in `.env`. See [Docker Deployment](/docs/getting-started/docker#secrets).

**`_FILE` variables:** The key can be given as `FILE_ENCRYPTION_KEY_FILE` instead, holding the path of a file that contains it, for example `FILE_ENCRYPTION_KEY_FILE=/run/secrets/file_encryption_key`. This keeps the key out of `docker inspect` output and the process environment. Setting both is an error. Lines starting with `#` in the file are ignored.

**Startup check:** The API and the worker compare each key in the keyring with a check value stored in the `kek_checks` table and refuse to start if one does not match, or if stored data uses a version the keyring lacks. See [Security Model](/docs/concepts/security-model#key-check).

**Note:** File contents use bounded streaming. The multipart uploader buffers at most four parts per active upload. Per-file size is controlled by the max upload size setting in **Settings** → **Storage**.

**Key rotation:** `./rotate.sh key` on Docker, or `npm run rotate -- key` from the `backend` directory. See [Key Rotation](/docs/guides/operations/key-rotation).

## Storage Bucket

The S3-compatible bucket is not configured through environment variables. The first user connects it in **Settings** → **Storage**, and its secret access key is stored encrypted in the database. See [Storage Bucket](/docs/guides/admin/storage-bucket).

**Note:** From backend, `npm run s3:protect-all` applies bucket protections (public access block, HTTPS-only policy, versioning, optional encryption, lifecycle) to the saved bucket. Lifecycle aborts incomplete multipart after 1 day and deletes noncurrent versions after 7 days. Review orphans periodically from **Settings** → **Administration**; see [Orphan Review](/docs/guides/admin/orphan-review).

## OnlyOffice Background Save

| Variable                          | Required | Default  | Description                                      |
| --------------------------------- | -------- | -------- | ------------------------------------------------ |
| `ONLYOFFICE_AUTOSAVE_INTERVAL_MS` | No       | `300000` | Interval for worker force-save schedules         |
| `ONLYOFFICE_REJECT_UNAUTHORIZED`  | No       | `true`   | Set to `false` for a self-signed OnlyOffice cert |

`ONLYOFFICE_AUTOSAVE_INTERVAL_MS` is optional. Do not set it when the five-minute default is suitable. Valid overrides are 1-60 whole minutes that divide evenly into an hour; invalid values use five minutes. The standalone worker must be running for scheduled force-save commands.

Keep `ONLYOFFICE_REJECT_UNAUTHORIZED` enabled unless the document server uses a self-signed certificate on a trusted network.

## Desktop Development

| Variable                    | Required | Default           | Description                                     |
| --------------------------- | -------- | ----------------- | ----------------------------------------------- |
| `TMA_CLOUDFS_EXE`           | No       | Build output path | Cloud Drive host executable override            |
| `TMA_CLOUD_CLIPBOARD_DEBUG` | No       | `0`               | Set to `1` to log desktop clipboard diagnostics |

These variables affect the Electron client and are not server settings. Clipboard diagnostics can contain local file paths; disable them outside development.

## Logging Configuration

| Variable                         | Required | Default                          | Description                                        |
| -------------------------------- | -------- | -------------------------------- | -------------------------------------------------- |
| `LOG_LEVEL`                      | No       | `info`                           | Log level (fatal, error, warn, info, debug, trace) |
| `METRICS_ALLOWED_IPS`            | No       | `127.0.0.1,::ffff:127.0.0.1,::1` | Comma-separated IPs allowed to access `/metrics`   |
| `QUEUE_METRICS_INTERVAL_SECONDS` | No       | `60`                             | Audit queue gauge refresh interval (minimum 10)    |

## Audit Logging Configuration

| Variable                   | Required | Default       | Description                                 |
| -------------------------- | -------- | ------------- | ------------------------------------------- |
| `AUDIT_WORKER_CONCURRENCY` | No       | `5`           | Audit batch size and worker concurrency cap |
| `AUDIT_JOB_TTL_SECONDS`    | No       | `82800` (23h) | Job TTL (must be < 24h)                     |

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
