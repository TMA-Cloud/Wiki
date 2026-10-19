---
title: 'CLI Commands'
description: 'Command-line interface commands for TMA Cloud.'
---

Command-line interface commands for TMA Cloud.

## Server Commands

The server is one program, `tma-server`. It serves the API and web app, runs the background worker, and has the admin commands below. In a Docker install, run them in the app container: `docker compose exec app tma-server <command>`. From a source checkout, use `cargo run -p tma-server -- <command>`.

### Start Application

```bash
tma-server serve
```

Serve the API and the web app. `serve` is the default when no command is given.

```bash
tma-server serve --with-worker
```

Also run the background worker in the same process. Useful for a single-process install or development.

### Background Worker

```bash
tma-server worker
```

Run the background worker only: queued file operations, maintenance, orphan scans and OnlyOffice saves. See [Background Workers](/docs/guides/operations/background-workers).

### Migrations

```bash
tma-server migrate
```

Apply database migrations and exit. `serve` and `worker` also apply them at startup.

- Each migration file runs in one transaction together with its row in the `migrations` table. A migration that fails is rolled back completely, the app does not start, and the same migration runs again on the next start.
- A PostgreSQL advisory lock is held while migrations run, so when several app instances start at once, only one applies migrations and the others wait for it.

### Health Check

```bash
tma-server healthcheck
```

Exit with status 0 when the server in this container answers `/health` on `PORT`. The Docker image uses it for its health check.

## Development Commands

From the repository root:

```bash
cargo xtask ci
```

Run the checks CI runs: formatting (rustfmt and Prettier), the house rules (file size, copied code and duplicate functions, unused dependencies, theme colours), Clippy with warnings as errors, all unit tests, and the WebAssembly build of the web app.

```bash
cargo xtask fmt
```

Format Rust with rustfmt and Markdown, YAML, JSON, HTML and CSS with Prettier. `--check` only reports.

```bash
cargo xtask house
```

Check the house rules on their own: no file over 400 lines of code, no copied blocks of 10 or more lines, no two functions with the same body, no unused dependencies, and theme colours only. `--sizes` lists the largest files; `--near` also reports copies that differ only in literals.

```bash
cargo test -p tma-server --test api
```

Run the end-to-end server suite against PostgreSQL, Redis and an S3-compatible bucket; see [Testing](/docs/guides/operations/testing).

```bash
cd apps/tma-cloud-web && trunk build --release
```

Build the web app into `apps/tma-cloud-web/dist`, where a source checkout's server finds it.

```bash
cargo run -p tma-cloud
```

Run the desktop app.

## Admin Commands

### S3 Bucket

Uses the bucket saved in **Settings** → **Storage**, read from the database; `.env` must hold the database connection and the app's `FILE_ENCRYPTION_KEY`. The commands stop with `Connect a storage bucket in Settings > Storage first` when no bucket is saved.

```bash
tma-server s3 protect-all
```

Apply all bucket protections: block public access; bucket policy (HTTPS only); versioning; default SSE if supported; lifecycle (abort incomplete multipart + delete old versions and delete markers).

```bash
tma-server s3 lifecycle
```

Apply lifecycle rules only: abort incomplete multipart uploads after 1 day; delete noncurrent versions after 7 days; remove expired delete markers.

```bash
tma-server s3 policy-https
```

Apply bucket policy that denies HTTP (HTTPS only).

```bash
tma-server s3 public-block
```

Block public access (private bucket).

```bash
tma-server s3 versioning
```

Enable versioning on the bucket.

```bash
tma-server s3 encryption
```

Enable default server-side encryption (AES256). Not supported by all S3-compatible stores; the command exits with an error if unsupported.

```bash
tma-server s3 check-lifecycle
```

Print the bucket's current lifecycle rules.

### Bulk Import (Drive to Storage)

Use when you have existing data on disk and want it in the app's S3 bucket with encryption and DB records. Copying files directly into the bucket would skip encryption and the `files` table. Requires a bucket saved in **Settings** → **Storage** and the app's `FILE_ENCRYPTION_KEY` (or `FILE_ENCRYPTION_KEY_FILE`).

**Requirement:** the source folder must be readable by the command. In Docker, mount it into the app container, or run `tma-server` on the host with the database reachable (uncomment the postgres `ports` in `docker-compose.yml`, e.g. `127.0.0.1:5432:5432`).

