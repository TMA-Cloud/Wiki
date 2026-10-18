---
title: 'Share Files'
description: 'Create shareable links for files and folders in TMA Cloud.'
---

Create shareable links for files and folders in TMA Cloud.

## Creating Share Links

### Single File Share

1. Right-click on a file
2. Select **"Share"**
3. Choose an expiry option (7 days, 30 days, or no expiration)
4. Click **Copy** at the end of the link. It turns green and says **Copied**, and a **Link copied** notice appears

### Folder Share

1. Right-click on a folder
2. Select **"Share"**
3. Choose an expiry option
4. All folder contents accessible via link

Anything you add to the folder later by upload, new folder, copy, or move is
included in the share automatically, including items in subfolders.

If something inside a shared folder is not part of its share (for example it was
unshared on its own), right-click it → **Link to folder share** to add it back to
the folder's link. No new link is made.

### Bulk Share

1. Select multiple files/folders
2. Click **"Share"** button in the toolbar
3. Choose an expiry option
4. A share link is created for each selected item

## Share Link Expiry

### Expiry Options

When sharing, you choose one of:

- **7 days** (default) - link expires after 7 days
- **30 days** - link expires after 30 days
- **No expiration** - link stays active until manually revoked

Re-sharing an already-shared file lets you change the expiry.

### Expired Links

- Expired links remain visible in the **Shared** section with a red clock icon and **"Link expired"** label
- Anyone visiting an expired link sees a "Link expired" page
- A background job automatically cleans up expired share links every 7 days

## Share Link Management

### Viewing Shares

- Go to **"Shared"** section
- Active links show the green share icon with the remaining time: days, hours, or minutes
- Links with no expiration show `∞` beside the share icon
- Expired links show a red clock icon and "Link expired" label

The **Share** dialog of a shared item says how long its link has left, for example "27 days, 19 hours remaining". Open **Get Info** on a shared file or folder to see when it was shared, how much time remains, and the exact expiration time. A link with no expiration shows **Never expires**.

### Copying Links

- Right-click a shared item → **Copy link** (with several selected, every shared item's link is copied, one per line)
- Or open **Share** on it and use **Copy** at the end of its link
- Share via email, messaging, etc.

A shared item shows a link icon beside its name, in the list and on grid tiles. Hover the icon to see when it was shared and how long the link lasts. Once a link expires the icon goes away.

### Revoking Shares

- Open **Share** on the item and click **Stop sharing**, at the bottom left, away from **Done**
- Immediate access revocation
- Link becomes invalid

Moving a shared item to trash also stops the link from serving it. Unlike unsharing, the link is kept, so restoring the item makes it reachable again.

## Share Link Features

### Public Access

- No authentication required
- Accessible to anyone with link
- Read-only access

### Custom Domain

- Optional custom share domain
- Isolated from main application
- Configure in Settings → Administration → Share link address (admin only)

## Accessing Shared Files

### Via Share Link

1. Click the share link (or paste it in the browser)
2. For a folder, browse the contents; open subfolders to move into them, and use the breadcrumb to go back
3. For a single file, use the download button on the page

### Download Options

- **Single File:** Landing page with a download button
- **File in a folder:** Click the file to download it
- **Folder:** Open subfolders to browse; use **Download all** to zip the current folder

## Security Considerations

- Share links are public (no authentication)
- Use expiration dates for sensitive files
- Revoke shares when no longer needed
- Be cautious with sensitive information

## Related Topics

- [Sharing Model](/docs/concepts/sharing-model) - How sharing works
- [API: Sharing](/docs/api/sharing) - API endpoints
- [Security Model](/docs/concepts/security-model) - Security best practices
