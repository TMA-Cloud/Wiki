---
title: 'Upload Issues'
description: 'Troubleshooting file upload problems.'
---

Troubleshooting file upload problems.

## Upload Failures

### File Not Uploading

**Check:**

1. Storage limit not exceeded
2. File size within max upload size (admin-configurable in **Settings** → **Storage**)
3. Network connection stable
4. Bucket available and within provider limits

### Storage Limit

**Solutions:**

1. Check current storage usage
2. Delete unnecessary files
3. Empty trash
4. Admin: Increase storage limit

### File Too Large

The file exceeds the max upload size setting.

**Solutions:**

1. Check the current max upload size in **Settings** → **Storage**
2. Admin: Increase the max upload size
3. Split the file into smaller parts

## Upload Errors

### "Storage limit exceeded"

**Solutions:**

1. Free up storage space
2. Delete old files
3. Empty trash permanently
4. Admin: Increase storage limit (if custom limit set)
5. Check the bucket provider quota and account status

### "Upload failed"

**Check:**

1. File size limits
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

### "Upload cancelled by client" (499 REQUEST_ABORTED)

Returned when the user cancels an upload. The request is aborted before completion. The upload middleware aborts incomplete multipart uploads and cleans up uncommitted bucket objects. This is expected behavior, not an error

### Folder uploads missing files

- Confirm the browser supports folder upload (Chrome, Edge, and other Chromium-based browsers)
- Check that the selected folder actually contains the missing files (some apps create links or placeholders that are not real files)
- Look in **Audit Logs** for `file.upload.bulk` events to see how many files were processed.
- If only some files failed, check the `failed` entries returned by `POST /api/files/upload/bulk`
- Empty subfolders are not created by an upload or a paste, because only files are sent

### Pasted folder missing files (desktop app)

The upload-issues dialog lists every file that was not pasted, with a reason:

- **Links are not uploaded:** The item is a symbolic link or a junction. It is not followed, so a link back to a parent folder cannot repeat the tree forever. Copy the target folder itself instead
- **Access denied** or **Could not be read:** Windows did not let the app read the file, for example a workbook that Excel has open. Close the file and paste it again

A paste with more than 50,000 files is refused before anything uploads. Paste a smaller folder or use **Upload folder** in parts.

## File Permissions

### Permission Denied

**Solutions:**

1. Check that the configured bucket credentials allow uploads and deletion
2. Verify the user has upload permission
3. Check bucket policies and endpoint reachability
4. Review backend logs for the provider error

## Related Topics

- [Common Errors](/docs/debugging/common-errors) - General troubleshooting
- [Files API](/docs/api/files) - Upload endpoints
- [Storage Management](/docs/concepts/storage-management) - Storage concepts
