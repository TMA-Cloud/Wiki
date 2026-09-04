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
| `password`                      | TEXT        | Hashed (nullable for OAuth-only accounts)                    |
| `name`                          | TEXT        | Display name                                                 |
| `google_id`                     | TEXT        | Unique (optional)                                            |
| `mfa_enabled`                   | BOOLEAN     | Default false                                                |
| `mfa_secret`                    | TEXT        | TOTP secret (nullable)                                       |
| `mfa_last_time_step`            | BIGINT      | Last TOTP time step spent                                    |
| `last_backup_code_regeneration` | TIMESTAMPTZ | Stamped when backup codes are regenerated                    |
| `token_version`                 | INTEGER     | Token version for revocation, default 1                      |
| `last_token_invalidation`       | TIMESTAMP   | Last token invalidation time                                 |
| `storage_limit`                 | BIGINT      | Storage limit (nullable, bytes)                              |
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

### `files`

Files and folders.

| Column            | Type        | Description                                                                      |
| ----------------- | ----------- | -------------------------------------------------------------------------------- |
| `id`              | TEXT        | Primary key                                                                      |
| `name`            | TEXT        | Not null                                                                         |
| `type`            | TEXT        | 'file' or 'folder'                                                               |
| `size`            | BIGINT      | File size in bytes (null for folders)                                            |
| `mime_type`       | TEXT        | MIME type                                                                        |
| `user_id`         | TEXT        | FK → users.id, the account the row belongs to                                    |
| `parent_id`       | TEXT        | FK → files.id (null for root)                                                    |
| `path`            | TEXT        | Storage key: filename under `UPLOAD_DIR`, or the S3 object key. Null for folders |
| `starred`         | BOOLEAN     | Default false                                                                    |
| `shared`          | BOOLEAN     | Default false; true while an active share link exists                            |
| `deleted_at`      | TIMESTAMPTZ | Soft delete timestamp                                                            |
| `modified`        | TIMESTAMPTZ | Last modification time, not null, default now()                                  |
| `created_at`      | TIMESTAMPTZ | Row creation time, not null, default now()                                       |
| `accessed_at`     | TIMESTAMPTZ | Last read time, not null, default now()                                          |
| `dek_wrapped`     | BYTEA       | Wrapped per-file data key (DEK); null for folders                                |
| `dek_kek_version` | INTEGER     | Version of the KEK the DEK is wrapped under                                      |

**Indexes:** `user_id`, `parent_id`, `deleted_at`, `created_at`, partial index and unique index on `path` where `path IS NOT NULL`, `(user_id, accessed_at DESC)` where `deleted_at IS NULL`, `dek_kek_version` for encrypted files (used by key rotation), plus several partial indexes supporting trash listing and the recursive folder CTEs.

Name search is backed by trigram GIN indexes from `pg_trgm` (`name`, `lower(name)`) and a `text_pattern_ops` btree on `lower(name)` for prefix matching — not a PostgreSQL full-text index.

**The three timestamps:** `modified` is the file's own timestamp — uploads and copies preserve the client's original mtime, so it can be years old on a row written seconds ago. `created_at` is when the row was written and is what orphan detection uses to tell an in-flight write from an orphan. `accessed_at` is when the item was last read. Renames and moves change neither `path` nor `created_at`, and they do not count as reads, so `accessed_at` is left alone as well. Reading an item never changes `modified`.

**`accessed_at` precision:** The value is written at most once per hour per item, so it can lag a read by up to that long. This follows NTFS, which guarantees its last-access time only to within an hour, and Linux's `relatime`. Writes are buffered in memory and flushed in batches, so a read never waits on the update. See [File System](/docs/concepts/file-system#last-access-time).

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

| Column                    | Type        | Description                                                        |
| ------------------------- | ----------- | ------------------------------------------------------------------ |
| `id`                      | TEXT        | Primary key (always 'app_settings')                                |
| `signup_enabled`          | BOOLEAN     | Default true                                                       |
| `first_user_id`           | TEXT        | FK → users.id (immutable)                                          |
| `share_base_url`          | TEXT        | Custom share link base URL (null = use request origin)             |
| `max_upload_size_bytes`   | BIGINT      | Max single-file upload size in bytes (default 10737418240 = 10 GB) |
| `hide_file_extensions`    | BOOLEAN     | When true, file names are shown without extensions (default false) |
| `require_electron_client` | BOOLEAN     | When true, only desktop app is allowed to use (default false)      |
| `allow_password_change`   | BOOLEAN     | When true, users may change their own password (default false)     |
| `onlyoffice_url`          | TEXT        | OnlyOffice Document Server URL (null = integration off)            |
| `onlyoffice_jwt_secret`   | TEXT        | Shared secret for signing OnlyOffice payloads                      |
| `updated_at`              | TIMESTAMPTZ | Default now()                                                      |

