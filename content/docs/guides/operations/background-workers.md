---
title: 'Background Workers'
description: 'Background services and workers in TMA Cloud.'
---

Background services and workers in TMA Cloud.

## Overview

TMA Cloud uses one worker process for file operations, object cleanup, scheduled maintenance, admin-requested orphan work, share auto-linking, and OnlyOffice force-save commands. Jobs are stored in PostgreSQL in the `job_queue` table, so schedules and retries survive restarts.

A job is saved in the same database as the request that created it. Workers claim jobs with `FOR UPDATE SKIP LOCKED`, so several worker processes never take the same job, and the server wakes them with a PostgreSQL `NOTIFY` instead of making them poll.

Audit events do not go through the queue. Each process batches them and writes them itself; see [Audit Logs](/docs/guides/operations/audit-logs).

## Background Worker

**Command:**

```bash
tma-server worker
```

For development, `tma-server serve --with-worker` runs the API and the worker in one process.

**Configuration:**

- `AUDIT_WORKER_CONCURRENCY` - The most jobs one worker runs at once per queue (default 5). Each queue also has its own cap: maintenance and orphan work run one at a time, the others up to four.

The worker must run in production. Without it, file operations, object cleanup and maintenance do not run, and open OnlyOffice documents do not receive periodic force-save commands.

### Queues

| Queue                     | Work                                                                                                            |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `background-maintenance`  | Runs the scheduled cleanup jobs below                                                                           |
| `onlyoffice-forcesave`    | Sends force-save commands to the Document Server                                                                |
| `orphan-maintenance`      | Runs admin-requested orphan scans and selected cleanup                                                          |
| `account-file-operations` | Copies files, handles large moves and restores, performs permanent deletion, and continues sliced trash cleanup |
| `object-cleanup`          | Deletes unreferenced or superseded object versions after upload, replace, or save errors                        |
| `share-linking`           | Adds newly created items to the shares their parent folder belongs to                                           |

Failed jobs retry with exponential backoff, up to a limit per queue. A job left running past its time limit (for example because its worker crashed) is put back in the queue. Finished jobs are kept for a while (one hour to seven days, depending on the queue) and then removed.

`account-file-operations` and `share-linking` use strict FIFO ordering per account, so two changes for one account cannot overtake each other while other accounts run at the same time. Copy jobs use their job ID as an idempotency key. A retry after a committed copy returns the original copied IDs from `file_operation_results` instead of creating another copy.

HTTP handlers keep validation, authorization, small metadata-only changes, and response streaming in the web process. They queue retryable object-store work and operations that can outlive an HTTP request.

### Maintenance Schedule

Schedules use UTC. The worker checks for due schedules every 20 seconds, and each schedule runs once per due minute even with several workers.

| Job                      | Schedule        | What it does                                                     |
| ------------------------ | --------------- | ---------------------------------------------------------------- |
| Folder aggregate check   | Sunday at 01:15 | Recomputes stored folder totals and reports how many were wrong  |
| Trash cleanup            | Daily at 02:00  | Removes files trashed more than 15 days ago                      |
| Audit log cleanup        | Daily at 03:40  | Removes `audit_log` rows older than 30 days                      |
| Session cleanup          | Daily at 04:20  | Removes `sessions` rows older than 30 days                       |
| Operation-result cleanup | Daily at 04:50  | Removes `file_operation_results` rows older than 30 days         |
| Import-manifest cleanup  | Daily at 05:25  | Removes `bulk_import_items` rows older than 7 days               |
| Share link cleanup       | Sunday at 06:10 | Removes share links whose `expires_at` has passed                |
| Heartbeat cleanup        | Hourly at :07   | Removes `client_heartbeats` rows not seen in the last 10 minutes |
| Quota reservations       | Hourly at :37   | Removes expired `storage_reservations` rows                      |

Start times are spread across the window rather than stacked on the same minutes. One worker runs these serially, so coinciding schedules only queue behind each other and put their database load on the same few minutes.

Trash is read in batches of 500. Stored objects are deleted with the S3 multi-object API before their database rows are removed. One run is capped by batch count and runtime; if work remains, the worker queues another slice. If object deletion fails, the rows remain for retry.

