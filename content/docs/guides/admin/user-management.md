---
title: 'User Management'
description: 'Manage users in TMA Cloud (admin only).'
---

Manage users in TMA Cloud (admin only).

## User Overview

### Viewing Users

1. Go to **Settings** → **Administration** (admin only)
2. Click **Show all users** under **Registered users**
3. View user details (name, email, storage usage)

Sub-users appear in this list under the account they belong to.

Accounts load automatically in cursor batches as you scroll. Each batch keeps an owner and all of its sub-users together; there are no Previous/Next controls.

### Viewing Active Desktop Clients

1. Go to **Settings** → **Administration** (admin only)
2. Click **View clients** under **Active desktop clients**
3. Review active desktop app clients (version, platform, IP, last seen)

### User Information

- **User:** Display name, with the email address under it
- **Storage:** Current storage usage, with a bar when the account has a limit
- **Limit:** Configured limit, or **Default**
- **Two-factor:** **On** or **Off**, with how many users have it on and the adoption percentage above the list
- **Joined:** The day the account was created. Hover over it for the exact time

On a narrow screen, **Joined** and then **Two-factor** are hidden so names stay readable.

## Creating Users

### Signup Control

- **On:** anyone who can reach the server can create an account
- **Off:** nobody can; account owners can still add sub-users
- Toggle in **Settings** → **Administration** → **Policies** → **Allow sign-up**

### Sub-users

Any account, including yours, can add extra logins that share its files and quota. These are created by the account owner in **Settings** → **Sub-users**, not from Administration, and they do not depend on the signup toggle. Sub-users are never administrators. See [Sub-users](/docs/guides/user/sub-users).

### Hide File Extensions

- When enabled, file names are shown without extensions (applies to all users)
- Toggle in **Settings** → **Administration** → **Policies** → **Hide file extensions**

### Cloud Drive Save-only

- When enabled, other apps can browse and save into the desktop app's Cloud Drive but cannot open files from it (applies to all desktop apps, on by default)
- Toggle in **Settings** → **Administration** → **Policies** → **Cloud Drive save-only**

## Managing Users

### Storage Limits

- Set a limit per account in the **Registered users** list. See [Storage Limits](/docs/guides/admin/storage-limits)

### MFA Management

- View MFA status per user in the user list
- Cannot enable or disable another user's MFA

### Passwords

- When **Allow password changes** is on in **Settings** → **Administration** → **Policies**, users can change their own password. There is no way for an admin to set another user's password from the interface.

## Related Topics

- [Storage Limits](/docs/guides/admin/storage-limits) - Configure storage
- [Policies](/docs/guides/admin/signup-control) - Sign-up and the other server-wide switches
- [Sub-users](/docs/guides/user/sub-users) - Extra logins on one account
- [MFA Management](/docs/guides/admin/mfa-management) - Multi-factor authentication