The table holds exactly one row, keyed `'app_settings'`. `first_user_id` has a `RESTRICT` foreign key, so the first user cannot be deleted while the row references them.

### `sessions`

Active user sessions.

| Column          | Type        | Description                             |
| --------------- | ----------- | --------------------------------------- |
| `id`            | TEXT        | Primary key                             |
| `user_id`       | TEXT        | FK → users.id                           |
| `token_version` | INTEGER     | Token version when created              |
| `user_agent`    | TEXT        | Browser user agent                      |
| `ip_address`    | INET        | Client IP                               |
| `created_at`    | TIMESTAMPTZ | Default now()                           |
| `last_activity` | TIMESTAMPTZ | Default now() (updates on each request) |

**Indexes:** `(user_id, created_at DESC)`, `(user_id, token_version)`, `last_activity`

A session is invalid once its `token_version` falls behind the user's current one, which is how "logout everywhere" and a password change end every session at once.

### `mfa_backup_codes`

One row per single-use MFA backup code.

| Column       | Type      | Description                                 |
| ------------ | --------- | ------------------------------------------- |
| `id`         | TEXT      | Primary key                                 |
| `user_id`    | TEXT      | FK → users.id, not null, CASCADE            |
| `code_hash`  | TEXT      | bcrypt hash of the code, not null           |
| `used`       | BOOLEAN   | Default false                               |
| `created_at` | TIMESTAMP | Default `CURRENT_TIMESTAMP`                 |
| `used_at`    | TIMESTAMP | When the code was spent (null while unused) |

Codes are stored hashed, never in plain text, so a lost code cannot be recovered — only replaced. Ten rows are written when MFA is enabled and again on each regeneration, which first deletes the old set. Disabling MFA deletes all of a user's rows.

**Indexes:** `user_id`; partial index on `(user_id, used)` where `used = FALSE`

### `client_heartbeats`

Active Electron desktop client heartbeat records.

| Column         | Type         | Description                     |
| -------------- | ------------ | ------------------------------- |
| `id`           | VARCHAR(64)  | Primary key                     |
| `user_id`      | VARCHAR(255) | FK → users.id                   |
| `session_id`   | VARCHAR(255) | JWT session ID (nullable)       |
| `app_version`  | VARCHAR(64)  | Electron app version            |
| `platform`     | VARCHAR(64)  | Client platform (`win32`, etc.) |
| `user_agent`   | TEXT         | Electron request user agent     |
| `ip_address`   | VARCHAR(45)  | Client IP                       |
| `last_seen_at` | TIMESTAMPTZ  | Last heartbeat timestamp        |
| `created_at`   | TIMESTAMPTZ  | First heartbeat timestamp       |

**Indexes:** `user_id`, `last_seen_at`

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

**Indexes:** `(user_id, created_at DESC)` where `user_id IS NOT NULL`, `(account_owner_id, created_at DESC)`, `action`, `created_at DESC`, `request_id`, `(resource_type, resource_id)` where both are set, `(created_at DESC, action, error_message)` where status is `failure` or `error`, and a GIN index on `metadata` using `jsonb_path_ops`.

**Retention:** rows older than 30 days are removed by the `cleanup_old_audit_logs(30)` function, called by a cleanup job every 24 hours.

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

### `pgboss.*`

pg-boss job queue tables (managed automatically).

### `migrations`

Migration tracking.

| Column       | Type         | Description   |
| ------------ | ------------ | ------------- |
| `version`    | VARCHAR(255) | Primary key   |
| `applied_at` | TIMESTAMPTZ  | Default now() |

## Relationships

- User → Sub-users (parent-child, self-referential via `parent_user_id`, CASCADE)
- User → Files (one-to-many, CASCADE)
- File → Files (parent-child, self-referential, CASCADE)
- User → Share Links (one-to-many, CASCADE)
- Share Link → Files (many-to-many via `share_link_files`)
- User → Sessions (one-to-many, CASCADE)
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
    OR (lower(name) LIKE '%' || lower($2) || '%'
        AND similarity(lower(name), lower($2)) > 0.15)
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
