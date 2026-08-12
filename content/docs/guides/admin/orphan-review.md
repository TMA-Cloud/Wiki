---
title: "Orphan Review"
description: "Review and delete orphaned files and broken records in TMA Cloud (admin only)."
---

Review and delete orphaned files and broken records in TMA Cloud (admin only).

## What an Orphan Is

Storage and the database are written separately, so a failed or interrupted operation can leave one side without the other. There are two cases:

- **Orphaned data** --- An object in the bucket (or a file in `UPLOAD_DIR`) that no row in `files` points at. It takes up space but is not visible to any user.
- **Broken record** --- A row in `files` whose `path` points at storage that no longer exists. It shows in the file list but cannot be downloaded.

Nothing is deleted automatically. The scan is read-only and only the first user (admin) can run it.

## Opening the Review Screen

1. Navigate to **Settings** → **Administration**
2. Find **Orphaned files**
3. Click **Review orphans**

The scan runs when the modal opens and whenever you change the grace window or click **Rescan**.

## Grace Window

The **Ignore anything newer than** selector sets how old an item must be before it is reported. Options are 1 hour, 6 hours, 24 hours (default), 7 days, and 30 days.

The window exists because writing a file is not atomic across storage and Postgres. An upload puts the object first and inserts the row afterwards, which for a large file can take minutes. During that gap the object has no row and looks exactly like an orphan. Anything younger than the window is held back on both sides and is never reported or deleted.

The backend enforces a floor of 1 hour and a ceiling of 1 year, regardless of what the client sends.

Row age comes from `files.created_at`, not `files.modified`. Uploads and copies preserve the client's original mtime, so `modified` says nothing about how long a row has existed. Renames and moves only change metadata and leave `path` and `created_at` alone, so they never turn a live file into an orphan.

## Reviewing the Results

A summary line above the tabs shows how many stored objects were scanned against how many records, how many entries were held back as too recent, and when the scan ran.

Results are split into two tabs, each with a count:

- **In storage, no record** --- Key, size, and last-written time. Deleting these permanently frees space and cannot be undone.
- **Record, no file** --- Name, missing storage key, owner, size, and when the row was added. Rows already in the trash are marked **In trash**. Deleting these clears the invalid entry without touching storage.

Select entries individually, or use **Select all N shown** for the current tab. The selection count and total size are shown while you pick, and the selection spans both tabs.

Each category reports at most 2000 entries per scan. When there are more, a notice appears; delete the listed entries and rescan to see the rest.

## Deleting

1. Select the entries to remove
2. Click **Delete N selected**
3. Click **Confirm delete N**

Deletion is limited to 500 entries per category per request.

Every entry is re-verified at the moment of deletion, so a scan you have had open for hours cannot destroy a live file:

- A storage key is skipped if a row now references it, if the object is gone, or if it was written inside the grace window.
- A row is skipped if it no longer exists, if it does not map to a storage key, if it was created inside the grace window, or if its object exists again.

Skipped entries are listed after the delete with the reason each one was kept. Caches for affected users are invalidated automatically.

## Audit Trail

Each scan and delete is recorded. Unauthorized attempts are recorded as failures. See [Audit Events](/docs/reference/audit-events) for `admin.orphans.scan`, `admin.orphans.delete`, and `admin.orphans.access`.

## Related Topics

- [Storage Management](/docs/concepts/storage-management) - Storage concepts
- [Background Workers](/docs/guides/operations/background-workers) - Automatic cleanup jobs
- [Users API](/docs/api/users#orphaned-files) - Endpoint reference
