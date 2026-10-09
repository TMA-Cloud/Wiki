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

This starts **app** (main API), **postgres**, **redis**, and **worker** (file operations, maintenance, audit writes, and OnlyOffice saves) from `./tma-cloud`. Access it at `http://localhost:3000` or your configured `BPORT`.

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

- Node.js (22, 24, or 26+)
- PostgreSQL (v17+)
- Redis (v6+) - Optional but recommended
- npm or yarn

### Installation Steps

#### 1. Clone Repository

```bash
git clone https://github.com/TMA-Cloud/TMA.git
cd TMA
```

#### 2. Backend Setup

```bash
cd backend
npm install
cp ../.env.example ../.env
# Edit ../.env with your configuration
```

**Required variables:**

- `JWT_SECRET` - Secret key for JWT tokens
- `FILE_ENCRYPTION_KEY` - Random 32-byte key used to encrypt stored files (generate with `openssl rand -base64 32`)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - Database connection
- `REDIS_HOST`, `REDIS_PORT` - Redis connection (optional)
- `BPORT` - Backend port (default: 3000)

**Optional:**

- `BACKEND_URL` - Public backend URL (for OnlyOffice)

#### 3. Create Database

```sql
CREATE DATABASE tma_cloud_storage;
```

Migrations run automatically on startup.

#### 4. Setup Redis (Optional)

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

#### 5. Frontend Setup

```bash
cd ../frontend
npm install
npm run build
```

#### 6. Start Application

**Production:**

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Background Worker (required)
cd backend
npm run worker
```

Access at `http://localhost:3000`

**Development:**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Access at `http://localhost:5173`

## Verification

1. Backend shows: "Database connected successfully", "Server running on port 3000"
2. Open browser: `http://localhost:3000` (production) or `http://localhost:5173` (development)
3. Create first account (becomes admin)
4. Connect the bucket in **Settings** → **Storage**. See [Storage Bucket](/docs/guides/admin/storage-bucket)

## Troubleshooting

**Database:** Verify PostgreSQL is running, check credentials in `.env`

**Encryption key:** In production the backend stops if `FILE_ENCRYPTION_KEY` is missing, is a passphrase, or does not match the key the data was encrypted with. The log names the cause

**Redis:** Verify with `redis-cli ping`. App works without Redis but caching is disabled.

**Port:** Change `BPORT` in `.env` if port is in use

**OnlyOffice:** Configure via Settings page (admin-only). Requires `BACKEND_URL` environment variable.

**Background Worker:** Must run `npm run worker` in production. See [Background Workers](/docs/guides/operations/background-workers).

## Next Steps

- [Docker Deployment](/docs/getting-started/docker) - Full Docker guide (prebuilt images, build from source, volumes)
- [Environment Setup](/docs/getting-started/environment-setup) - Detailed environment configuration
- [First Login](/docs/getting-started/first-login) - Create your first account
