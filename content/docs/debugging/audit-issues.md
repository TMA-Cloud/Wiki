---
title: 'Audit Issues'
description: 'Fix audit events that are missing or only in the application log.'
---

Fix audit events that are missing or only in the application log.

## Audit Events Not Logging

Audit events are written by the process that records them (`tma-server serve` or
`tma-server worker`), in batches about every half second. There is no separate audit
worker to start.

**Check:**

1. The database is reachable from the app: `docker compose logs app` shows no connection
   errors
2. The app log for `Audit batch failed; retrying row by row` or
   `Failed to write audit event`, which include the database error
3. `audit_events_failed_total` on `/metrics`

**Solutions:**

1. Fix the database error shown in the log (connection, permissions, disk space)
2. Make sure migrations ran: the app applies them at startup, and
   `tma-server migrate` applies them by hand

## Events Only in the Application Log

**Symptom:** The log shows `Audit queue unavailable, event logged to application log only`.

**Cause:** More than 10,000 events were waiting to be written, usually because the
database is very slow or unreachable.

**Solutions:**

1. Check database health and load
2. The events in question are in the application log with their action name; they are
   not added to `audit_log` later

## Events Missing After a Crash

Events are held in memory for up to half a second before they are written. A normal stop
(`docker compose stop`, Ctrl+C) writes them first. A process that is killed outright can
lose the last half second of events.

## Related Topics

- [Audit Logs](/docs/guides/operations/audit-logs) - Audit system
- [Background Workers](/docs/guides/operations/background-workers) - Worker management