Move-to-trash and restore requests stay synchronous for trees up to 1,000 items. Larger trees use `account-file-operations`. Copy, permanent delete, and Empty Trash always use that queue. The web request validates the selected roots and counts a tree when needed, but does not load every descendant or storage key into application memory.

Queued file endpoints return `202` and a `jobId`. The client polls `GET /api/files/jobs/:jobId` until the job completes or fails. Job status is account-scoped; a caller cannot read another account's result.

Audit retention deletes at most 10,000 rows per database call and at most 20 batches per scheduled run. This bounds locks and WAL volume while allowing later runs to continue a large backlog.

Share cleanup updates file sharing state and invalidates related caches. Heartbeat cleanup removes stale browser and desktop presence rows; Active Sessions marks a session offline after three minutes without waiting for cleanup.

Quota reservation cleanup deletes at most 1,000 rows per database call and at most 100 batches per run. Reservations normally disappear in the operation's metadata transaction; expiry cleanup covers interrupted processes.

Session and operation-result cleanup use bounded batches of 5,000 rows, with at most 20 batches per run. Import-manifest cleanup uses the same bounds and only removes `bulk_import_items` rows older than seven days, so an import that is still running or still rollback-able is never touched.

The folder aggregate check recomputes `aggregate_size`, `aggregate_file_count`, and `aggregate_folder_count` from the rows themselves, one account at a time, and logs how many folders held a wrong value. Incremental trigger maintenance can drift because a negative delta is clamped at zero rather than carried, so this run both repairs the columns and makes the drift visible. A repaired count above zero is worth investigating: it means some write path is not maintaining the totals. The run is capped at 20 minutes and continues from the start of the account list on the next schedule.

Share-linking jobs are not scheduled. An upload or folder creation inside a shared folder queues one, and the worker adds the new subtree to every share the parent belongs to. The job is keyed per account, so a burst of uploads serializes instead of racing, and it is safe to retry. The request itself pays only one indexed lookup to see whether the parent is shared at all. If the queue is unavailable, the producer links inline rather than leaving the items off the link.

Object cleanup accepts storage keys only. Deletion is idempotent, is sent in S3 batches of up to 1,000 keys, and retries independently of the request that created or replaced the object. If the queue is unavailable, the producer attempts the deletion inline.

Orphan jobs are not scheduled and never delete anything unless the first user selects entries. A scan stages paged storage inventory in a temporary database table; cleanup re-verifies selected entries before batching storage and database deletes.

### OnlyOffice Force-Save

Opening an editable document creates one schedule for its document key in the `job_schedules` table. The interval is five minutes. The worker calls the OnlyOffice `/command` service, and the callback streams the returned document through encryption to object storage. Closing the document removes its schedule; an OnlyOffice response that says the document is no longer open also removes it.

See [OnlyOffice API](/docs/api/onlyoffice#auto-save).

## Process-Local Services

These remain in the main application because they own HTTP-process state:

- Access times are buffered from requests and flushed in one statement per write interval, 10 seconds by default. See [Session Timeout and Last Opened](/docs/guides/admin/sessions-and-activity).
- Audit events are batched and written by the process that recorded them.
- Queue depth gauges are refreshed for the Prometheus registry exposed by that process.
- Redis pub/sub, SSE keepalives, and rate-limit timers stay with the web process.

## Running Workers

### Production

```bash
# Terminal 1 - Main application
tma-server serve

# Terminal 2 - Background worker (required)
tma-server worker
```

### Docker

The worker runs as its own container from the same image, with the command `tma-server worker`:

```bash
docker compose up -d
# Starts postgres, redis, app, and worker
```

## Monitoring Workers

- Check `docker compose logs -f worker` or the worker process logs.
- Monitor `job_queue_depth` (see [Monitoring](/docs/guides/operations/monitoring)).
- Check failed jobs and their errors:

  ```sql
  SELECT queue, error, completed_at FROM job_queue
  WHERE state = 'failed' ORDER BY completed_at DESC LIMIT 20;
  ```

- Verify cleanup counts and OnlyOffice command errors in worker logs.
- Watch for `Repaired drifted folder aggregates` warnings from the weekly folder aggregate check.

## Related Topics

- [Audit Logs](/docs/guides/operations/audit-logs) - Audit system
- [Monitoring](/docs/guides/operations/monitoring) - System monitoring
- [Logging](/docs/guides/operations/logging) - Application logging
