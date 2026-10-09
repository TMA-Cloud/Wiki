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

### Background Worker

```bash
npm run worker
```

Worker for background jobs and costly tasks.

### Development Worker

```bash
npm run dev:worker
```

Start the background worker in development mode with hot reload.

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

Run the storage driver suite against the configured S3-compatible bucket. It covers multipart upload, ranged reads, multipart copy, and multi-object deletion. Run it separately with each provider configuration, including R2. Requires bucket credentials.

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

### Unused Code

```bash
npm run knip
```

Run [knip](https://knip.dev) to find unused files, exports and dependencies. Exits non-zero when it finds any. The frontend and desktop app define the same script and run knip twice, once with tests and once without, so code that only its own tests use is also reported.

```bash
npm run knip:production
```

Backend only. Run knip without tests. This is a manual audit, not a CI check: the remaining findings should be exports that a module uses itself and that tests reach.

### S3 bucket

Run from backend directory. Uses the bucket saved in **Settings** → **Storage**, read from the database; `.env` must hold the database connection and the app's `FILE_ENCRYPTION_KEY`. The scripts stop with `Storage is not configured` when no bucket is saved.

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

#### Bulk import drive to S3

Use when you have existing data on disk and want it in the app's S3 bucket with encryption and DB records. Copying files directly into the bucket would skip encryption and the `files` table. Requires a bucket saved in **Settings** → **Storage** and the app's `FILE_ENCRYPTION_KEY` (or `FILE_ENCRYPTION_KEY_FILE`) in `.env`.

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
- Scans the source twice: the first pass checks sizes and quota, and the second creates folders and uploads files. It does not keep the full file tree in memory.
- Finalizes uploaded file metadata in batches of 250, with bounded upload concurrency and one quota lock per batch.
- Preserves file and folder modification times (mtime). Created rows and storage keys are recorded in `bulk_import_items` in the same database transaction as their metadata. On the first error, rollback reads that manifest in batches and deletes files before folders.

### Generate an encryption key

```bash
npm run key:generate
```

Print a new random 32-byte key in base64 for `FILE_ENCRYPTION_KEY`. In production the key must be a random 32-byte key in base64 or hex. To replace the key of a running install, use `npm run rotate -- key` instead, which keeps the old key for existing data.

### Rotate keys and passwords

From the **backend** directory:

```bash
npm run rotate -- status         # Key versions and file keys per version
npm run rotate -- key            # Add a new master key version
npm run rotate -- rewrap         # Rewrap stored file keys under the newest version
npm run rotate -- db-password    # New random database password, saved in .env
```

- `key` writes to the file named by `FILE_ENCRYPTION_KEY_FILE`, or to `FILE_ENCRYPTION_KEY` in `.env`. Restart the API, then the worker; the worker rewraps the stored file keys when it starts
- `rewrap` checks every key against the `kek_checks` table first. It changes only the wrapped keys in the database, never the objects in the bucket, and is safe to interrupt and run again
- Docker installs use `./rotate.sh` in the install directory instead

See [Key Rotation](/docs/guides/operations/key-rotation).

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

## Git Hooks

```bash
make hooks
```

Use the repository's git hooks from `.githooks/`. Run once per clone. It sets `core.hooksPath` to `.githooks`. See [Testing — Git Hooks](/docs/guides/operations/testing#git-hooks) for what each hook checks.

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

- Each migration file runs in one transaction together with its row in the `migrations` table. A migration that fails is rolled back completely, the app does not start, and the same migration runs again on the next start.
- A PostgreSQL advisory lock is held while migrations run, so when several app instances start at once, only one applies migrations and the others wait for it.

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
