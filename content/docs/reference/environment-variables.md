---
title: 'Environment Variables'
description: 'Complete reference for all environment variables in TMA Cloud.'
---

Complete reference for all environment variables in TMA Cloud.

## Application Configuration

| Variable       | Required         | Default       | Description                   |
| -------------- | ---------------- | ------------- | ----------------------------- |
| `APP_ENV`      | No               | `development` | `production` or `development` |
| `PORT`         | No               | `3000`        | App is served on              |
| `BACKEND_URL`  | Yes (OnlyOffice) | -             | Public backend URL            |
| `WEB_DIST_DIR` | No               | auto-detected | Folder with the built web app |

**`APP_ENV`:** `production` turns on secure cookies and refuses development-only keys. `NODE_ENV` is still read when `APP_ENV` is not set, so an existing `.env` keeps working.

**`WEB_DIST_DIR`:** The Docker image sets it to `/app/web`. A source checkout finds `apps/tma-cloud-web/dist` without it.

**`PORT`:** Without Docker, the API listens on this port. With Docker Compose, it is the host port: `compose.yml` publishes `${PORT}:3000` and sets `PORT=3000` inside the container, so the app always listens on 3000, the port the image exposes and its health check uses. With `docker run`, map the port instead: `-p 8080:3000`.

**`BACKEND_URL`:** The URL users and the OnlyOffice document server use to reach the app, including the port if it is not 80 or 443. OnlyOffice downloads files and sends saves to this URL, so set it to the public address behind a reverse proxy. It does not change the port the app listens on.

Reverse proxy trust is configured in **Settings** → **Administration** → **Known proxies**, not through an environment variable. See [Known Proxies](/docs/guides/admin/known-proxies).

## Database Configuration

| Variable               | Required | Default       | Description                                                      |
| ---------------------- | -------- | ------------- | ---------------------------------------------------------------- |
| `DATABASE_URL`         | Yes      | -             | PostgreSQL connection URL                                        |
| `DB_CONTAINER`         | No       | auto-detected | Docker container name for backup/restore script                  |
| `BACKUP_RETAIN_COUNT`  | No       | `10`          | Number of database backups to keep before pruning                |
| `DB_HELD_CURSOR_LIMIT` | No       | `3`           | Folder ZIP downloads that may hold a database connection at once |
| `DB_POOL_MAX`          | No       | `20`          | Database connections each process keeps open                     |

**`DATABASE_URL`:** A libpq connection URI:

```bash
DATABASE_URL=postgresql://user:password@host:5432/tma_cloud_storage?sslmode=require
```

- The scheme is `postgresql://` or `postgres://`. The port defaults to `5432`.
- Query parameters are libpq parameters, for example `sslmode`, `sslrootcert`, `sslcert`, `sslkey`, `application_name`, `connect_timeout`, and `options`.
- `sslmode` has its libpq meaning, the same as in `psql` and `pg_dump`: `disable`, `require` (encrypt, do not verify the certificate), `verify-ca` (verify against `sslrootcert`), or `verify-full` (also check the host name). Without `sslmode`, the app connects without TLS.
- Percent-encode characters that have a meaning in a URL when they appear in the user, password, or database name: `@` as `%40`, `:` as `%3A`, `/` as `%2F`, `%` as `%25`.
- The URL must name a database. The app does not start without `DATABASE_URL`.

Background jobs are stored in the `job_queue` and `job_schedules` tables of the same database.

**`DB_POOL_MAX`:** The API and the worker each keep their own pool, so the database needs room for twice this many connections, plus any backup or admin sessions.

**`DB_HELD_CURSOR_LIMIT`:** A folder ZIP lists its files through a database cursor. Trees of up to 20,000 entries are read at the start and the connection goes back to the pool within milliseconds. A larger tree keeps its connection for the whole download, and this variable caps how many such downloads can do that at once, per API process. Every folder ZIP takes a slot while it reads its tree, so when all slots are held by large downloads, new folder downloads wait for a free slot before they start. Keep it well below `DB_POOL_MAX`.

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
| `JWT_SECRET_FILE`        | No       | -       | Path to a file holding `JWT_SECRET`                       |

The session timeout is not an environment variable. The first user sets it in **Settings** → **Administration**; see [Session Timeout and Last Opened](/docs/guides/admin/sessions-and-activity).

## Google Sign-In (Optional)

Google sign-in is not configured through environment variables. The first user enters the OAuth client in **Settings** → **Administration**, and its client secret is stored encrypted in the database. See [Google Sign-In](/docs/guides/admin/google-sign-in).

## File Storage

| Variable                   | Required         | Default             | Description                                             |
| -------------------------- | ---------------- | ------------------- | ------------------------------------------------------- |
| `FILE_ENCRYPTION_KEY`      | Yes (production) | Development default | KEKs for files, the bucket secret and the Google secret |
| `FILE_ENCRYPTION_KEY_FILE` | No               | -                   | Path to a file holding `FILE_ENCRYPTION_KEY`            |

