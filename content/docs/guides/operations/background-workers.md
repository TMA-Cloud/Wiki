---
title: 'Background Workers'
description: 'Background services and workers in TMA Cloud.'
---

Background services and workers in TMA Cloud.

## Overview

TMA Cloud uses background workers for asynchronous processing and maintenance tasks.

## Workers

### Audit Worker

**Purpose:** Process audit events asynchronously

**Command:**

```bash
npm run worker
```

**Configuration:**

- `AUDIT_WORKER_CONCURRENCY` - Concurrent events processed
- `AUDIT_JOB_TTL_SECONDS` - Job TTL

**Important:** Must run in production. Audit events queued but not written until processed.

### Cleanup Services

#### Trash Cleanup

- Automatic deletion after 15 days
- Runs every 24 hours
- Permanent file deletion from storage

#### Share Link Cleanup

- Deletes expired share links (`expires_at < NOW()`)
- Sets `shared = false` on files that no longer have an active share link
- Runs at startup and every 7 days
- Invalidates related caches after cleanup

### Access Time Writer

**Purpose:** Write buffered `accessed_at` timestamps to the `files` table

Runs inside the main application process, not as a separate worker. Reads are recorded in memory and written in one batched statement every `ACCESS_TIME_FLUSH_SECONDS` (default 10). Each item is written at most once per `ACCESS_TIME_WINDOW_MINUTES` (default 60), so the write volume is set by the flush interval rather than by request traffic.

**Configuration:**

- `ACCESS_TIME_TRACKING` - Set to `0` to disable
- `ACCESS_TIME_WINDOW_MINUTES` - Per-item suppression window
- `ACCESS_TIME_FLUSH_SECONDS` - Buffer flush interval

Buffered timestamps are written on shutdown. A failed flush is logged at `warn` with the message `[AccessTime] Failed to flush access times` and does not affect the request that triggered it. See [Last Access Time](/docs/concepts/file-system#last-access-time).

## Running Workers

### Production

```bash
# Terminal 1 - Main application
npm start

# Terminal 2 - Audit worker (required)
npm run worker
```

### Docker

Workers run as separate containers:

```bash
docker compose up -d
# Starts app, worker, and redis
```

## Monitoring Workers

### Monitoring Audit Worker

- Check logs for processing status
- Monitor queue size
- Verify events being written

### Monitoring Cleanup Services

- Check logs for cleanup operations
- Monitor disk space
- Verify cleanup schedules

## Best Practices

- Always run audit worker in production
- Monitor worker health
- Check logs regularly
- Verify background tasks completing

## Related Topics

- [Audit Logs](/docs/guides/operations/audit-logs) - Audit system
- [Monitoring](/docs/guides/operations/monitoring) - System monitoring
- [Logging](/docs/guides/operations/logging) - Application logging
