---
title: 'Audit Logs'
description: 'How TMA Cloud records audit events and how to query them.'
---

How TMA Cloud records audit events and how to query them.

## Overview

TMA Cloud records authentication, file, sharing, document, admin, and account events in the `audit_log` table.

Recording an event never slows a request down. Each process (the API and the worker) hands its events to an in-memory buffer, and a writer task saves them in batches: up to 200 events in one insert, at least every half second. Events still in the buffer are written when the process shuts down normally.

If a batch fails, its events are retried one at a time, so one bad row does not lose the others. An event whose user was deleted in the meantime is saved without the user. If the buffer is full (10,000 events waiting), new events go to the application log instead and a warning is logged.

## Configuration

There is nothing to configure and no separate process to run: audit writing is part of `tma-server serve` and `tma-server worker`. Retention is handled by the daily audit log cleanup; see [Background Workers](/docs/guides/operations/background-workers#maintenance-schedule).

## Audit Events

[Audit Events](/docs/reference/audit-events) is the complete catalog with metadata fields. The summary below groups them by area.

### Authentication Events

- `auth.signup`, `auth.login`, `auth.login.failure`
- `auth.logout`, `auth.logout_all`
- `auth.session_revoked`, `auth.other_sessions_revoked`
- `auth.password_change`

### File Events

- `file.upload`, `file.upload.bulk`
- `file.download`, `file.download.bulk`
- `file.update` - contents replaced in place
- `file.delete`, `file.restore`, and `.queued` variants for work handed to the worker
- `file.rename`, `file.move`, `file.copy.queued`, `file.delete.permanent.queued`
- `file.star`, `file.unstar`
- `file.lock`, `file.unlock` - editing locks

### Folder Events

- `folder.create`, `folder.download`

### Share Events

- `share.create`, `share.delete`
- `share.access` - anonymous view of a share link
- `share.download` - download through a share link

### Document Events (OnlyOffice)

- `document.open`, `document.save`

### Admin Events

- `admin.settings.update`, `admin.settings.read`
- `admin.user.list`, `admin.user.update`
- `admin.orphans.scan`, `admin.orphans.delete`

### Account Events

- `account.sub_user.create`, `account.sub_user.update`, `account.sub_user.delete`
- `account.permission_denied` - Sub-user attempted something it was not granted
- `account.owner_action_denied` - Sub-user attempted an owner-only action

## Identifying the Actor

Events are written to the `audit_log` table. Three columns describe who acted:

- `user_id` - The login that performed the action. For a sub-user this is its own ID, never the owner's.
- `account_owner_id` - The account the action happened under. Equals `user_id` for account owners.
- `actor_role` - `owner` or `sub_user`.

The `audit_activity` view resolves these to names and emails, which is usually easier to read than raw IDs.

```sql
SELECT created_at, actor_email, actor_role, action, status
FROM audit_activity
WHERE account_email = 'owner@example.com'
ORDER BY created_at DESC
LIMIT 100;
```

## Querying Audit Logs

### View User Activity

```sql
SELECT action, status, metadata, created_at
FROM audit_log
WHERE user_id = 'user_abc123'
ORDER BY created_at DESC;
```

### View Everything Under One Account

Includes the owner and all of its sub-users.

```sql
SELECT created_at, user_id, actor_role, action, resource_id
FROM audit_log
WHERE account_owner_id = 'user_abc123'
ORDER BY created_at DESC;
```

### View Failed Operations

```sql
SELECT action, user_id, metadata, created_at
FROM audit_log
WHERE status = 'failure'
ORDER BY created_at DESC;
```

### View Permission Denials

Useful when a sub-user reports that something is missing from their interface.

```sql
SELECT created_at, actor_email, metadata->>'permission' AS permission,
       metadata->>'path' AS path
FROM audit_activity
WHERE action = 'account.permission_denied'
ORDER BY created_at DESC;
```

### View File Operations

```sql
SELECT action, user_id, metadata->>'fileName' as file_name, created_at
FROM audit_log
WHERE resource_type = 'file'
  AND action LIKE 'file.%'
ORDER BY created_at DESC;
```

### Search by Metadata

```sql
-- Find operations on specific file
SELECT * FROM audit_log
WHERE metadata @> '{"fileId": "file_123"}'::jsonb
  AND created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- Find large file uploads
SELECT user_id, metadata->>'fileName' as file_name,
       (metadata->>'fileSize')::bigint as size, created_at
FROM audit_log
WHERE action = 'file.upload'
  AND created_at >= NOW() - INTERVAL '30 days'
  AND (metadata->>'fileSize')::bigint > 10485760
ORDER BY created_at DESC;

-- Find bulk uploads (e.g. folder uploads)
SELECT user_id,
       metadata->>'fileCount' as file_count,
       metadata->>'parentId'  as parent_id,
       created_at
FROM audit_log
WHERE action = 'file.upload.bulk'
  AND created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
```

`metadata` has no general GIN index because the application does not filter on arbitrary JSON fields. Constrain administrative searches by indexed columns such as `action`, `user_id`, `account_owner_id`, or `created_at` before inspecting metadata.

## Checking That Events Are Written

- `audit_last_processed_timestamp` and `audit_events_processed_total` on `/metrics` show the last write and the total. `audit_events_failed_total` counts events that could not be saved.
- Failures are logged as `Audit batch failed; retrying row by row` and `Failed to write audit event`.
- A full buffer is logged as `Audit queue unavailable, event logged to application log only`.

## Related Topics

- [Logging](/docs/guides/operations/logging) - Application logging
- [Monitoring](/docs/guides/operations/monitoring) - System monitoring
- [Reference: Audit Events](/docs/reference/audit-events) - Complete event list
- [Database Schema](/docs/reference/database-schema#audit_log) - `audit_log` columns and the `audit_activity` view
