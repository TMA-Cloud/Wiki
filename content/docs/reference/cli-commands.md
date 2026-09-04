---
title: 'CLI Commands'
description: 'Command-line interface commands for TMA Cloud.'
---

Command-line interface commands for TMA Cloud.

## Backend Commands

### Start Application

```bash
npm start
```

Start the main application server.

### Development Mode

```bash
npm run dev
```

Start application in development mode with hot reload.

### Audit Worker

```bash
npm run worker
```

Start the audit event processing worker (required in production).

### Development Worker

```bash
npm run dev:worker
```

Start audit worker in development mode with hot reload.

### Tests

```bash
npm test
```

Run the unit and route-level test suites. Needs no database or cache.

```bash
npm run test:watch
```

Re-run affected tests as files change.

```bash
npm run test:coverage
```

Run the unit suites and write a coverage report to `backend/coverage`.

```bash
npm run test:ui
```

Open the Vitest UI for interactive runs.

```bash
npm run test:integration
```

Run the suite that uses PostgreSQL and Redis. Requires a `tma_cloud_test` database; see [Testing](/docs/guides/operations/testing).

```bash
npm run test:integration:coverage
```

Same, with a coverage report in `backend/coverage-integration`.

```bash
npm run test:s3
```

Run the storage driver suite against the configured S3 bucket. Requires `STORAGE_DRIVER=s3` credentials.

```bash
npm run test:all
```

Run the unit suite, then the integration suite.

### Linting

```bash
npm run lint
```

Run ESLint to check code quality.

```bash
npm run lint:fix
```

Run ESLint and automatically fix issues.

### Formatting

```bash
npm run format
```

Format code with Prettier.

```bash
npm run format:check
```

Check code formatting without making changes.

### S3 bucket (when STORAGE_DRIVER=s3)

Run from backend directory. Uses project S3 config.

```bash
npm run s3:protect-all
```

Apply all bucket protections: block public access; bucket policy (HTTPS only); versioning; default SSE if supported; lifecycle (abort incomplete multipart + delete old versions and delete markers).

```bash
npm run s3:lifecycle
```

Apply lifecycle rules only: abort incomplete multipart uploads after 1 day; delete noncurrent versions after 7 days; remove expired delete markers.

```bash
npm run s3:policy-https
```

Apply bucket policy that denies HTTP (HTTPS only).

```bash
npm run s3:public-block
```

Block public access (private bucket).

```bash
npm run s3:versioning
```

Enable versioning on the bucket.

```bash
npm run s3:encryption
```

Enable default server-side encryption (AES256). Not supported by all S3-compatible stores; script exits with error if unsupported.

To check current lifecycle config from project root: `node backend/scripts/check-s3-lifecycle.js`.

### Bulk import (drive to storage)

**Requirement:** the database must be reachable from the host. If the app runs in Docker, uncomment the postgres `ports` in `docker-compose.yml` (e.g. `127.0.0.1:5432:5432`) so the host can connect.

#### Bulk import drive to local

Use when you have existing data on disk and want it in the app's **local** storage with encryption and DB records. Requires `STORAGE_DRIVER=local` and `FILE_ENCRYPTION_KEY` in `.env`. Files land in `UPLOAD_DIR`.

From the **backend** directory:

```bash
# Dry run: list folders/files and total size only
node scripts/bulk-import-drive-to-local.js --source-dir "D:\MyDrive" --user-id YOUR_USER_ID --dry-run

# Import (creates folder hierarchy in DB, encrypts and copies each file)
node scripts/bulk-import-drive-to-local.js --source-dir "D:\MyDrive" --user-id YOUR_USER_ID

# Use email instead of user ID
node scripts/bulk-import-drive-to-local.js --source-dir "D:\MyDrive" --user-email "you@example.com"

# Optional: more concurrent copies (default 2)
node scripts/bulk-import-drive-to-local.js --source-dir "D:\MyDrive" --user-id YOUR_USER_ID --concurrency 4
```

- Preserves folder structure; invalid file names are sanitized with a warning.
- Enforces per-user storage limit and max file size (checked before any copy).
- Preserves file and folder modification times (mtime).

#### Bulk import drive to S3

Use when you have existing data on disk and want it in the app's S3 bucket with encryption and DB records. Copying files directly into the bucket would skip encryption and the `files` table. Requires S3 env vars and `FILE_ENCRYPTION_KEY` in `.env`.

From the **backend** directory:

```bash
# Dry run: list folders/files and total size only
node scripts/bulk-import-drive-to-s3.js --source-dir "D:\MyDrive" --user-id YOUR_USER_ID --dry-run

# Import (creates folder hierarchy in DB, encrypts and uploads each file)
node scripts/bulk-import-drive-to-s3.js --source-dir "D:\MyDrive" --user-id YOUR_USER_ID

# Use email instead of user ID
node scripts/bulk-import-drive-to-s3.js --source-dir "D:\MyDrive" --user-email "you@example.com"

# Optional: more concurrent uploads (default 2)
node scripts/bulk-import-drive-to-s3.js --source-dir "D:\MyDrive" --user-id YOUR_USER_ID --concurrency 4

```

