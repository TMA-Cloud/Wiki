---
title: 'Redis Issues'
description: 'Fix Redis connection problems, and what still works while Redis is down.'
---

Fix Redis connection problems, and what still works while Redis is down.

## Connection Errors

### Cannot Connect to Redis

**Check:**

1. Redis is running: `redis-cli ping`
2. Correct host and port in `REDIS_URL` in `.env`
3. Network connectivity
4. Firewall rules

**Solutions:**

1. Start Redis: `redis-server` or `docker compose up redis`
2. Verify the host and port in `REDIS_URL`
3. Test connection: `redis-cli -u "$REDIS_URL" ping`
4. If Redis has a password, check that `REDIS_URL` contains it: `redis://:password@host:6379/0`

## While Redis Is Unreachable

`REDIS_URL` must be set, but TMA Cloud keeps working while Redis is unreachable:

- Caching is off, so every lookup goes to PostgreSQL and requests are slower
- Live file updates reach only the apps connected to the server process that made the change; changes made by a separate worker process show up on the next refresh
- When Redis is back, the server reconnects by itself and live updates from every process resume

## Docker Redis

### Container Not Starting

**Check:**

1. The logs: `docker compose logs redis`
2. Port conflicts
3. Volume mounts

**Solutions:**

1. Check logs for errors
2. Verify port 6379 is available
3. Restart container: `docker compose restart redis`

## Related Topics

- [Environment Setup](/docs/getting-started/environment-setup) - Redis configuration
- [Architecture](/docs/concepts/architecture) - System architecture
