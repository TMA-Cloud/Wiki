---
title: 'Debugging Overview'
description: 'Where to start when something goes wrong in TMA Cloud.'
---

Where to start when something goes wrong in TMA Cloud.

## Common Issues

- **[Common Errors](/docs/debugging/common-errors)** - Frequently encountered errors
- **[Auth Issues](/docs/debugging/auth-issues)** - Authentication problems
- **[Upload Issues](/docs/debugging/upload-issues)** - File upload problems
- **[Audit Issues](/docs/debugging/audit-issues)** - Audit system problems
- **[Redis Issues](/docs/debugging/redis-issues)** - Redis connection problems
- **[Docker Issues](/docs/debugging/docker-issues)** - Docker deployment problems
- **[OnlyOffice Issues](/docs/debugging/onlyoffice-issues)** - Document editing problems

## Debugging Steps

1. Read the app and worker logs: `docker compose logs app worker`. Every request line has a request ID, which is also in the `X-Request-ID` response header
2. Check `.env` against [Environment Variables](/docs/reference/environment-variables)
3. Check PostgreSQL with `pg_isready -d "$DATABASE_URL"` and Redis with `redis-cli -u "$REDIS_URL" ping`
4. Find the error code in [Error Codes](/docs/reference/error-codes)

## Getting Help

If none of the guides help, open **Settings** → **About**, click **Copy details**, and report the problem with **Report issue**. See [About and Support](/docs/guides/user/about).
