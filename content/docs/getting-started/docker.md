---
title: 'Docker Deployment'
description: 'Docker deployment guide for TMA Cloud.'
---

Docker deployment guide for TMA Cloud.

## Prerequisites

- Docker (v29.0+)
- Docker Compose (v5.0+)

## Setup Script

```bash
curl -fsSL https://raw.githubusercontent.com/TMA-Cloud/TMA/main/setup.sh | bash
```

To read the script before running it:

```bash
curl -fsSLO https://raw.githubusercontent.com/TMA-Cloud/TMA/main/setup.sh
less setup.sh
bash setup.sh
```

The script:

1. Checks for Docker, the `docker compose` command, and `openssl` or `/dev/urandom`
2. Creates `./tma-cloud` and downloads `docker-compose.yml` as `compose.yml`, `.env.example` as `.env`, and `setup.sh`, `update.sh`, `rotate.sh`, and `db-backup-restore.sh` over HTTPS only
3. Sets `DATABASE_URL` to `postgresql://postgres:<password>@postgres:5432/tma_cloud_storage` and `REDIS_URL` to `redis://:<password>@redis:6379/0`, each with 32 random bytes as hex for the password, and fills `JWT_SECRET` (64 random bytes, hex)
4. Writes a random 32-byte `FILE_ENCRYPTION_KEY` to `secrets/file_encryption_key` as key version 1, instead of `.env`
5. Sets permissions: the directory `0700`, `.env` `0600`, `secrets/` `0700`. The key file is `0444`, or owned by uid 1001 with `0400` when run as root (see [Secrets](#secrets))
6. Runs `docker compose up -d`

The whole script runs from one function called on its last line, so a download cut off midway runs nothing.

Re-running it is safe. It keeps an existing `compose.yml`, `.env`, and key file, because a new encryption key would make every stored file unreadable. It records the SHA-256 hash of each file it installs in `.tma-manifest`, which `update.sh` uses to tell your edits from older versions.

To update to a new version, run `./update.sh` in the install directory. See [Updating](/docs/guides/operations/updating).

To rotate the encryption key or the database and Redis passwords later, run `./rotate.sh` in the install directory. See [Key Rotation](/docs/guides/operations/key-rotation).

**Options** (environment variables):

| Variable           | Default                   | Description                                                 |
| ------------------ | ------------------------- | ----------------------------------------------------------- |
| `TMA_DIR`          | `./tma-cloud`             | Install directory                                           |
| `TMA_REF`          | `main`                    | Git branch or tag to download the files from                |
| `TMA_PORT`         | `3000`                    | Host port, written to `PORT`                                |
| `TMA_URL`          | `http://localhost:<port>` | Public URL, written to `BACKEND_URL`                        |
| `TMA_NO_START`     | -                         | Set to `1` to prepare the files without starting containers |
| `TMA_LOCAL_SOURCE` | -                         | Copy the files from a repository checkout (script testing)  |

Example: `curl -fsSL https://raw.githubusercontent.com/TMA-Cloud/TMA/main/setup.sh | TMA_PORT=8080 TMA_URL=https://cloud.example.com bash`

## Manual Setup

```bash
mkdir tma-cloud && cd tma-cloud
curl -fsSL -o compose.yml https://raw.githubusercontent.com/TMA-Cloud/TMA/main/docker-compose.yml
curl -fsSL -o .env https://raw.githubusercontent.com/TMA-Cloud/TMA/main/.env.example
chmod 600 .env
mkdir -m 700 secrets
openssl rand -base64 32 > secrets/file_encryption_key
chmod 444 secrets/file_encryption_key
```

Edit `.env`: set `DATABASE_URL` and `REDIS_URL` to the Compose service names with new passwords, and set a new `JWT_SECRET` (for example `openssl rand -hex 32` for each):

```bash
DATABASE_URL=postgresql://postgres:<password>@postgres:5432/tma_cloud_storage
REDIS_URL=redis://:<password>@redis:6379/0
```

Leave `FILE_ENCRYPTION_KEY` empty. Then:

```bash
docker compose up -d
```

Starts four services:

- **App** (`tma-cloud-app`) - Main application
- **PostgreSQL** (`tma-cloud-postgres`) - Database
- **Redis** (`tma-cloud-redis`) - Caching layer
- **Worker** (`tma-cloud-worker`) - File operations, maintenance, and OnlyOffice saves

Access at `http://localhost:3000` (or the `PORT` in `.env`). Inside the container the app always listens on 3000; `PORT` only changes the host side of the mapping.

### Image Version

Prebuilt images are on GitHub Container Registry. To pin a version, or to use an image built from source with `make build`, set `image:` for the `app` and `worker` services in `compose.override.yml` rather than in `compose.yml`, so `update.sh` can keep replacing `compose.yml`. See [Updating](/docs/guides/operations/updating#files-you-edited).

## Configuration

### Environment Variables

The app and worker read `.env`. See [Environment Variables](/docs/reference/environment-variables).

### Secrets

`compose.yml` mounts `secrets/file_encryption_key` into the app and worker at `/run/secrets/file_encryption_key` and sets `FILE_ENCRYPTION_KEY_FILE` to that path, so the key does not appear in the environment or in `docker inspect`. Keep `FILE_ENCRYPTION_KEY` in `.env` empty; setting both stops startup. See [Environment Variables](/docs/reference/environment-variables#file-storage).

Compose mounts a secret file with its host owner and mode; it does not apply `uid`, `gid`, or `mode` to file secrets. The app runs as uid 1001, so the file must be readable by that user:

- **Created by root:** `chown 1001:1001` and mode `0400`
- **Created by another user:** mode `0444` inside the `0700` `secrets/` directory. The container sees only the file; other host users cannot open the directory

`rotate.sh` writes a new key file with the same permissions and recreates the app and worker, because a single-file mount keeps showing the old file until the container is recreated.

Back up `secrets/file_encryption_key` apart from database backups. See [Backups](/docs/guides/operations/backups#encryption-key).

The worker has no health check, because it serves no HTTP. A crashed worker exits and the `unless-stopped` restart policy starts it again.

The S3-compatible bucket is not set in `.env`. After the first account is created, connect it in **Settings** → **Storage**. See [Storage Bucket](/docs/guides/admin/storage-bucket).

### Database and Redis Credentials

`.env` holds each password once, inside `DATABASE_URL` and `REDIS_URL`. The `postgres` and `redis` services read the same two variables:

- **PostgreSQL:** On the first start with an empty `postgres-data` volume, the container creates the user, password, and database named in `DATABASE_URL`. Later starts do not change them; use `./rotate.sh db` to change the password.
- **Redis:** The container starts `redis-server` with the password from `REDIS_URL` as `requirepass`, on every start. Without a password in the URL, Redis runs without one.
- **Health checks:** `pg_isready` and `redis-cli` connect with the same URLs.

These containers read the password as written, without percent-decoding. `setup.sh` and `rotate.sh` write hex passwords, which need no encoding. If you set a password yourself, use only letters, digits, `-`, `.`, `_`, and `~`.

**Database access from host:** To run `tma-server` commands that need the database (e.g. bulk import) from the host, the DB port must be reachable. In `docker-compose.yml`, uncomment the postgres `ports` entry (e.g. `127.0.0.1:5432:5432`).

### Persistent Data

PostgreSQL and Redis use the `postgres-data` and `redis-data` volumes. File contents are stored in the configured S3-compatible bucket.

## Building Images

```bash
# Build with default tag
make build

# Build with custom tag
make build IMAGE_TAG=4.0.0

# Build without cache
make build-no-cache
```

## Running Containers

```bash
# Start in background
docker compose up -d

# Stop services
docker compose down

# Stop and remove volumes
docker compose down -v

# Restart services
docker compose restart
```

On `SIGTERM` (sent by `docker compose down`, `stop`, and `restart`) the app stops accepting connections and waits up to 8 seconds for in-flight requests to finish before it closes the database pool. Open Server-Sent Events streams never finish on their own, so any connection still open after 8 seconds is closed. This stays inside Docker's default 10-second stop timeout.

## Monitoring

**Health Check:**

```bash
docker inspect --format='{{.State.Health.Status}}' tma-cloud-app
```

**View Logs:**

```bash
docker compose logs -f
docker compose logs -f app
docker compose logs -f worker
```

**Container Stats:**

```bash
docker stats tma-cloud-app tma-cloud-worker
```

## Next Steps

- [Environment Setup](/docs/getting-started/environment-setup) - Configure environment variables
- [First Login](/docs/getting-started/first-login) - Create your first account
