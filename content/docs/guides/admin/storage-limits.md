---
title: 'Storage Limits'
description: 'Configure storage limits for users in TMA Cloud (admin only).'
---

Configure storage limits for users in TMA Cloud (admin only).

## Storage Limit Overview

### Default Behavior

- **S3:** No disk; default is unlimited when no limit set. **Settings** → **Storage** → **Usage** shows the amount used, and adds a bar with the percentage and free space once a limit is set.
- No hardcoded limits; configurable per user; set via **Settings** → **Administration** → **Registered users**

### Per-User Limits

- Set custom limits for specific users
- **S3:** Only per-user limit enforced; no disk cap.
- Monitor usage from the account's database-maintained counter

## Setting Storage Limits

### For Individual Users

1. Navigate to **Settings** → **Administration**
2. Click **Show all users** under **Registered users**
3. Click the user's limit (**Default** when none is set). An editor opens under their row
4. Enter a number and pick the unit (MB, GB, or TB)
5. Press Enter or click **Save**. **Use default** removes the limit, and Escape or **Cancel** closes the editor

An empty box also removes the limit. A limit below what the account already stores is refused, with the amount it has to clear. Sub-users show **Inherited**, because they use their owner's quota. An account with a limit shows a small bar under its usage, which turns amber at 80% and red at 95%.

### Limit Validation

- **S3:** Only per-user limit; no disk validation.
- Frontend and backend validation

## Storage Usage Monitoring

### User-Level

- View current usage per user (used, total, free)
- **S3:** total and free come from the per-user limit. With no limit, the account's own Storage section states that no quota is set and draws no bar.
- The bar turns amber at 80% of the quota and red at 95%

### System-Level

- Total storage used
- Per-user breakdown
- Storage trends

## Max Upload Size

The maximum size for a single uploaded file. Applies to all users.

### Configuring

1. Navigate to **Settings** → **Storage**
2. Click **Maximum upload size** under **Limits** to open it
3. Enter a value and select the unit (MB or GB)
4. Click **Save**

### Limits

- Minimum: 1 MB
- Maximum: 100 GB
- Default: 10 GB

Enforced on both frontend (before upload starts) and backend (during upload). The bulk import script also reads this setting from the database.

The backend derives the largest possible encrypted object from this setting and selects a multipart part size that stays within the S3 and R2 limit of 10,000 parts.

## Limit Enforcement

### Upload Restrictions

- Uploads blocked when per-user storage limit reached
- Uploads blocked when file exceeds max upload size
- Clear error messages
- Real-time enforcement

### Storage Calculation

- Files count toward limit
- Trash counts until permanently deleted
- Usage tracked by database triggers on file inserts, deletes and size changes
- Uploads and replacements lock the account row while checking quota, preventing concurrent requests from overshooting a finite limit
- Cache invalidated on file operations

## Best Practices

- Set appropriate limits based on use case
- Monitor usage regularly
- Adjust limits as needed

## Related Topics

- [User Management](/docs/guides/admin/user-management) - Manage users
- [Storage Management](/docs/concepts/storage-management) - Storage concepts
