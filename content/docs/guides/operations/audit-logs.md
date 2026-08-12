---
title: "Audit Logs"
description: "Comprehensive audit trail system in TMA Cloud."
---

Comprehensive audit trail system in TMA Cloud.

## Overview

Queue-based audit logging system using PostgreSQL and pg-boss. Tracks all critical user actions and system events asynchronously.

## Configuration

### Environment Variables

```bash
AUDIT_WORKER_CONCURRENCY=5  # Concurrent events processed
AUDIT_JOB_TTL_SECONDS=82800  # Job TTL (must be < 24h)
```

### Starting the Audit Worker

```bash
npm run worker
```

**Important:** Audit events are queued but not written to database until worker processes them. Always keep worker running in production.

## Audit Events

### Authentication Events

- `user.signup` - User creates account
- `user.login` - User logs in
- `user.logout` - User logs out
- `user.login.failed` - Failed login attempt
- `auth.logout` - Session logout
- `auth.logout_all` - Logout from all devices
- `auth.suspicious_token` - Token fingerprint mismatch
- `auth.session_revoked` - Session revoked

### File Events

- `file.upload` - File uploaded
- `file.upload.bulk` - Multiple files uploaded in bulk
- `file.download` - File downloaded
- `file.delete` - File moved to trash
- `file.delete.permanent` - File permanently deleted
- `file.restore` - File restored from trash
- `file.rename` - File/folder renamed
- `file.move` - Files/folders moved
- `file.copy` - Files/folders copied
- `file.star` / `file.unstar` - File starred/unstarred

### Folder Events

- `folder.create` - Folder created

### Share Events

- `share.create` - Share link created
- `share.delete` - Share link removed
- `share.access` - Public access to shared file/folder

### Document Events (OnlyOffice)

- `document.open` - Document opened in OnlyOffice
- `document.save` - Document saved from OnlyOffice

### Settings Events

- `admin.settings.update` - Admin setting changed (e.g. signup enabled/disabled)
- `admin.settings.read` - Admin read of protected settings

### Account Events

- `account.sub_user.create` / `account.sub_user.update` / `account.sub_user.delete` - Sub-user managed
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
ORDER BY created_at DESC;

-- Find large file uploads
SELECT user_id, metadata->>'fileName' as file_name,
       (metadata->>'fileSize')::bigint as size, created_at
FROM audit_log
WHERE action = 'file.upload'
  AND (metadata->>'fileSize')::bigint > 10485760
ORDER BY created_at DESC;

-- Find bulk uploads (e.g. folder uploads)
SELECT user_id,
       metadata->>'fileCount' as file_count,
       metadata->>'parentId'  as parent_id,
       created_at
FROM audit_log
WHERE action = 'file.upload.bulk'
ORDER BY created_at DESC;
```

## Audit Worker Management

### Monitor Worker

```bash
npm run worker
# Logs show: "Audit worker started", "Processing audit event: ..."
```

### Check Queue Status

```sql
-- View pending jobs
SELECT * FROM pgboss.job
WHERE name = 'audit-log' AND state = 'created'
ORDER BY createdon DESC;

-- View completed jobs
SELECT * FROM pgboss.job
WHERE name = 'audit-log' AND state = 'completed'
ORDER BY completedon DESC LIMIT 100;
```

### Worker Concurrency

Higher values = faster processing but more database connections. Recommended: 5-10.

## Related Topics

- [Logging](/docs/guides/operations/logging) - Application logging
- [Monitoring](/docs/guides/operations/monitoring) - System monitoring
- [Reference: Audit Events](/docs/reference/audit-events) - Complete event list
- [Database Schema](/docs/reference/database-schema#audit_log) - `audit_log` columns and the `audit_activity` view
