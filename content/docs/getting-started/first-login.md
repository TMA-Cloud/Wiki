---
title: 'First Login'
description: 'Create your first account and get started with TMA Cloud.'
---

Create your first account and get started with TMA Cloud.

## Creating Your First Account

1. Navigate to the TMA Cloud application in your browser
   - Production: `http://localhost:3000`
   - Development: `http://localhost:5173`

2. Click **"Sign Up"** or navigate to the signup page

3. Fill in your details:
   - **Email** - Your email address
   - **Password** - A strong password
   - **Name** - Your display name

4. Click **"Create Account"**

## First User Privileges

The first user to sign up automatically becomes the **administrator** with the following privileges:

- **Storage Bucket** - Connect the S3-compatible bucket that stores files
- **User Management** - Manage all users
- **Storage Limits** - Set storage limits for users
- **Signup Control** - Enable or disable user registration
- **MFA Management** - Manage multi-factor authentication settings
- **OnlyOffice Settings** - Configure OnlyOffice integration
- **Share Base URL** - Configure custom domain for share links
- **Hide File Extensions** - Show file names with or without extensions
- **System Settings** - Access to all administrative features

## Connect Storage

Files cannot be uploaded or opened until a bucket is connected. After the first sign-in a banner shows **Set up storage**:

1. Click **Set up storage**, or go to **Settings** → **Storage**
2. Select the provider and enter the endpoint or account ID, bucket name, access key ID, and secret access key
3. Click **Save**. The connection is tested before it is saved

See [Storage Bucket](/docs/guides/admin/storage-bucket) for each provider's fields and the checks.

## Signup Control

As the first user (admin), you can control whether new users can sign up:

1. Go to **Settings** (admin section)
2. Find **"User Signup"** section
3. Toggle signup on/off as needed

When signup is disabled, only the first user (admin) can allow signup.

## Adding People to Your Account

If others need access to the same files, create a sub-user for each of them rather than sharing your password. Sub-users sign in with their own email and password, share your files and storage, and only get the permissions you tick. See [Sub-users](/docs/guides/user/sub-users).

## Next Steps

Now that you're logged in:

- **[Upload Files](/docs/guides/user/upload-files)** - Learn how to upload and manage files
- **[Manage Folders](/docs/guides/user/manage-folders)** - Organize your files
- **[Share Files](/docs/guides/user/share-files)** - Share files with others
- **[User Management](/docs/guides/admin/user-management)** - Manage users (admin only)

---

**Welcome to TMA Cloud!** 🎉
