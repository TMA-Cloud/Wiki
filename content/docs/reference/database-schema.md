---
title: 'Database Schema'
description: 'PostgreSQL database schema for TMA Cloud.'
---

PostgreSQL database schema for TMA Cloud.

## Tables

### `users`

User accounts and sub-users.

| Column                          | Type        | Description                                                  |
| ------------------------------- | ----------- | ------------------------------------------------------------ |
| `id`                            | TEXT        | Primary key                                                  |
| `email`                         | TEXT        | Unique, not null                                             |
| `password`                      | TEXT        | Hashed (nullable)                                            |
| `name`                          | TEXT        | Display name                                                 |
| `mfa_enabled`                   | BOOLEAN     | Default false                                                |
| `mfa_secret`                    | TEXT        | TOTP secret (nullable)                                       |
| `mfa_last_time_step`            | BIGINT      | Last TOTP time step spent                                    |
| `last_backup_code_regeneration` | TIMESTAMPTZ | Stamped when backup codes are regenerated                    |
| `token_version`                 | INTEGER     | Token version for revocation, default 1                      |
| `last_token_invalidation`       | TIMESTAMPTZ | Last token invalidation time                                 |
| `storage_limit`                 | BIGINT      | Storage limit (nullable, bytes)                              |
| `storage_used`                  | BIGINT      | Account usage counter in bytes, default 0                    |
| `storage_reserved`              | BIGINT      | Bytes reserved by in-progress object operations, default 0   |
| `parent_user_id`                | TEXT        | Account owner for sub-users (null for owners), FK → users.id |
| `permissions`                   | TEXT[]      | Granted permissions for sub-users, default `{}`              |
| `created_at`                    | TIMESTAMPTZ | Default now()                                                |

**Sub-users:** A row with `parent_user_id` set is a sub-user of that account. The account any row belongs to is `COALESCE(parent_user_id, id)`, which is the value stored in `files.user_id`.

**Constraints:**

- `users_permissions_valid` — every entry in `permissions` must be a known key (`files.download`, `files.upload`, `files.edit`, `files.share`, `files.delete`, `files.trash`)
- `users_owner_has_no_permissions` — owners keep an empty `permissions` array; they are never checked against it
- `users_parent_not_self` — a row cannot be its own parent

**Triggers:**

- `trg_users_reject_nested_sub_user` — refuses an insert or update whose parent is itself a sub-user, so sub-users cannot own sub-users
- `trg_users_reject_demoting_parent` — refuses turning an owner that already has sub-users into a sub-user

**Indexes:** Partial index on `parent_user_id` where `parent_user_id IS NOT NULL`

### `storage_reservations`

Short-lived quota reservations for object-store work that cannot hold a database transaction open.

| Column       | Type        | Description              |
| ------------ | ----------- | ------------------------ |
| `id`         | TEXT        | Primary key              |
| `user_id`    | TEXT        | FK → users.id            |
| `bytes`      | BIGINT      | Reserved plaintext bytes |
| `purpose`    | TEXT        | Operation label          |
| `expires_at` | TIMESTAMPTZ | Worker cleanup deadline  |
| `created_at` | TIMESTAMPTZ | Default now()            |

Statement-level insert and delete triggers maintain `users.storage_reserved`. The worker removes expired rows hourly in bounded batches.

### `files`

Files and folders.