**`FILE_ENCRYPTION_KEY`:** A single key, or a keyring of `version:key` entries after a rotation: one per line in a key file, comma-separated in `.env`. A key without a version is version 1. The highest version encrypts new data and the others still decrypt. In production the newest key must be a random 32-byte key, written as base64 (44 characters) or hex (64 characters). The server refuses to start with a passphrase. Generate a key with `tma-server key generate`. Outside production a passphrase is accepted and stretched with PBKDF2.

**Docker:** `docker-compose.yml` sets `FILE_ENCRYPTION_KEY_FILE=/run/secrets/file_encryption_key` for the app and worker and mounts `secrets/file_encryption_key` there. Leave `FILE_ENCRYPTION_KEY` empty in `.env`. See [Docker Deployment](/docs/getting-started/docker#secrets).

**`_FILE` variables:** The key can be given as `FILE_ENCRYPTION_KEY_FILE` instead, holding the path of a file that contains it, for example `FILE_ENCRYPTION_KEY_FILE=/run/secrets/file_encryption_key`. This keeps the key out of `docker inspect` output and the process environment. Setting both is an error. Lines starting with `#` in the file are ignored.

**Startup check:** The API and the worker compare each key in the keyring with a check value stored in the `kek_checks` table and refuse to start if one does not match, or if stored data uses a version the keyring lacks. See [Security Model](/docs/concepts/security-model#key-check).

**Note:** File contents use bounded streaming. The multipart uploader buffers at most four parts per active upload. Per-file size is controlled by the max upload size setting in **Settings** → **Storage**.

**Key rotation:** `./rotate.sh key` on Docker, or `tma-server rotate key`. See [Key Rotation](/docs/guides/operations/key-rotation).

## Storage Bucket

The S3-compatible bucket is not configured through environment variables. The first user connects it in **Settings** → **Storage**, and its secret access key is stored encrypted in the database. See [Storage Bucket](/docs/guides/admin/storage-bucket).

**Note:** `tma-server s3 protect-all` applies bucket protections (public access block, HTTPS-only policy, versioning, optional encryption, lifecycle) to the saved bucket. Lifecycle aborts incomplete multipart after 1 day and deletes noncurrent versions after 7 days. Review orphans periodically from **Settings** → **Administration**; see [Orphan Review](/docs/guides/admin/orphan-review).

## OnlyOffice Background Save

| Variable                         | Required | Default | Description                                      |
| -------------------------------- | -------- | ------- | ------------------------------------------------ |
| `ONLYOFFICE_REJECT_UNAUTHORIZED` | No       | `true`  | Set to `false` for a self-signed OnlyOffice cert |

Force-save runs every five minutes. The standalone worker must be running for scheduled force-save commands.

`ONLYOFFICE_REJECT_UNAUTHORIZED` applies when the app downloads a saved document from the document server. Keep it enabled unless the document server uses a self-signed certificate on a trusted network.

## Logging Configuration

| Variable              | Required | Default                          | Description                                      |
| --------------------- | -------- | -------------------------------- | ------------------------------------------------ |
| `LOG_LEVEL`           | No       | `info`                           | Log level (error, warn, info, debug, trace)      |
| `LOG_FORMAT`          | No       | text                             | `json` for one JSON object per line              |
| `RUST_LOG`            | No       | -                                | Per-module filter; overrides `LOG_LEVEL`         |
| `METRICS_ALLOWED_IPS` | No       | `127.0.0.1,::ffff:127.0.0.1,::1` | Comma-separated IPs allowed to access `/metrics` |

See [Logging](/docs/guides/operations/logging).

## Update Feed

| Variable       | Required | Default                                             | Description                                                |
| -------------- | -------- | --------------------------------------------------- | ---------------------------------------------------------- |
| `VERSIONS_URL` | No       | `https://tma-cloud.github.io/updates/versions.json` | The release feed behind `/api/version/latest` (https only) |

The feed is published from the [TMA-Cloud/updates](https://github.com/TMA-Cloud/updates) repository. Point `VERSIONS_URL` at another copy (for example a branch's raw `versions.json`) to try a release before it is published to everyone; desktop apps signed in to this server then update to the version it names.

## Background Worker

| Variable                   | Required | Default | Description                                     |
| -------------------------- | -------- | ------- | ----------------------------------------------- |
| `AUDIT_WORKER_CONCURRENCY` | No       | `5`     | The most jobs the worker runs at once per queue |

The name is kept from earlier versions. Audit events no longer go through the worker; see [Audit Logs](/docs/guides/operations/audit-logs).

## Related Topics

- [Environment Setup](/docs/getting-started/environment-setup) - Setup guide
- [Docker Compose / Docker](/docs/getting-started/docker) - Docker Compose and env configuration