```bash
# Dry run: count folders, files and total size only
tma-server import --source-dir "D:\MyDrive" --user-id YOUR_USER_ID --dry-run

# Import (creates the folder tree, encrypts and uploads each file)
tma-server import --source-dir "D:\MyDrive" --user-id YOUR_USER_ID

# Use email instead of user ID
tma-server import --source-dir "D:\MyDrive" --user-email "you@example.com"

# Optional: more concurrent uploads (default 2)
tma-server import --source-dir "D:\MyDrive" --user-id YOUR_USER_ID --concurrency 4
```

- Preserves folder structure; invalid file names are sanitized.
- Enforces the per-user storage limit and the max file size before anything is written.
- Finalizes uploaded file metadata in batches of 250, with bounded upload concurrency.
- Preserves file and folder modification times. Created rows and storage keys are recorded in `bulk_import_items`. On the first error, the run is rolled back: files and their objects first, then folders.

### Generate an Encryption Key

```bash
tma-server key generate
```

Print a new random 32-byte key in base64 for `FILE_ENCRYPTION_KEY`. In production the key must be a random 32-byte key in base64 or hex. To replace the key of a running install, use `tma-server rotate key` instead, which keeps the old key for existing data.

### Rotate Keys and Passwords

```bash
tma-server rotate status         # Key versions and file keys per version
tma-server rotate key            # Add a new master key version
tma-server rotate rewrap         # Rewrap stored file keys under the newest version
tma-server rotate db-password    # New random database password, saved in DATABASE_URL in .env
```

- `key` writes to the file named by `FILE_ENCRYPTION_KEY_FILE`, or to `FILE_ENCRYPTION_KEY` in `.env`. Restart the server, then the worker; the worker rewraps the stored file keys when it starts
- `rewrap` checks every key against the `kek_checks` table first. It changes only the wrapped keys in the database, never the objects in the bucket, and is safe to interrupt and run again
- `db-password --stdin` reads the new password from standard input and saves nothing; `rotate.sh` uses it
- Docker installs use `./rotate.sh` in the install directory instead

See [Key Rotation](/docs/guides/operations/key-rotation).

## Docker Commands

### Using Prebuilt Images (Recommended)

Prebuilt Docker images are available on GitHub Container Registry:

```bash
docker pull ghcr.io/tma-cloud/tma:latest
docker pull ghcr.io/tma-cloud/tma:4.0.0
```

### Build Image from Source

```bash
make build
```

Build Docker image with default tag.

```bash
make build IMAGE_TAG=4.0.0
```

Build Docker image with custom tag. The `version` image label is read from the workspace `Cargo.toml` regardless of the tag you pass.

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

## Git Hooks

```bash
make hooks
```

Use the repository's git hooks from `.githooks/`. Run once per clone. It sets `core.hooksPath` to `.githooks`. See [Testing — Git Hooks](/docs/guides/operations/testing#git-hooks) for what each hook checks.

## Database Commands

### PostgreSQL

```bash
psql "$DATABASE_URL"
```

Connect to the PostgreSQL database with the URL from `.env`. `psql` reads the same URL, including `sslmode` and other parameters, as the app. On Docker, run it in the container: `docker compose exec postgres sh -c 'psql "$DATABASE_URL"'`.

### Backup & Restore

```bash
./db-backup-restore.sh backup
```

Full database backup. Outputs a compressed `.dump` file with a `.meta` sidecar (SHA-256 checksum, table row counts, backup metadata).

```bash
./db-backup-restore.sh restore backups/<file>.dump
```

Restore database from a backup. Checks the file first, restores into a scratch database, and replaces the live database only when that worked.

```bash
./db-backup-restore.sh verify backups/<file>.dump
```

Verify a backup file's SHA-256 checksum and dump TOC without restoring.

```bash
./db-backup-restore.sh list
```

List available backups with file sizes and dates.

Run it from the install directory, where `setup.sh` puts it; in a repository checkout it is `scripts/db-backup-restore.sh`. It uses the `postgres` service of the Compose project in that directory, the container named by `DB_CONTAINER`, or the PostgreSQL client tools on the host. See [Backups](/docs/guides/operations/backups) for details.

## Related Topics

- [Installation](/docs/getting-started/installation) - Setup guide
- [Docker Compose / Docker](/docs/getting-started/docker) - Docker Compose and prebuilt images
- [Testing](/docs/guides/operations/testing) - Test suites and what each one needs
