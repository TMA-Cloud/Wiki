---
title: 'Environment Variables'
description: 'Complete reference for all environment variables in TMA Cloud.'
---

Complete reference for all environment variables in TMA Cloud.

## Application Configuration

| Variable      | Required         | Default       | Description        |
| ------------- | ---------------- | ------------- | ------------------ |
| `NODE_ENV`    | No               | `development` | Environment mode   |
| `PORT`        | No               | `3000`        | App is served on   |
| `BACKEND_URL` | Yes (OnlyOffice) | -             | Public backend URL |

**`PORT`:** Without Docker, the API listens on this port. With Docker Compose, it is the host port: `compose.yml` publishes `${PORT}:3000` and sets `PORT=3000` inside the container, so the app always listens on 3000, the port the image exposes and its health check uses. With `docker run`, map the port instead: `-p 8080:3000`.

**`BACKEND_URL`:** The URL users and the OnlyOffice document server use to reach the app, including the port if it is not 80 or 443. OnlyOffice downloads files and sends saves to this URL, so set it to the public address behind a reverse proxy. It does not change the port the app listens on.

Reverse proxy trust is configured in **Settings** → **Administration** → **Known Proxies**, not through an environment variable. See [Known Proxies](/docs/guides/admin/known-proxies).

## Database Configuration

| Variable               | Required | Default       | Description                                                      |
| ---------------------- | -------- | ------------- | ---------------------------------------------------------------- |
| `DATABASE_URL`         | Yes      | -             | PostgreSQL connection URL                                        |
| `DB_CONTAINER`         | No       | auto-detected | Docker container name for backup/restore script                  |
| `BACKUP_RETAIN_COUNT`  | No       | `10`          | Number of database backups to keep before pruning                |
| `DB_HELD_CURSOR_LIMIT` | No       | `3`           | Folder ZIP downloads that may hold a database connection at once |

**`DATABASE_URL`:** A libpq connection URI:

```bash
DATABASE_URL=postgresql://user:password@host:5432/tma_cloud_storage?sslmode=require
```

- The scheme is `postgresql://` or `postgres://`. The port defaults to `5432`.
- Query parameters are libpq parameters, for example `sslmode`, `sslrootcert`, `sslcert`, `sslkey`, `application_name`, `connect_timeout`, and `options`.
- `sslmode` has its libpq meaning, the same as in `psql` and `pg_dump`: `disable`, `require` (encrypt, do not verify the certificate), `verify-ca` (verify against `sslrootcert`), or `verify-full` (also check the host name). Without `sslmode`, the app connects without TLS.
- Percent-encode characters that have a meaning in a URL when they appear in the user, password, or database name: `@` as `%40`, `:` as `%3A`, `/` as `%2F`, `%` as `%25`.
- The URL must name a database. The app does not start without `DATABASE_URL`.

The pg-boss job queue uses the `pgboss` schema in the same database.

**`DB_HELD_CURSOR_LIMIT`:** A folder ZIP lists its files through a database cursor. Trees of up to 20,000 entries are read at the start and the connection goes back to the pool within milliseconds. A larger tree keeps its connection for the whole download, and this variable caps how many such downloads can do that at once, per API process. Every folder ZIP takes a slot while it reads its tree, so when all slots are held by large downloads, new folder downloads wait for a free slot before they start. The API process uses the `pg` default pool of 10 connections, so keep this well below 10.

## Redis Configuration

| Variable    | Required | Default | Description          |
| ----------- | -------- | ------- | -------------------- |
| `REDIS_URL` | Yes      | -       | Redis connection URL |

**`REDIS_URL`:** `redis://[user]:password@host:port/database`, for example `redis://:password@localhost:6379/0`. Use `rediss://` to connect over TLS. The port defaults to `6379` and the database to `0`. Leave out the user to use the `default` user, and leave out `:password@` when Redis has no password. Percent-encode reserved characters in the password, as for `DATABASE_URL`.

**Note:** `REDIS_URL` must be set, but the Redis server is optional. If the app cannot reach it, it keeps running without caching.

## Authentication

| Variable                 | Required | Default | Description                                               |
| ------------------------ | -------- | ------- | --------------------------------------------------------- |
| `JWT_SECRET`             | Yes      | -       | Secret key for JWT tokens                                 |
| `FORCE_INSECURE_COOKIES` | No       | `false` | If `true`, auth cookie has no `Secure` flag in production |

The session timeout is not an environment variable. The first user sets it in **Settings** → **Administration**; see [Session Timeout and Last Opened](/docs/guides/admin/sessions-and-activity).

## Google Sign-In (Optional)

Google sign-in is not configured through environment variables. The first user enters the OAuth client in **Settings** → **Administration**, and its client secret is stored encrypted in the database. See [Google Sign-In](/docs/guides/admin/google-sign-in).

## File Storage

| Variable                   | Required         | Default             | Description                                             |
| -------------------------- | ---------------- | ------------------- | ------------------------------------------------------- |
| `FILE_ENCRYPTION_KEY`      | Yes (production) | Development default | KEKs for files, the bucket secret and the Google secret |
| `FILE_ENCRYPTION_KEY_FILE` | No               | -                   | Path to a file holding `FILE_ENCRYPTION_KEY`            |

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

| Variable                         | Required | Default | Description                                      |
| -------------------------------- | -------- | ------- | ------------------------------------------------ |
| `ONLYOFFICE_REJECT_UNAUTHORIZED` | No       | `true`  | Set to `false` for a self-signed OnlyOffice cert |

Force-save runs every five minutes. The standalone worker must be running for scheduled force-save commands.

Keep `ONLYOFFICE_REJECT_UNAUTHORIZED` enabled unless the document server uses a self-signed certificate on a trusted network.

## Desktop Development

| Variable                    | Required | Default           | Description                                     |
| --------------------------- | -------- | ----------------- | ----------------------------------------------- |
| `TMA_CLOUDFS_EXE`           | No       | Build output path | Cloud Drive host executable override            |
| `TMA_CLOUD_CLIPBOARD_DEBUG` | No       | `0`               | Set to `1` to log desktop clipboard diagnostics |

These variables affect the Electron client and are not server settings. Clipboard diagnostics can contain local file paths; disable them outside development.

## Logging Configuration

| Variable              | Required | Default                          | Description                                        |
| --------------------- | -------- | -------------------------------- | -------------------------------------------------- |
| `LOG_LEVEL`           | No       | `info`                           | Log level (fatal, error, warn, info, debug, trace) |
| `METRICS_ALLOWED_IPS` | No       | `127.0.0.1,::ffff:127.0.0.1,::1` | Comma-separated IPs allowed to access `/metrics`   |

## Audit Logging Configuration

| Variable                   | Required | Default       | Description                                 |
| -------------------------- | -------- | ------------- | ------------------------------------------- |
| `AUDIT_WORKER_CONCURRENCY` | No       | `5`           | Audit batch size and worker concurrency cap |
| `AUDIT_JOB_TTL_SECONDS`    | No       | `82800` (23h) | Job TTL (must be < 24h)                     |

## Related Topics

- [Environment Setup](/docs/getting-started/environment-setup) - Setup guide
- [Docker Compose / Docker](/docs/getting-started/docker) - Docker Compose and env configuration
