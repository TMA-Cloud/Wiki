---
title: 'First Login'
description: 'Create your first account and get started with TMA Cloud.'
---

Create your first account and get started with TMA Cloud.

## Creating Your First Account

1. Open the TMA Cloud address in your browser, for example `http://localhost:3000`

2. Under the sign-in card, click **Create an account**

3. Fill in your details:
   - **Name** - Your display name
   - **Email** - Your email address
   - **Password** - At least 8 characters. The line under the field ticks green once it is long enough, and the eye at the end of the field shows what you typed

4. Click **Create account**. If something is missing, a message above the button says what to fix

If your account has two-factor authentication, signing in takes a second step: after the password, enter the 6-digit code from your authenticator app or a backup code, then click **Verify**. **Use a different account** goes back to the first step.

In the desktop app the card also asks for the **Server** address, and says **Connected** under it once the server answers.

## Password Managers

In the browser the sign-in fields are ordinary form fields with the standard `autocomplete` hints, so the browser's own password manager and extensions such as Bitwarden or 1Password can fill the email and password. After a successful sign-in or new account the browser can offer to save the login; a failed sign-in is not saved. The authentication code field is marked as a one-time code.

## First User Privileges

The first user to sign up automatically becomes the **administrator** with the following privileges:

- **Storage bucket** - Connect the S3-compatible bucket that stores files, and set the maximum upload size
- **Registered users** - See every account, its storage use and two-factor status, and set storage limits
- **Policies** - Sign-up, password changes, desktop-app-only access, hidden file extensions and Cloud Drive save-only
- **Sessions and activity** - The session timeout and recently opened tracking
- **Network** - Known proxies
- **Integrations** - OnlyOffice and the share link address
- **Maintenance** - Review orphaned files
- **Server updates** - The update guide link in **Settings** → **Updates**

## Connect Storage

Files cannot be uploaded or opened until a bucket is connected. After the first sign-in a banner shows **Set up storage**:

1. Click **Set up storage**, or go to **Settings** → **Storage**
2. Select the provider and enter the endpoint or account ID, bucket name, access key ID, and secret access key
3. Click **Save**. The connection is tested before it is saved

See [Storage Bucket](/docs/guides/admin/storage-bucket) for each provider's fields and the checks.

## Signup Control

As the first user (admin), you can control whether new users can sign up:

1. Go to **Settings** → **Administration** → **Policies**
2. Turn **Allow sign-up** on or off

Only the first user can change it. With sign-up off, nobody can create an account, but account owners can still add sub-users.

## Adding People to Your Account

If others need access to the same files, create a sub-user for each of them rather than sharing your password. Sub-users sign in with their own email and password, share your files and storage, and only get the permissions you tick. See [Sub-users](/docs/guides/user/sub-users).

## Next Steps

Now that you're logged in:

- **[Upload Files](/docs/guides/user/upload-files)** - Learn how to upload and manage files
- **[Manage Folders](/docs/guides/user/manage-folders)** - Organize your files
- **[Share Files](/docs/guides/user/share-files)** - Share files with others
- **[User Management](/docs/guides/admin/user-management)** - Manage users (admin only)
