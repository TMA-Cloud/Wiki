---
title: 'Docker Deployment'
description: 'Docker deployment guide for TMA Cloud.'
---

Docker deployment guide for TMA Cloud.

## Prerequisites

- Docker (v29.0+)
- Docker Compose (v5.0+)
- Node.js (v25+) - For version extraction during build (only if building from source)

## Quick Start

See [Option 1: Docker Compose](/docs/getting-started/installation#option-1-docker-compose-recommended).

### Option 1: Use Prebuilt Docker Images (Default)

Prebuilt Docker images are available on GitHub Container Registry.

```bash
# Pull the latest image (optional; compose will pull if missing)
docker pull ghcr.io/tma-cloud/tma:latest

# Or pull a specific version
docker pull ghcr.io/tma-cloud/tma:X.0.0
```

To pin a version, edit `docker-compose.yml` and set `image: ghcr.io/tma-cloud/tma:X.0.0` for the `app` and `worker` services.

### Option 2: Build Docker Image from Source

If you prefer to build from source:

```bash
make build
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Services

```bash
docker compose up -d
```

Starts four services:

- **App** (`tma-cloud-app`) - Main application
- **PostgreSQL** (`tma-cloud-postgres`) - Database
- **Redis** (`tma-cloud-redis`) - Caching layer
- **Worker** (`tma-cloud-worker`) - Audit event processor (required)

Access at `http://localhost:3000` (or configured `BPORT`).

## Configuration

### Environment Variables

All variables loaded from `.env` file.

Configure the required S3-compatible bucket endpoint, name, and credentials in `.env`. See [Environment Variables](/docs/reference/environment-variables).

**Redis Configuration:**

- `REDIS_HOST=redis` (container name)
- `REDIS_PORT=6379`
- `REDIS_PASSWORD` (optional, recommended for production)

**Database access from host:** To run backend scripts that need the database (e.g. bulk import) from the host, the DB port must be reachable. In `docker-compose.yml`, uncomment the postgres `ports` entry (e.g. `127.0.0.1:5432:5432`).

### Persistent Data

PostgreSQL and Redis use the `postgres-data` and `redis-data` volumes. File contents are stored in the configured S3-compatible bucket.

## Building Images

```bash
# Build with default tag
make build

# Build with custom tag
make build IMAGE_TAG=3.0.0

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
