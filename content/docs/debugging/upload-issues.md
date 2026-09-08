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
2. Bucket endpoint and credentials
3. Bucket access permissions
4. Network connectivity

### "Upload cancelled by client" (499 REQUEST_ABORTED)

Returned when the user cancels an upload. The request is aborted before completion. The upload middleware aborts incomplete multipart uploads and cleans up uncommitted bucket objects. This is expected behavior, not an error

### Folder uploads missing files

- Confirm the browser supports folder upload (Chrome, Edge, and other Chromium-based browsers)
- Check that the selected folder actually contains the missing files (some apps create links or placeholders that are not real files)
- Look in **Audit Logs** for `file.upload.bulk` events to see how many files were processed.
- If only some files failed, check the `failed` entries returned by `POST /api/files/upload/bulk`

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