| Column                   | Type        | Description                                              |
| ------------------------ | ----------- | -------------------------------------------------------- |
| `id`                     | TEXT        | Primary key                                              |
| `name`                   | TEXT        | Not null                                                 |
| `type`                   | TEXT        | 'file' or 'folder' (`files_type_valid` check)            |
| `size`                   | BIGINT      | File size in bytes (null for folders)                    |
| `mime_type`              | TEXT        | MIME type                                                |
| `user_id`                | TEXT        | FK → users.id, not null; the owning account              |
| `parent_id`              | TEXT        | FK → files.id, a folder of the same account; null = root |
| `path`                   | TEXT        | S3 object key. Null for folders                          |
| `starred`                | BOOLEAN     | Default false                                            |
| `shared`                 | BOOLEAN     | Default false; true while the item belongs to a share    |
| `shared_at`              | TIMESTAMPTZ | When the item joined a share; null when not shared       |
| `deleted_at`             | TIMESTAMPTZ | Soft delete timestamp                                    |
| `modified`               | TIMESTAMPTZ | Last modification time, not null, default now()          |
| `created_at`             | TIMESTAMPTZ | Row creation time, not null, default now()               |
| `accessed_at`            | TIMESTAMPTZ | Last read time, not null, default now()                  |
| `accessed_by`            | TEXT        | User who last read it (FK to users, null on delete)      |
| `dek_wrapped`            | BYTEA       | Wrapped per-file data key (DEK); null for folders        |
| `dek_kek_version`        | INTEGER     | Version of the KEK the DEK is wrapped under              |
| `aggregate_size`         | BIGINT      | Total bytes below a folder; zero for files               |
| `aggregate_file_count`   | INTEGER     | Descendant file count maintained for folders             |
| `aggregate_folder_count` | INTEGER     | Descendant folder count maintained for folders           |
| `content_version`        | BIGINT      | Raised by every replace and OnlyOffice save, default 1   |

**Indexes:** `user_id`, `parent_id`, `created_at`, unique `(path, user_id, type)` where `path IS NOT NULL` (also used for lookups by `path`), `(user_id, accessed_at DESC)` where `deleted_at IS NULL`, `dek_kek_version` for encrypted files, `(deleted_at, id)` for bounded trash cleanup, covering indexes for active-file statistics and storage-usage reconciliation, and folder-list page indexes for name, modified time, last access, and effective size.

**Folder totals and usage:** `files_aggregate_insert` and `files_aggregate_delete` are statement-level triggers: they group the statement's rows by parent and add each group's totals to every ancestor folder once, so an upload batch, copy or permanent delete of many items updates each ancestor once rather than once per item. Moves (`files_aggregate_update`) are handled row by row. `files_storage_insert` and `files_storage_delete` keep `users.storage_used` per statement; `files_storage_update` is a row trigger that fires only when `size`, `type` or `user_id` changes, so starring, sharing and access-time updates cost nothing extra.

**Hierarchy constraint:** `files_parent_not_self` rejects a row whose `parent_id` equals its own `id`. Move operations also reject indirect descendant cycles, and recursive reads keep a visited-ID path so legacy bad data cannot loop forever.

**Parent must be a folder:** a parent is always a folder of the same account. Upload, bulk upload, folder creation, copy and move check that it is a live folder before writing, and answer `404 Target folder not found` otherwise. The database enforces the type and account part: `files_parent_insert` and `files_parent_update` reject a row whose parent is a file or belongs to another account, and `files_children_update` refuses to change the type or account of a folder that still has children. They are row-level `AFTER` triggers, so a copy that inserts a folder and its children in one statement passes. Their `WHEN` clauses skip updates that leave `parent_id`, `user_id` and `type` alone. Migration `054_enforce_folder_parents` moved rows an earlier paste had stored under a file up to their nearest folder, adding a `(n)` suffix on a name clash as a move does.

**Triggers:** `files_storage_insert`, `files_storage_update`, and `files_storage_delete` update the account owner's `storage_used` counter once per statement from transition tables. `files_aggregate_insert`, `files_aggregate_update`, and `files_aggregate_delete` adjust ancestor folder totals when a row is inserted, moved, resized, changes type, or is removed.

**Aggregate columns:** These three columns are the only source of a folder's size and counts; no read path recomputes them. Incremental trigger maintenance can drift, because a delta that would take a counter below zero is clamped rather than carried. `reconcile_folder_aggregates(user_id)` recomputes them for one account from its own rows and returns how many folders were stored wrong. The worker runs it weekly. Trashed descendants are counted, matching the triggers.

