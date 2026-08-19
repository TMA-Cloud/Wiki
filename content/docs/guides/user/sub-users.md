---
title: 'Sub-users'
description: 'Give other people their own login to your account in TMA Cloud.'
---

Give other people their own login to your account in TMA Cloud.

## What a Sub-user Is

A sub-user is an extra login that belongs to your account. Sub-users share your files, folders and storage quota, but sign in with their own email and password.

Use sub-users instead of handing your password to a colleague. Because each person signs in separately, the audit log records who performed each action, and you can grant each person only the permissions they need.

- Any regular account can create sub-users
- A sub-user cannot create sub-users of its own
- Sub-users are not administrators, even when created by the admin account

## Creating a Sub-user

1. Go to **Settings** → **Sub-users**
2. Click **Manage sub-users**
3. Click **Add sub-user**
4. Fill in the details:
   - **Name** - Required. Shown in the audit log next to their actions
   - **Email** - Their login email. Must not already be in use anywhere on the instance
   - **Password** - At least 8 characters
5. Tick the permissions they should have (see below)
6. Click **Create sub-user**

New sub-users start with all permissions ticked. Untick the ones you do not want to grant before creating.

## Permissions

Each sub-user has its own set of permissions. Anything left unticked is denied.

| Permission          | Allows                                                   |
| ------------------- | -------------------------------------------------------- |
| **Download**        | Download files and folders, and open them in the viewer  |
| **Upload & create** | Upload files, create folders, and copy existing items    |
| **Modify**          | Rename, move, star, and edit document contents           |
| **Share**           | Create and revoke share links, and copy existing links   |
| **Move to trash**   | Send files and folders to the trash                      |
| **Manage trash**    | Restore items from the trash and delete them permanently |

Browsing is always allowed. Every sub-user can open folders, search, and see file details, even with nothing ticked.

Two shortcuts are available above the list: **Allow all** ticks every permission, **Clear all** unticks them.

### Changing Permissions Later

1. Go to **Settings** → **Sub-users** → **Manage sub-users**
2. Click the permission summary in the sub-user's row to open its checklist
3. Tick or untick permissions
4. Click **Save permissions**

Changes take effect on the sub-user's next request. They do not need to log in again.

### What Sub-users See

Actions a sub-user does not have permission for are hidden from the interface. A sub-user without **Upload & create** has no Upload button, no drop zone, and no **New folder** option; one without **Move to trash** has no Delete entry in the context menu.

If a request is made anyway, the server rejects it with `403` and a message naming the missing permission.

## Removing a Sub-user

1. Go to **Settings** → **Sub-users** → **Manage sub-users**
2. Click the trash icon in the sub-user's row
3. Click **Confirm**

Removing a sub-user deletes only the login. Files stay in your account, because they were always stored under your account rather than the sub-user's. The sub-user's active sessions are ended immediately.

## Storage

Sub-users share your storage quota. Anything they upload counts against your limit, and a sub-user's own storage limit setting is never used.

## Audit Log

Each entry records both the person who acted and the account it happened under. See [Audit Logs](/docs/guides/operations/audit-logs) for how to query it.

## Related Topics

- [Authorization](/docs/concepts/authorization) - Accounts, sub-users, and permissions
- [Users API](/docs/api/users) - Sub-user endpoints
- [Audit Logs](/docs/guides/operations/audit-logs) - Reading the audit trail
