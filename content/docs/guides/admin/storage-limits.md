---
title: 'Storage Limits'
description: 'Configure storage limits for users in TMA Cloud (admin only).'
---

Configure storage limits for users in TMA Cloud (admin only).

## Storage Limit Overview

### Default Behavior

- **S3:** No disk; default is unlimited when no limit set. UI shows "X used of Unlimited" or "X used of Y" when limit set.
- No hardcoded limits; configurable per user; set via **Settings** → **Administration** → **Registered Users**

### Per-User Limits

- Set custom limits for specific users
- **S3:** Only per-user limit enforced; no disk cap.
- Monitor usage from the account's database-maintained counter

## Setting Storage Limits

### For Individual Users

1. Navigate to **Settings** → **Administration**
2. Open **Registered Users**
3. Select the user
4. Set storage limit (MB, GB, or TB)
5. Save changes

### Limit Validation

- **S3:** Only per-user limit; no disk validation.
- Frontend and backend validation

## Storage Usage Monitoring

### User-Level

- View current usage per user (used, total, free)
- **S3:** total/free from per-user limit or "Unlimited" when no limit; percentage shown only when limit set.
- Visual indicators

### System-Level

- Total storage used
- Per-user breakdown
- Storage trends

## Max Upload Size

The maximum size for a single uploaded file. Applies to all users.

### Configuring

1. Navigate to **Settings** → **Storage**
2. Click the pencil icon next to **Max upload size**
3. Enter a value and select the unit (MB or GB)
4. Click **Save**

### Limits

- Minimum: 1 MB
- Maximum: 100 GB
- Default: 10 GB

Enforced on both frontend (before upload starts) and backend (during upload). The bulk import script also reads this setting from the database.

## Limit Enforcement

### Upload Restrictions

- Uploads blocked when per-user storage limit reached
- Uploads blocked when file exceeds max upload size
- Clear error messages
- Real-time enforcement

### Storage Calculation

- Files count toward limit
- Trash counts until permanently deleted
- Usage tracked by statement-level database triggers
- Uploads and replacements lock the account row while checking quota, preventing concurrent requests from overshooting a finite limit
- Cache invalidated on file operations

## Best Practices

- Set appropriate limits based on use case
- Monitor usage regularly
- Adjust limits as needed

## Related Topics

- [User Management](/docs/guides/admin/user-management) - Manage users
- [Storage Management](/docs/concepts/storage-management) - Storage concepts