Name search is backed by a trigram GIN index from `pg_trgm` on `lower(name)` and a `text_pattern_ops` btree on `lower(name)` for prefix matching — not a PostgreSQL full-text index.

**File timestamps:** `modified` is the file's own timestamp — uploads and copies preserve the client's original mtime, so it can be years old on a row written seconds ago. `created_at` is when the row was written and is what orphan detection uses to tell an in-flight write from an orphan. `accessed_at` is when the item was last read, and `accessed_by` which signed-in user read it: the owner or a sub-user, or null for a share-link visitor. `shared_at` is set when an item joins a share and cleared when it is unshared. Re-sharing an active item does not change it. Renames and moves change neither `path` nor `created_at`, and they do not count as reads, so `accessed_at` is left alone as well. Reading an item never changes `modified`.

**`accessed_at` precision:** The value is written at most once per update window per item, one hour by default, so it can lag a read by up to that long. This follows NTFS, which guarantees its last-access time only to within an hour, and Linux's `relatime`. Writes are buffered in memory and flushed in batches, so a read never waits on the update. See [File System](/docs/concepts/file-system#last-access-time).

### `file_locks`

Edit locks: who is editing a file in a desktop app or in OnlyOffice right now. A lock is a lease; an expired row counts as free and is replaced by the next lock.

| Column        | Type        | Description                                                                      |
| ------------- | ----------- | -------------------------------------------------------------------------------- |
| `file_id`     | TEXT        | Primary key, FK → files.id (cascade)                                             |
| `user_id`     | TEXT        | Who holds it, FK → users.id (cascade)                                            |
| `owner_id`    | TEXT        | The account the file belongs to, FK → users.id (cascade)                         |
| `acquired_at` | TIMESTAMPTZ | When it was taken, default now()                                                 |
| `expires_at`  | TIMESTAMPTZ | End of the lease                                                                 |
| `device_id`   | TEXT        | The desktop install, or `onlyoffice:` and the document key for a browser session |

### `share_links`

Share link metadata.

| Column       | Type        | Description                       |
| ------------ | ----------- | --------------------------------- |
| `id`         | TEXT        | Primary key (used as token)       |
| `file_id`    | TEXT        | FK → files.id                     |
| `user_id`    | TEXT        | FK → users.id                     |
| `expires_at` | TIMESTAMPTZ | Expiration (null = no expiration) |
| `created_at` | TIMESTAMPTZ | Default now()                     |

**Indexes:** `file_id`; partial index on `expires_at` where `expires_at IS NOT NULL`

`user_id` is always the owner of `file_id`. Links are only created for the caller's own files, and the public lookup joins on `files.user_id = share_links.user_id`. Migration `048_remove_cross_owner_share_links` deletes rows that break this rule.

### `share_link_files`

Junction table linking share links to files.

| Column     | Type | Description         |
| ---------- | ---- | ------------------- |
| `share_id` | TEXT | FK → share_links.id |
| `file_id`  | TEXT | FK → files.id       |

**Primary Key:** (`share_id`, `file_id`)

**Indexes:** `file_id`

Note the column is `share_id`, not `share_link_id`. Both foreign keys cascade on delete.

### `app_settings`

Application-wide settings.

