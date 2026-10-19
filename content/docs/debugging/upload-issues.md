---
title: 'Upload Issues'
description: 'Fix uploads that are refused, fail, or leave files out.'
---

Fix uploads that are refused, fail, or leave files out.

## Upload Failures

### File Not Uploading

**Check:**

1. Storage limit not exceeded
2. File size within max upload size (admin-configurable in **Settings** → **Storage**)
3. Network connection stable
4. Bucket available and within provider limits

### File Too Large

The file exceeds the max upload size setting.

**Solutions:**

1. Check the current max upload size in **Settings** → **Storage**
2. Admin: Increase the max upload size
3. Split the file into smaller parts

## Upload Errors

### "Storage limit exceeded"

**Solutions:**

The message says how much is used, the limit and what is left.

1. Delete files you no longer need, then empty the trash: items in the trash still count
2. Ask the admin to raise the account's limit
3. Check the bucket provider's quota and account status

### "Upload failed"

**Check:**

1. The file is within the maximum upload size
2. A bucket is saved in **Settings** → **Storage** (`503 STORAGE_NOT_CONFIGURED` otherwise); use **Test connection** there to check the endpoint and credentials
3. Bucket access permissions
4. Network connectivity

### "Invalid file name"

The name is empty, is `.` or `..`, is longer than 255 characters, or contains `/`, `\` or a control character. Every other character is accepted, including `: * ? " < > |`. See [File Names](/docs/concepts/file-system#file-names).

**Solutions:**

1. Rename the file on your computer and upload it again
2. Desktop app: if the name in the error has a `?` that the real name does not, update the desktop app. Older versions read pasted file paths in the console code page, which turns characters such as the narrow no-break space before AM or PM into `?`

### "Target folder not found"

The folder you upload or paste into is not a folder in your account, or it is in the trash. Uploads into a file are refused for the same reason. Nothing is stored.

**Solutions:**

1. Refresh the page; the folder may have been deleted, moved to the trash or moved by another session
2. Upload into a folder that is open in **My Files**

### Upload Cancelled

Cancelling an upload stops its request. The server aborts the unfinished upload in the bucket and saves no file, so nothing needs cleaning up. This is not an error

### Folder Uploads Missing Files

- Check that the selected folder actually contains the missing files (some apps create links or placeholders that are not real files)
- Query the audit log for `file.upload.bulk` events to see how many files were processed. See [Audit Logs](/docs/guides/operations/audit-logs)
- If only some files failed, check the `failed` entries returned by `POST /api/files/upload/bulk`
- Empty subfolders are not created by an upload or a paste, because only files are sent

### Pasted Folder Missing Files (Desktop App)

The upload-issues dialog lists every file that was not pasted, with a reason:

- **Links are not uploaded:** The item is a symbolic link or a junction. It is not followed, so a link back to a parent folder cannot repeat the tree forever. Copy the target folder itself instead
- **Access denied** or **Could not be read:** Windows did not let the app read the file, for example a workbook that Excel has open. Close the file and paste it again

A paste with more than 50,000 files is refused before anything uploads. Paste a smaller folder or upload it in parts with **Upload** → **Choose folder**.

## File Permissions

### Permission Denied

**Solutions:**

1. A sub-user needs the **Upload & create** permission
2. The bucket credentials must allow uploads, reads, listing and deletion
3. The backend log shows the provider's error

## Related Topics

- [Common Errors](/docs/debugging/common-errors) - General troubleshooting
- [Files API](/docs/api/files) - Upload endpoints
- [Storage Management](/docs/concepts/storage-management) - Storage concepts
