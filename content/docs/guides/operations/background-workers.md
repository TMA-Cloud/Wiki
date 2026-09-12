---
title: 'Background Workers'
description: 'Background services and workers in TMA Cloud.'
---

Background services and workers in TMA Cloud.

## Overview

TMA Cloud uses one standalone worker process for audit writes, file operations, object cleanup, scheduled maintenance, admin-requested orphan work, and OnlyOffice force-save commands. Jobs are stored in PostgreSQL by pg-boss, so schedules and retries survive process restarts.

## Background Worker

**Command:**

```bash
npm run worker
```

**Configuration:**

- `AUDIT_WORKER_CONCURRENCY` - Audit batch size and concurrency cap. OnlyOffice force-save concurrency is capped at four.
- `AUDIT_JOB_TTL_SECONDS` - Audit job TTL.

The worker must run in production. Without it, queued audit events, file operations, object cleanup, and maintenance do not run, and open OnlyOffice documents do not receive periodic force-save commands.

### Queues

| Queue                     | Work                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| `audit-events`            | Validates audit events and inserts each fetched batch in one query                       |
| `background-maintenance`  | Runs singleton cleanup jobs                                                              |
| `onlyoffice-forcesave`    | Sends force-save commands with per-document ordering                                     |
| `orphan-maintenance`      | Runs admin-requested orphan scans and selected cleanup                                   |
| `account-file-operations` | Copies files, handles large moves and restores, and performs permanent deletion          |
| `object-cleanup`          | Deletes unreferenced or superseded object versions after upload, replace, or save errors |
| `file-operations`         | Drains jobs queued before the account queue was added and continues sliced trash cleanup |

Failed jobs retry with backoff. `account-file-operations` uses strict FIFO ordering per account, so two mutations for one account cannot overtake each other while other accounts can run concurrently. Copy jobs use their pg-boss job ID as an idempotency key. A committed retry returns the original copied IDs from `file_operation_results` instead of creating another copy.

HTTP handlers keep validation, authorization, small metadata-only changes, and response streaming in the web process. They queue retryable object-store work and operations that can outlive an HTTP request.

### Maintenance Schedule

Schedules use UTC.

| Job                      | Schedule        | What it removes                                          |
| ------------------------ | --------------- | -------------------------------------------------------- |
| Trash cleanup            | Daily at 02:00  | Files trashed more than 15 days ago                      |
| Audit log cleanup        | Daily at 02:15  | `audit_log` rows older than 30 days                      |
| Session cleanup          | Daily at 02:45  | `sessions` rows older than 30 days                       |
| Operation-result cleanup | Daily at 02:50  | `file_operation_results` rows older than 30 days         |
| Share link cleanup       | Sunday at 03:00 | Share links whose `expires_at` has passed                |
| Heartbeat cleanup        | Hourly          | `client_heartbeats` rows not seen in the last 10 minutes |
| Quota reservations       | Hourly at :30   | Expired `storage_reservations` rows                      |

Trash is read in batches of 500. Stored objects are deleted with the S3 multi-object API before their database rows are removed. One run is capped by batch count and runtime; if work remains, the worker queues another slice. If object deletion fails, the rows remain for retry.

Move-to-trash and restore requests stay synchronous for trees up to 1,000 items. Larger trees use `account-file-operations`. Copy, permanent delete, and Empty Trash always use that queue. The web request validates the selected roots and counts a tree when needed, but does not load every descendant or storage key into application memory.

Queued file endpoints return `202` and a `jobId`. The client polls `GET /api/files/jobs/:jobId` until the job completes or fails. Job status is account-scoped; a caller cannot read another account's result.

Audit retention deletes at most 10,000 rows per database call and at most 20 batches per scheduled run. This bounds locks and WAL volume while allowing later runs to continue a large backlog.

Share cleanup updates file sharing state and invalidates related caches. Heartbeat cleanup removes stale browser and desktop presence rows; Active Sessions marks a session offline after three minutes without waiting for cleanup.

Quota reservation cleanup deletes at most 1,000 rows per database call and at most 100 batches per run. Reservations normally disappear in the operation's metadata transaction; expiry cleanup covers interrupted processes.

Session and operation-result cleanup use bounded batches of 5,000 rows, with at most 20 batches per run.

Object cleanup accepts storage keys only. Deletion is idempotent, is sent in S3 batches of up to 1,000 keys, and retries independently of the request that created or replaced the object. If the queue is unavailable, the producer attempts the deletion inline.

Orphan jobs are not scheduled and never delete anything unless the first user selects entries. A scan stages paged storage inventory in a temporary database table; cleanup re-verifies selected entries before batching storage and database deletes.

### OnlyOffice Force-Save

Opening an editable document creates one durable pg-boss schedule for its document key. The default interval is five minutes. The worker calls the OnlyOffice `/command` service, and the callback streams the returned document through encryption to object storage. Closing the document removes its schedule; an OnlyOffice response that says the document is no longer open also removes it.

`ONLYOFFICE_AUTOSAVE_INTERVAL_MS` is optional. Omit it to use five minutes. See [OnlyOffice API](/docs/api/onlyoffice#auto-save).

## Process-Local Services

These remain in the main application because they own HTTP-process state:

- Access times are buffered from requests and flushed in one statement every `ACCESS_TIME_FLUSH_SECONDS`.
- Audit queue gauges are refreshed for the Prometheus registry exposed by that process.
- Redis pub/sub, SSE keepalives, and rate-limit timers stay with the web process.

## Running Workers

### Production

```bash
# Terminal 1 - Main application
npm start

# Terminal 2 - Background worker (required)
npm run worker
```

### Docker

The worker runs as its own container and shares the app image:

```bash
docker compose up -d
# Starts postgres, redis, app, and worker
```

## Monitoring Workers

- Check `docker compose logs -f worker` or the worker process logs.
- Monitor `audit_queue_depth` and `audit_queue_failed_depth`.
- Check recent rows in the pg-boss job table for `background-maintenance`, `account-file-operations`, `object-cleanup`, `file-operations`, `orphan-maintenance`, and `onlyoffice-forcesave` failures.
- Verify cleanup counts and OnlyOffice command errors in worker logs.

## Related Topics

- [Audit Logs](/docs/guides/operations/audit-logs) - Audit system
- [Monitoring](/docs/guides/operations/monitoring) - System monitoring
- [Logging](/docs/guides/operations/logging) - Application logging