| Column                       | Type        | Description                                                          |
| ---------------------------- | ----------- | -------------------------------------------------------------------- |
| `id`                         | TEXT        | Primary key (always 'app_settings')                                  |
| `signup_enabled`             | BOOLEAN     | Default true                                                         |
| `first_user_id`              | TEXT        | FK → users.id (immutable)                                            |
| `share_base_url`             | TEXT        | Custom share link base URL (null = use request origin)               |
| `max_upload_size_bytes`      | BIGINT      | Max single-file upload size in bytes (default 10737418240 = 10 GB)   |
| `hide_file_extensions`       | BOOLEAN     | When true, file names are shown without extensions (default false)   |
| `desktop_only`               | BOOLEAN     | When true, only the desktop app may use the main app (default false) |
| `allow_password_change`      | BOOLEAN     | When true, users may change their own password (default false)       |
| `cloud_drive_save_only`      | BOOLEAN     | Cloud Drive blocks reading file content (default true)               |
| `known_proxies`              | TEXT[]      | Proxy IPs, CIDR ranges, or hostnames trusted after server restart    |
| `session_idle_days`          | INTEGER     | Days without activity before a session ends, 1–365 (default 30)      |
| `access_time_tracking`       | BOOLEAN     | When false, `files.accessed_at` stops updating (default true)        |
| `access_time_window_minutes` | INTEGER     | Minutes before a re-read is written again, 0–1440 (default 60)       |
| `access_time_flush_seconds`  | INTEGER     | Seconds between batched access-time writes, 1–300 (default 10)       |
| `onlyoffice_url`             | TEXT        | OnlyOffice Document Server URL (null = integration off)              |
| `onlyoffice_jwt_secret`      | TEXT        | Shared secret for signing OnlyOffice payloads                        |
| `storage_provider`           | TEXT        | `s3`, `r2`, or `aws` (null = no bucket connected)                    |
| `storage_endpoint`           | TEXT        | Bucket endpoint origin                                               |
| `storage_region`             | TEXT        | Signing region (`auto` for R2)                                       |
| `storage_bucket`             | TEXT        | Bucket name                                                          |
| `storage_force_path_style`   | BOOLEAN     | Path-style addressing                                                |
| `storage_access_key_id`      | TEXT        | Access key ID                                                        |
| `storage_secret_encrypted`   | BYTEA       | Secret access key, AES-256-GCM under a KEK-derived subkey            |
| `storage_secret_kek_version` | INTEGER     | KEK version that encrypted the secret                                |
| `storage_updated_at`         | TIMESTAMPTZ | Last bucket settings change                                          |
| `storage_config_version`     | INTEGER     | Incremented on each save; used to detect concurrent edits            |
| `updated_at`                 | TIMESTAMPTZ | Default now()                                                        |

The table holds exactly one row, keyed `'app_settings'`. `first_user_id` has a `RESTRICT` foreign key, so the first user cannot be deleted while the row references them. The `app_settings_storage_complete` check constraint requires the `storage_*` columns other than `storage_updated_at` and `storage_config_version` to be all set or all null. The `app_settings_activity_ranges` check constraint holds the session and access-time columns to their ranges.

### `kek_checks`

