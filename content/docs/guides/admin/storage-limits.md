---
title: 'Storage Limits'
description: 'Configure storage limits for users in TMA Cloud (first user only).'
---

Configure storage limits for users in TMA Cloud (first user only).

## Storage Limit Overview

### Default Behavior

- An account without a limit is unlimited. **Settings** → **Storage** shows the amount used, and adds a bar with the percentage and free space once a limit is set
- Limits are set per account in **Settings** → **Administration** → **Registered users**

### Per-User Limits

- A limit covers the account and all of its sub-users
- Usage comes from a counter the database keeps up to date with every write

## Setting Storage Limits

### For Individual Users

1. Navigate to **Settings** → **Administration**
2. Click **Show all users** under **Registered users**
3. Click the user's limit (**Default** when none is set). An editor opens under their row
4. Enter a number and pick the unit (MB, GB, or TB)
5. Press Enter or click **Save**. **Use default** removes the limit, and Escape or **Cancel** closes the editor

An empty box also removes the limit. A limit below what the account already stores is refused, with the amount it has to clear. Sub-users show **Inherited**, because they use their owner's quota. An account with a limit shows a small bar under its usage, which turns amber at 80% and red at 95%.

## Storage Usage Monitoring

### User-Level

- View current usage per user (used, total, free)
- With no limit, the account's own Storage page says **No storage limit** and draws no bar
- The bar turns amber at 80% of the quota and red at 95%

### All Accounts

- The **Registered users** list shows each account's usage and limit

## Max Upload Size

The maximum size for a single uploaded file. Applies to all users.

### Configuring

1. Navigate to **Settings** → **Storage**
2. Click **Maximum upload size** under **Server settings** to open it
3. Enter a value and select the unit (MB or GB)
4. Click **Save**

### Limits

- Minimum: 1 MB
- Maximum: 100 GB
- Default: 10 GB

The app checks it before an upload starts and the server enforces it while the bytes arrive. `tma-server import` also reads it from the database.

The backend derives the largest possible encrypted object from this setting and selects a multipart part size that stays within the S3 and R2 limit of 10,000 parts.

## Limit Enforcement

### Upload Restrictions

- Uploads and saves that would pass the account's limit are refused with the space used, the limit and what is left
- Files larger than the maximum upload size are refused

### Storage Calculation

- Files count toward limit
- Trash counts until permanently deleted
- Usage tracked by database triggers on file inserts, deletes and size changes
- Uploads and replacements lock the account row while checking quota, preventing concurrent requests from overshooting a finite limit

## Related Topics

- [User Management](/docs/guides/admin/user-management) - Manage users
- [Storage Management](/docs/concepts/storage-management) - Storage concepts
