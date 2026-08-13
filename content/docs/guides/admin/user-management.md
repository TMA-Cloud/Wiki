---
title: 'User Management'
description: 'Manage users in TMA Cloud (admin only).'
---

Manage users in TMA Cloud (admin only).

## User Overview

### Viewing Users

1. Go to **Settings** → **Administration** (admin only)
2. Click **Show all users** under Registered Users
3. View user details (email, name, storage usage)

Sub-users appear in this list under the account they belong to. The list also reports `parentUserId` and, for sub-users, their granted permissions.

### Viewing Active Desktop Clients

1. Go to **Settings** → **Administration** (admin only)
2. Click **View clients** under Active Desktop Clients
3. Review active Electron clients (version, platform, IP, last seen)

### User Information

- **Email:** User email address
- **Name:** Display name
- **Storage Usage:** Current storage usage
- **Storage Limit:** Configured limit
- **MFA Status:** MFA enabled/disabled
- **Created Date:** Account creation date

## Creating Users

### Signup Control

- **Enable Signup:** Allow public registration
- **Disable Signup:** No one is allowed to signup
- Toggle in **Settings** → **Administration** → **Allow User Signup**

### Sub-users

Any account, including yours, can add extra logins that share its files and quota. These are created by the account owner in **Settings** → **Sub-users**, not from Administration, and they do not depend on the signup toggle. Sub-users are never administrators. See [Sub-users](/docs/guides/user/sub-users).

### Hide File Extensions

- When enabled, file names are shown without extensions (applies to all users)
- Toggle in **Settings** → **Administration** → **Hide file extensions**

## Managing Users

### Storage Limits

- Set per-user storage limits
- Override default limits
- Monitor usage

### MFA Management

- View MFA status per user
- Cannot disable user MFA (user must do it)
- Monitor MFA adoption

### Passwords

- When **Allow password change** is enabled in **Settings** → **Administration**, users can change their password.

## User Operations

### Viewing User Files

- Access user file structure (admin only)
- Monitor storage usage
- Assist with file management

### Account Management

- View user activity
- Review audit logs per user
- Monitor storage usage

## Best Practices

- Regularly review user list
- Monitor storage usage
- Set appropriate storage limits
- Keep signup control appropriate for your use case

## Related Topics

- [Storage Limits](/docs/guides/admin/storage-limits) - Configure storage
- [Signup Control](/docs/guides/admin/signup-control) - Manage registration
- [Sub-users](/docs/guides/user/sub-users) - Extra logins on one account
- [MFA Management](/docs/guides/admin/mfa-management) - Multi-factor authentication