One key check value per master key (KEK) version. See [Security Model](/docs/concepts/security-model#key-check).

| Column        | Type        | Description                                             |
| ------------- | ----------- | ------------------------------------------------------- |
| `version`     | INTEGER     | Primary key; the key version the value belongs to       |
| `check_value` | BYTEA       | HMAC-SHA256 of a fixed label under a subkey of that KEK |
| `created_at`  | TIMESTAMPTZ | Default now()                                           |

A row is written the first time a key version passes the startup check. Deleting a row makes the next startup verify that key against stored data again.

### `sessions`

Active user sessions.

| Column          | Type        | Description                            |
| --------------- | ----------- | -------------------------------------- |
| `id`            | TEXT        | Primary key                            |
| `user_id`       | TEXT        | FK → users.id                          |
| `token_version` | INTEGER     | Token version when created             |
| `user_agent`    | TEXT        | Browser user agent                     |
| `ip_address`    | INET        | Latest client IP observed on a request |
| `created_at`    | TIMESTAMPTZ | Default now()                          |
| `last_activity` | TIMESTAMPTZ | Default now()                          |

**Indexes:** `(user_id, token_version)`, `last_activity`

A session is invalid once its `token_version` falls behind the user's current one, which is how "logout everywhere" and a password change end every session at once.

**Retention:** rows older than 30 days are removed in bounded batches by the daily 04:20 UTC worker job.

### `file_operation_results`

Idempotency results for durable file operations.

| Column         | Type        | Description                              |
| -------------- | ----------- | ---------------------------------------- |
| `job_id`       | UUID        | Primary key; the `job_queue` job ID      |
| `user_id`      | TEXT        | Account that owns the operation          |
| `task`         | TEXT        | Operation type, currently `copy`         |
| `output`       | JSONB       | Stable result returned by a worker retry |
| `completed_at` | TIMESTAMPTZ | Default now()                            |

**Indexes:** `completed_at`

The copy transaction writes its result with the new file rows. If the queue retries the same job after that commit, the worker returns this result instead of inserting another copy. Rows older than 30 days are removed in bounded batches by the daily 04:50 UTC worker job.

### `mfa_backup_codes`

One row per single-use MFA backup code.

| Column       | Type        | Description                                 |
| ------------ | ----------- | ------------------------------------------- |
| `id`         | TEXT        | Primary key                                 |
| `user_id`    | TEXT        | FK → users.id, not null, CASCADE            |
| `code_hash`  | TEXT        | bcrypt hash of the code, not null           |
| `used`       | BOOLEAN     | Default false                               |
| `created_at` | TIMESTAMPTZ | Default `CURRENT_TIMESTAMP`                 |
| `used_at`    | TIMESTAMPTZ | When the code was spent (null while unused) |

Codes are stored hashed, never in plain text, so a lost code cannot be recovered — only replaced. Ten rows are written when MFA is enabled and again on each regeneration, which first deletes the old set. Disabling MFA deletes all of a user's rows.

**Indexes:** `user_id`; partial index on `(user_id, used)` where `used = FALSE`

### `client_heartbeats`

Browser-session presence and desktop app heartbeat records.

| Column         | Type         | Description                           |
| -------------- | ------------ | ------------------------------------- |
| `id`           | VARCHAR(64)  | Primary key                           |
| `user_id`      | VARCHAR(255) | FK → users.id                         |
| `session_id`   | VARCHAR(255) | JWT session ID (nullable)             |
| `app_version`  | VARCHAR(64)  | Desktop app version or `web`          |
| `platform`     | VARCHAR(64)  | `windows`, `macos`, `linux`, or `web` |
| `user_agent`   | TEXT         | Client request user agent             |
| `ip_address`   | VARCHAR(45)  | Client IP                             |
| `last_seen_at` | TIMESTAMPTZ  | Last heartbeat timestamp              |
| `created_at`   | TIMESTAMPTZ  | First heartbeat timestamp             |

**Indexes:** `user_id`. The table holds one row per desktop install or web session, so `last_seen_at` is left unindexed and each heartbeat update stays a cheap in-place (HOT) update.

The Active Sessions list treats a session as online only when a matching row was seen in the last three minutes. Browser presence rows use `web` for `app_version` and `platform`; the Active Desktop Clients admin list excludes them.

### `audit_log`

Audit trail events.

| Column               | Type        | Description                                         |
| -------------------- | ----------- | --------------------------------------------------- |
| `id`                 | BIGSERIAL   | Primary key                                         |
| `request_id`         | TEXT        | Correlation ID, not null                            |
| `user_id`            | TEXT        | FK → users.id (nullable). Who performed the action  |
| `account_owner_id`   | TEXT        | FK → users.id (nullable). Account it happened under |
| `actor_role`         | TEXT        | `owner` or `sub_user` at the time of the event      |
| `action`             | TEXT        | Event type, e.g. `file.upload`                      |
| `resource_type`      | TEXT        | Resource type                                       |
| `resource_id`        | TEXT        | Resource ID                                         |
| `status`             | TEXT        | 'success', 'failure' or 'error'                     |
| `ip_address`         | INET        | Client IP                                           |
| `user_agent`         | TEXT        | Browser user agent                                  |
| `metadata`           | JSONB       | Event-specific data                                 |
| `error_message`      | TEXT        | Error details when status is 'error'                |
| `processing_time_ms` | INTEGER     | Operation duration                                  |
| `created_at`         | TIMESTAMPTZ | Default now()                                       |

`user_id` is always the login that acted. For a sub-user, `account_owner_id` is the owner whose files were touched; for an owner the two match.

**Indexes:** `(user_id, created_at DESC)` where `user_id IS NOT NULL`, `(account_owner_id, created_at DESC)`, `action`, `created_at DESC`, `request_id`, `(resource_type, resource_id)` where both are set, and `(created_at DESC, action, error_message)` where status is `failure` or `error`. There is no general `metadata` GIN index; application queries use the indexed columns, avoiding the write cost of maintaining an index for administrative JSON searches.

**Retention:** rows older than 30 days are removed by the daily 03:40 UTC worker job. `cleanup_old_audit_logs(30)` deletes at most 10,000 rows per call, and one job processes at most 20 batches.

## Views

### `audit_activity`

Read-only view over `audit_log` that resolves user IDs to names and emails, so the trail can be read without writing joins.

| Column              | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `actor_id`          | `audit_log.user_id`                                  |
| `actor_name`        | Name of the login that acted                         |
| `actor_email`       | Email of the login that acted                        |
| `account_owner_id`  | Account the action happened under                    |
| `account_email`     | Email of the account owner                           |
| `acted_as_sub_user` | `true` when the actor differs from the account owner |
| `actor_role`        | `owner` or `sub_user`                                |

All other columns are passed through from `audit_log`.

```sql
SELECT created_at, actor_email, actor_role, action, resource_id
FROM audit_activity
WHERE account_email = 'owner@example.com'
ORDER BY created_at DESC
LIMIT 100;
```

### `job_queue`

Background jobs (migration 055). Workers claim rows with `FOR UPDATE SKIP LOCKED` and are woken by `NOTIFY tma_jobs`. See [Background Workers](/docs/guides/operations/background-workers).

| Column                    | Type        | Description                                                          |
| ------------------------- | ----------- | -------------------------------------------------------------------- |
| `id`                      | UUID        | Primary key                                                          |
| `queue`                   | TEXT        | Queue name, for example `account-file-operations`                    |
| `data`                    | JSONB       | Job input                                                            |
| `state`                   | TEXT        | `created`, `active`, `completed`, `failed`, or `cancelled`           |
| `singleton_key`           | TEXT        | Orders one account's jobs (FIFO) and de-duplicates scheduled jobs    |
| `retry_count`             | INTEGER     | Attempts used so far                                                 |
| `retry_limit`             | INTEGER     | Attempts allowed after the first (default 3)                         |
| `retry_delay_seconds`     | INTEGER     | First retry delay (default 60)                                       |
| `retry_backoff`           | BOOLEAN     | Double the delay on each retry (default true)                        |
| `retry_delay_max_seconds` | INTEGER     | Longest retry delay (default 3600)                                   |
| `expire_seconds`          | INTEGER     | An `active` job older than this is put back in the queue             |
| `start_after`             | TIMESTAMPTZ | Earliest time the job may run                                        |
| `started_at`              | TIMESTAMPTZ | When the current attempt started                                     |
| `completed_at`            | TIMESTAMPTZ | When the job finished                                                |
| `keep_seconds`            | INTEGER     | How long a finished row is kept before it is removed (default 86400) |
| `output`                  | JSONB       | Result, read by `GET /api/files/jobs/:jobId`                         |
| `error`                   | TEXT        | Last error                                                           |
| `created_at`              | TIMESTAMPTZ | Default now()                                                        |

**Indexes:** ready jobs per queue `(queue, created_at)` where `state = 'created'`; `(queue, singleton_key, state)` for keyed jobs; `started_at` of active jobs; `completed_at` of finished jobs.

### `job_schedules`

Cron schedules: the maintenance jobs and one row per open OnlyOffice document (`onlyoffice:<document key>`).

| Column        | Type        | Description                        |
| ------------- | ----------- | ---------------------------------- |
| `name`        | TEXT        | Primary key                        |
| `queue`       | TEXT        | Queue the job is added to          |
| `cron`        | TEXT        | Five-field cron expression, in UTC |
| `data`        | JSONB       | Job input                          |
| `last_run_at` | TIMESTAMPTZ | The last minute a job was added    |
| `created_at`  | TIMESTAMPTZ | Default now()                      |
| `updated_at`  | TIMESTAMPTZ | Default now()                      |

### `bulk_import_items`

Durable rollback records used by `tma-server import`. Each row records the import run, created file or folder ID, storage key when present, item type, and tree depth. A completed import removes its rows. A failed import consumes them in batches, deleting files before folders. Only a killed process leaves rows behind; a daily worker job removes rows older than seven days.

### `migrations`

Migration tracking.

| Column       | Type         | Description   |
| ------------ | ------------ | ------------- |
| `version`    | VARCHAR(255) | Primary key   |
| `applied_at` | TIMESTAMPTZ  | Default now() |

Applied versions are not run again. Changes needed by an existing installation must be shipped in a new forward migration rather than only editing an older file.

Each migration and its `migrations` row are committed in one transaction, so a crash cannot leave a migration applied but unrecorded. An advisory lock keeps two instances from applying migrations at the same time.

## Relationships

- User → Sub-users (parent-child, self-referential via `parent_user_id`, CASCADE)
- User → Files (one-to-many, CASCADE)
- File → Files (parent-child, self-referential, no cascade: deletes remove the deepest rows first, so a folder goes only after its contents)
- User → Share Links (one-to-many, CASCADE)
- Share Link → Files (many-to-many via `share_link_files`)
- User → Sessions (one-to-many, CASCADE)
- User → File Operation Results (logical account ownership through `user_id`)
- User → MFA Backup Codes (one-to-many, CASCADE)
- User → Client Heartbeats (one-to-many, CASCADE)
- User → Audit Log (one-to-many, SET NULL — on both `user_id` and `account_owner_id`)

Deleting an owner cascades to its sub-users. Deleting a sub-user removes only that login; the account's files stay because they are stored under the owner's ID.

## Common Queries

**List account files:**

`$1` is the account ID — the owner's ID, not the sub-user's.

```sql
SELECT * FROM files
WHERE user_id = $1 AND parent_id = $2 AND deleted_at IS NULL
ORDER BY type, name;
```

**Resolve the account for a login:**

```sql
SELECT COALESCE(parent_user_id, id) AS account_id, permissions
FROM users
WHERE id = $1;
```

**List an owner's sub-users:**

```sql
SELECT id, email, name, permissions, created_at
FROM users
WHERE parent_user_id = $1
ORDER BY created_at;
```

**Search files:**

This is the query used for search terms of three characters or more. Terms of one or two characters take a prefix-only branch instead, skipping the trigram similarity work.

```sql
SELECT * FROM files
WHERE user_id = $1 AND deleted_at IS NULL
  AND (
    lower(name) LIKE lower($2) || '%'
    OR lower(name) % lower($2)
  )
ORDER BY
  CASE
    WHEN lower(name) = lower($2) THEN 1
    WHEN lower(name) LIKE lower($2) || '%' THEN 2
    ELSE 3
  END ASC,
  similarity(lower(name), lower($2)) DESC NULLS LAST,
  modified DESC;
```

**Query audit log:**

```sql
SELECT action, status, metadata, created_at
FROM audit_log
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 100;
```

**Query everything done under one account, including its sub-users:**

```sql
SELECT created_at, user_id, actor_role, action, resource_id
FROM audit_log
WHERE account_owner_id = $1
ORDER BY created_at DESC
LIMIT 100;
```

## Related Topics

- [Architecture](/docs/concepts/architecture) - System architecture
- [Audit Events](/docs/reference/audit-events) - Audit event types
