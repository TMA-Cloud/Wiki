---
title: 'Docker Issues'
description: 'Fix containers that do not start, fail their health check or cannot be reached.'
---

Fix containers that do not start, fail their health check or cannot be reached.

## Container Issues

### Container Not Starting

**Check:**

1. Docker logs: `docker compose logs app`
2. Environment variables
3. Volume mounts
4. Port conflicts

**Solutions:**

1. Check logs for specific errors
2. Verify `.env` file exists and is correct
3. Check that `FILE_ENCRYPTION_KEY` (or `FILE_ENCRYPTION_KEY_FILE`) is set, is a random 32-byte key, and matches the stored data; the log names the cause. See [Common Errors](/docs/debugging/common-errors#encryption-key-errors)
4. Verify ports are available

### "secret file not found" or "no such file" for file_encryption_key

`compose.yml` needs `secrets/file_encryption_key` next to it. Run `setup.sh`, or create the file as shown in [Manual Setup](/docs/getting-started/docker#manual-setup).

If the app logs `Cannot read FILE_ENCRYPTION_KEY_FILE (/run/secrets/file_encryption_key): EACCES`, the file is not readable by uid 1001. Run `chmod 444 secrets/file_encryption_key`, or as root `chown 1001:1001` it with mode `0400`.

### "Set either FILE_ENCRYPTION_KEY or FILE_ENCRYPTION_KEY_FILE, not both"

`compose.yml` already sets `FILE_ENCRYPTION_KEY_FILE`. Move the key from `.env` into `secrets/file_encryption_key` and leave `FILE_ENCRYPTION_KEY=` empty.

### Health Check Failing

The worker has no health check, so only `tma-cloud-app` reports a health status.

**Check:**

```bash
docker inspect --format='{{.State.Health.Status}}' tma-cloud-app
```

**Solutions:**

The health check asks `/health`, which answers as soon as the server accepts requests. A failing check means the app is not running or not listening:

1. Read `docker compose logs app` for the startup error
2. Check that the database is reachable; the app stops at startup when it is not

## Network Issues

### Cannot Access Application

**Check:**

1. Container is running: `docker compose ps`
2. Port mapping is correct
3. Firewall rules
4. Container logs

**Solutions:**

1. Verify port mapping: `docker compose ps`
2. Check `PORT` in `.env`; it sets the host port, and the container listens on 3000
3. Open `http://localhost:<PORT>`, using the `PORT` from `.env` (3000 by default)

## Related Topics

- [Docker Compose / Docker](/docs/getting-started/docker) - Docker Compose and prebuilt images
- [Environment Setup](/docs/getting-started/environment-setup) - Configuration
