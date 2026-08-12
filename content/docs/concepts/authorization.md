---
title: "Authorization"
description: "Authorization and access control in TMA Cloud."
---

Authorization and access control in TMA Cloud.

## Accounts and Logins

A login is either an **account owner** or a **sub-user**.

- **Account owner** - A top-level account. Owns files, folders and a storage quota.
- **Sub-user** - An extra login created by an owner. Shares that owner's files, folders and quota, but has its own email, password, MFA and sessions.

The account a login acts under is the owner: itself for an owner, the parent for a sub-user. Every file operation is scoped to that account, which is what makes an owner and its sub-users see the same files.

Sub-users cannot create sub-users. This is enforced by the API and by a database trigger.

## User Roles

### Administrator

The first user to sign up automatically becomes an administrator with:

- Full system access
- User management
- Storage limit configuration
- Signup control
- MFA management
- OnlyOffice settings
- System settings

Administrator status belongs to that one account. A sub-user created by the admin account is not an administrator.

### Regular User

Standard users can:

- Manage their own files
- Create share links
- Create and manage sub-users of their own account
- Configure their own MFA
- View their own storage usage

### Sub-user

Sub-users can do whatever their permissions allow within the owner's account. They cannot:

- Create, edit or remove sub-users
- Access administration settings
- See or reach any other account's files

## Permission Model

### Sub-user Permissions

Owners hold every permission over their own account and are never checked against a list. Sub-users are granted permissions individually:

| Permission      | Key              | Covers                                                   |
| --------------- | ---------------- | -------------------------------------------------------- |
| Download        | `files.download` | Single and bulk download, opening files in the viewer    |
| Upload & create | `files.upload`   | Upload, folder creation, copy, derived files             |
| Modify          | `files.edit`     | Rename, move, star, replace contents, document editing   |
| Share           | `files.share`    | Create and revoke share links, read existing share links |
| Move to trash   | `files.delete`   | Soft delete                                              |
| Manage trash    | `files.trash`    | Restore, permanent delete, empty trash                   |

Browsing is not a permission. Listing folders, searching, and reading file details are available to every member of an account.

Anything not granted is denied. There is no deny list, because there is nothing to inherit from.

### File Permissions

- **Account owner:** Full control (read, write, delete, share)
- **Sub-user:** Read and browse, plus whatever permissions are granted
- **Public (via share link):** Read-only access

### Administrative Permissions

- **User Management:** View all users; set per-user storage limits
- **Storage Limits:** Set per-user storage limits
- **System Settings:** Configure global settings

## Access Control

### File Access

- Files belong to the account, not to the individual login
- An owner and its sub-users see the same files
- No cross-account file access
- Share links provide public access to specific files

### API Access

- Most endpoints require authentication
- Admin-only endpoints check whether the caller is the first user
- Owner-only endpoints (sub-user management) reject sub-users with `403`
- File endpoints check the caller's permission and reject with `403` when it is missing
- Rate limiting applies to all endpoints

### Share Links

- Public access without authentication
- Token-based access control
- Optional expiration dates

## Where Permissions Are Enforced

Permission checks run on the server before the handler, and before any upload body is read. The interface hides actions the current login cannot perform, but hiding is a convenience — the server is what enforces the rule.

Two cases are worth noting:

- **OnlyOffice** - The save callback arrives from the document server without a user session, so a sub-user without **Modify** gets the editor in view-only mode when the document is opened.
- **Share links** - Reading an existing link requires **Share**, because copying a link is how account content reaches people outside the account.

## Security Considerations

- All file operations are account-scoped
- Share links use cryptographically secure tokens
- Admin operations are logged in audit trail
- Denied permission checks are logged as `account.permission_denied`
- Session-based authorization checks

## Related Topics

- [Authentication](/docs/concepts/authentication) - How users authenticate
- [Sub-users](/docs/guides/user/sub-users) - Creating and managing sub-users
- [Security Model](/docs/concepts/security-model) - Overall security architecture
- [Sharing Model](/docs/concepts/sharing-model) - How file sharing works
