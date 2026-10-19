---
title: 'Installation'
description: 'Step-by-step installation guide for TMA Cloud.'
---

Step-by-step installation guide for TMA Cloud.

## Installation Options

TMA Cloud can be installed in two ways:

1. **[Docker Compose](/docs/getting-started/docker)** (Recommended) - Use the project's `docker-compose.yml` for the easiest setup
2. **Manual Installation** - Build and run from source (see below)

For full Docker options (prebuilt images, build from source), see the [Docker Setup Guide](/docs/getting-started/docker).

## Option 1: Docker Compose (Recommended)

No need to clone the repo. The setup script downloads `docker-compose.yml` and `.env.example`, generates the secrets, and starts the stack.

### Docker-Compose Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v29.0+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v5.0+)

### Steps

```bash
curl -fsSL https://raw.githubusercontent.com/TMA-Cloud/TMA/main/setup.sh | bash
```

This starts **app** (main API), **postgres**, **redis**, and **worker** (file operations, maintenance, and OnlyOffice saves) from `./tma-cloud`. Access it at `http://localhost:3000` or the `PORT` in `.env`.

Verify

```bash
cd tma-cloud
docker compose ps
docker compose logs -f
```

To set up without the script, or to change its options, see [Docker Deployment](/docs/getting-started/docker).

---

## Option 2: Manual Installation

### Manual-Installation Prerequisites

- Rust (stable, from [rustup](https://rustup.rs)) with the `wasm32-unknown-unknown` target
- [trunk](https://trunkrs.dev), to build the web app
- PostgreSQL (v17+)
- Redis (v6+). `REDIS_URL` must be set, but the server keeps running while Redis is unreachable: caching is off and live updates reach only clients of the same server process

```bash
rustup target add wasm32-unknown-unknown
cargo install trunk --locked
```

### Installation Steps

#### 1. Clone Repository

```bash
git clone https://github.com/TMA-Cloud/TMA.git
cd TMA
```

#### 2. Configure

```bash
cp .env.example .env
# Edit .env with your configuration
```

**Required variables:**

- `JWT_SECRET` - Secret key for JWT tokens
- `FILE_ENCRYPTION_KEY` - Random 32-byte key used to encrypt stored files (generate with `openssl rand -base64 32`)
- `DATABASE_URL` - Database connection, e.g. `postgresql://postgres:password@localhost:5432/tma_cloud_storage`
- `REDIS_URL` - Redis connection, e.g. `redis://:password@localhost:6379/0`
- `PORT` - Port the app listens on (default: 3000)

**Optional:**

- `BACKEND_URL` - Public backend URL (for OnlyOffice)

#### 3. Create Database

```sql
CREATE DATABASE tma_cloud_storage;
```

Migrations run automatically on startup, or by hand with `tma-server migrate`.

#### 4. Set Up Redis

**Linux/macOS:**

```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis
brew services start redis

redis-server
```

**Windows:** Use Docker or WSL

**Verify:** `redis-cli ping` (should return PONG)

#### 5. Build

```bash
# The web app, into apps/tma-cloud-web/dist
cd apps/tma-cloud-web
trunk build --release
cd ../..

# The server
cargo build --release -p tma-server
```

The server binary is `target/release/tma-server` (`tma-server.exe` on Windows). It finds the web app in `apps/tma-cloud-web/dist`; to keep the web app somewhere else, set `WEB_DIST_DIR`.

#### 6. Start Application

**Production:**

```bash
# Terminal 1 - API and web app
./target/release/tma-server serve

# Terminal 2 - Background worker (required)
./target/release/tma-server worker
```

Access at `http://localhost:3000`

**Development:**

```bash
cargo run -p tma-server -- serve --with-worker
```

This runs the API, the web app and the worker in one process. After changing the interface, run `trunk build` again in `apps/tma-cloud-web`; the server picks up the new build without a restart.

## Verification

1. The server logs `Server listening` with the port
2. Open browser: `http://localhost:3000`
3. Create first account (becomes admin)
4. Connect the bucket in **Settings** → **Storage**. See [Storage Bucket](/docs/guides/admin/storage-bucket)

## Troubleshooting

**Database:** Verify PostgreSQL is running, and test `DATABASE_URL` from `.env` with `psql "$DATABASE_URL"`

**Encryption key:** In production the server stops if `FILE_ENCRYPTION_KEY` is missing, is a passphrase, or does not match the key the data was encrypted with. The log names the cause

**Redis:** Verify with `redis-cli ping`. While Redis is unreachable the app keeps working without caching, and live updates reach only clients of the same server process.

**Port:** Change `PORT` in `.env` if port is in use

**Web app missing:** A `FRONTEND_NOT_BUILT` error means the server did not find the web app. Run `trunk build --release` in `apps/tma-cloud-web`, or set `WEB_DIST_DIR`.

**OnlyOffice:** Configure it in **Settings** → **Administration** → **Integrations** (first user only). It needs `BACKEND_URL`.

**Background Worker:** Must run `tma-server worker` in production. See [Background Workers](/docs/guides/operations/background-workers).

## Next Steps

- [Docker Deployment](/docs/getting-started/docker) - Full Docker guide (prebuilt images, build from source, volumes)
- [Environment Setup](/docs/getting-started/environment-setup) - Detailed environment configuration
- [First Login](/docs/getting-started/first-login) - Create your first account