- Preserves folder structure; invalid file names are sanitized with a warning.
- Enforces per-user storage limit and max file size (checked before any upload).
- Preserves file and folder modification times (mtime). On first error, S3 script rolls back created folders and uploaded files.

### Migrate to streaming encryption (one-time)

Stored files use Google Tink's AES-GCM-HKDF-STREAMING format (`AES256_GCM_HKDF_1MB`). If you are upgrading from the earlier single-blob format (`[IV][DATA][TAG]`), run this once to convert existing objects to the segmented format.

- Run it with the app **stopped**, before deploying the upgrade
- Uses the same `FILE_ENCRYPTION_KEY` but it re-wraps the bytes, not the key
- Auto-detects the storage driver (local or S3)
- Safe to re-run: objects already in the streaming format are detected and skipped

From the **backend** directory:

```bash
node scripts/migrate-to-streaming-encryption.js
```

### Rotate FILE_ENCRYPTION_KEY (KEK)

`FILE_ENCRYPTION_KEY` is the key-encryption key (KEK) that wraps each file's data key (DEK). Rotating it only rewraps the stored DEKs — a database update per file — and never reads or rewrites the encrypted objects, so it works the same for local and S3.

Steps:

1. Set the new key as `FILE_ENCRYPTION_KEY` and bump `FILE_KEK_VERSION` (for example `1` → `2`).
2. Keep the previous key as `FILE_ENCRYPTION_KEY_V<oldVersion>` (for example `FILE_ENCRYPTION_KEY_V1`) so the old DEKs can be unwrapped.
3. Run it from the **backend** directory:

   ```bash
   npm run rotate:kek
   ```

4. Once it reports `Remaining=0`, remove the old `FILE_ENCRYPTION_KEY_V<oldVersion>`.

Notes:

- No objects are downloaded or re-uploaded
- Safe to interrupt and re-run: only files still wrapped under an older KEK are touched
- Failures are written to a `kek-rotation-failures-*.json` manifest

### Backfill envelope encryption (one-time)

Run once on a deployment created before envelope encryption, to give existing files their own DEK. Reads each object, re-encrypts it under a fresh DEK, and records the wrapped DEK on the row.

- Run with the app **stopped**, after applying migrations and taking a backup
- Re-encrypts to a new storage key, flips the database row, then deletes the old object — safe to interrupt and re-run
- Failures are written to an `envelope-backfill-failures-*.json` manifest
- `--concurrency N` sets how many objects are re-encrypted at once (default 8). Each is a full download + re-encrypt + re-upload, so raise it for many small files on a fast link (16–32)

```bash
npm run backfill:envelope
```

## Docker Commands

### Using Prebuilt Images (Recommended)

Prebuilt Docker images are available on GitHub Container Registry:

```bash
docker pull ghcr.io/tma-cloud/tma:latest
docker pull ghcr.io/tma-cloud/tma:3.0.0
```

### Build Image from Source

```bash
make build
```

Build Docker image with default tag.

```bash
make build IMAGE_TAG=3.0.0
```

Build Docker image with custom tag. The `version` image label is read from `backend/package.json` regardless of the tag you pass.

```bash
make build-no-cache
```

Build Docker image without cache.

```bash
make clean
```

Remove the built image.

```bash
make help
```

List the available targets and configuration variables.

### Docker Compose

```bash
docker compose up -d
```

Start all services in background.

```bash
docker compose down
```

Stop all services.

```bash
docker compose restart
```

Restart all services.

```bash
docker compose logs -f
```

View logs from all services.

```bash
docker compose logs -f app
```

View logs from app service only.

## Database Commands

### PostgreSQL

```bash
psql -h localhost -U postgres -d tma_cloud_storage
```

Connect to PostgreSQL database. Substitute your `DB_NAME` if you changed it.

### Migrations

Migrations run automatically on application startup.

### Backup & Restore

```bash
./scripts/db-backup-restore.sh backup
```

Full database backup. Outputs a compressed `.dump` file with a `.meta` sidecar (SHA-256 checksum, table row counts, backup metadata).

```bash
./scripts/db-backup-restore.sh restore backups/<file>.dump
```

Restore database from a backup. Validates integrity before touching the database, restores in single-transaction mode.

```bash
./scripts/db-backup-restore.sh verify backups/<file>.dump
```

Verify a backup file's SHA-256 checksum and dump TOC without restoring.

```bash
./scripts/db-backup-restore.sh list
```

List available backups with file sizes and dates.

The script auto-detects the PostgreSQL Docker container. Override with `DB_CONTAINER` env var. See [Backups](/docs/guides/operations/backups) for details.

## Related Topics

- [Installation](/docs/getting-started/installation) - Setup guide
- [Docker Compose / Docker](/docs/getting-started/docker) - Docker Compose and prebuilt images
- [Testing](/docs/guides/operations/testing) - Test suites and what each one needs
