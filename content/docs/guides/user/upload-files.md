---
title: 'Upload Files'
description: 'Learn how to upload and manage files in TMA Cloud.'
---

Learn how to upload and manage files in TMA Cloud.

## Uploading Files

### Basic Upload

1. Navigate to the folder where you want to upload
2. Click the **"Upload"** button
3. Select **Upload files**
4. Choose one or more files from your computer
5. Files upload to the current folder

### Upload a Folder

- Click the **"Upload"** button → **Upload folder**
- Select a folder from your computer
- All subfolders and files under that folder are uploaded
- The folder structure is recreated under the current folder
- In the Upload modal, folder uploads show as **Folders to Upload** with one row per root folder (folder icon, name, item count, total size)

### Drag and Drop

- **In the file manager (My Files):** Drag files or folders from your computer onto the file list and the Upload modal opens with the dropped items then click **Upload** (Folder structure is preserved when supported)
- **In the Upload modal:** Use the drop zone to add more files or folders. If the list already has items, a compact "Add more" strip is shown
- **Queue display:** File uploads show **Files to Upload** with one row per file and Folder uploads show **Folders to Upload** with one row per root folder (folder icon, name, item count, total size)

### Paste from Clipboard (Ctrl+V)

- Copy files on your computer (for example, in Explorer with **Ctrl+C**)
- Open **My Files** and go to the folder where you want to upload
- Press **Ctrl+V** in the file list; if you haven't recently copied something inside TMA Cloud, the OS-clipboard files upload to the current folder
- Single file uses standard upload; multiple files use bulk upload with progress
- Same size and quota limits apply as for Upload
- In the Windows desktop app, **Paste** is unified with the in-app clipboard and uses whichever was written last: files copied in Explorer after an in-app Copy or Cut are uploaded, otherwise the in-app clipboard is pasted
- Physical clipboard files stream from their existing path. Pathless Outlook/Snipping Tool/OLE items upload from Electron's main-process memory, capped at 500 MB per paste because that content is held in memory. Neither route creates a plaintext upload copy in the host temp directory
- Pasted files get the same progress cards as any other upload, one per file, each with its own **Cancel**. Canceling stops the transfer rather than only hiding the card
- A file the server refuses is listed in the upload-issues dialog and the remaining files still upload

### Copy to Computer (Windows desktop app)

- The desktop-app **Copy** (right-click → **Copy** or **Ctrl+C**) writes the selection to the Windows clipboard in the background, in addition to the in-app clipboard. You can then paste in Explorer to save them
- Limit for the Windows-clipboard side: 200 MB total per action and no single file over 200 MB. Larger selections and folders still work for in-app pastes — they just aren't written to the Windows clipboard
- Not available in Trash view

### Duplicate file names

When you upload a file and one with the same name already exists in the folder, the app asks before uploading:

- **Replace the File** – overwrites the existing file (same ID and name).
- **Upload with Renamed** – uploads as a new file with a unique name (e.g. `document (1).pdf`).

You choose an action for each conflicting file; nothing is uploaded until you confirm.

### Upload Limits

- Per-file size limited by the max upload size setting (default 10 GB, configurable by admin in **Settings** → **Storage**)
- Total upload size limited by your storage quota
- Upload rate limited to 20000 uploads per 30 minutes per user
- Both limits enforced before upload starts

### Upload Progress and Cancel

- A floating progress panel shows active uploads (single file or bulk)
- **Single file / flat multi-file uploads:** Each file has its own **Cancel upload** button
- **Folder uploads (bulk):** All files in the folder are sent as one batch. A **Cancel all** button appears in the Upload modal
- **Remove:** Before upload starts, use **Remove** in the queue to drop a file or folder from the list
- **After cancel:** Files and folders already created before cancel appear in the file list

## File Management

### Viewing Files

- **Grid View:** Thumbnail view of files
- **List View:** Detailed list with metadata
- **Sort Options:** Name, Modified, Last opened, Size — each ascending or descending. Folders are always listed before files

### Keyboard Navigation

These keys work in the browser and the desktop app, and follow Windows Explorer:

- **Tab:** Moves keyboard focus into the file list. The outline returns to the item you were last on, which is the last item you clicked or moved to. If nothing is selected, the first item is selected and outlined, so the first **Down** goes to the second item. The list is one Tab stop: the next **Tab** leaves it and **Shift+Tab** returns to the toolbar. Leaving the list hides the outline, and tabbing back in shows it on the same item
- **Arrow keys:** Up and Down move the selection by one row. In grid view, Left and Right move by one item, and Down from a short last row goes to the last item. With nothing selected, the first press selects the first item
- **Home / End:** Select the first or last item
- **Page Up / Page Down:** Move the selection by about one screen of rows
- **Shift+Arrow, Shift+Home, Shift+End:** Select a range from the anchor (the item where the range started) to the new item. Turning back shrinks the range
- **Ctrl+Arrow:** Moves an outline to another item without changing the selection
- **Ctrl+Space:** Adds the outlined item to the selection, or removes it. Use it with **Ctrl+Arrow** to pick items that are not next to each other
- **Type a name:** Typing the first letters of a name selects the next matching item and scrolls it into view. Case and accents are ignored, so **e** also finds `Été.txt`
- **Same letter again:** Pressing one letter repeatedly (for example **r**, **r**, **r**) moves through every item that starts with it, then wraps to the top of the list
- **Several letters:** Letters typed less than one second apart form one search (for example **rep** for `Report.pdf`). After a one-second pause, the next letter starts a new search. If nothing matches, the selection does not change
- **Enter:** Opens the selected item, the same as a double-click. Works when exactly one item is selected. Items in the trash are not opened
- **Backspace:** Goes back to the previous folder in the navigation history
- **Alt+Up:** Goes to the parent folder and selects the folder you came from

The search follows the current sort order and covers only the items loaded so far. In a large folder, scroll down to load more items first.

The list is marked up as a listbox, so screen readers announce the outlined item and whether it is selected.

A mouse click or marquee selection removes the outline, and the next arrow key starts from the clicked item.

Mouse selection uses the same anchor, as in Explorer. A click or **Ctrl+click** sets the anchor. **Shift+click** replaces the selection with the items from the anchor to the clicked item, and **Ctrl+Shift+click** adds those items to the selection.

As in Windows Explorer, the arrow keys, Home, End, Page Up, Page Down, Enter and typed letters act on the file list only while it has focus, or while nothing has focus (for example right after the page loads). Clicking a file gives the list focus. After **Tab** moves focus to a button or the sidebar, these keys no longer change the selection until you click a file or tab back into the list. **Backspace** and **Alt+Up** work anywhere in the window.

None of these keys act while you type in a text field such as search, or while a dialog, menu or viewer is open. Holding down **Enter**, **Backspace** or **Alt+Up** acts once, not once per key repeat.

### File Operations

- **Download:** Click to download single file
- **Bulk Download:** Select multiple files → Download (creates ZIP archive)
- **Copy:** Right-click → Copy (or **Ctrl+C**). One action: copies between folders inside TMA Cloud and (in the desktop app) also writes to the Windows clipboard so you can paste in Explorer. The 200 MB limit only affects the Windows-clipboard side. A copy can be pasted more than once
- **Cut:** Right-click → Cut (or **Ctrl+X**). In-app only — cut items appear faded until you paste. A cut is used up by its paste
- **Rename:** Right-click → Rename
- **Move:** Drag and drop or use Cut + Paste
- **Paste:** Right-click → Paste (or **Ctrl+V**). Works in **My Files** only. In the desktop app, Paste uses whichever clipboard was written last: files copied in another app after your in-app Copy or Cut are uploaded, otherwise the in-app clipboard is pasted
- **Name conflicts on paste:** A pasted file or folder with the same name as one already in the folder is kept beside it with a name such as `report (1).pdf`. Names are compared without regard to case
- **Missing items:** If a copied or cut item, or the destination folder, was deleted or moved to the trash after the Copy or Cut, Paste fails with a message and nothing is pasted
- **Trash:** Items in the trash cannot be copied or cut
- **Delete:** Right-click → Delete (moves to trash)
- **Star:** Mark files as favorites
- **Select all (desktop app):** Press **Ctrl+A** / **Cmd+A** in the file list to select all items in the current folder

### Download Progress and Cancel

- A floating progress panel shows active downloads, in the same style as the upload panel
- **Single file:** the panel shows the file name, size, and a percentage bar that tracks the download
- **Folder or multiple files:** downloaded as a ZIP; the panel shows an in-progress bar without a percentage, because the archive is streamed and its final size is not known in advance
- **Desktop app:** the same panel appears while the file is saved through the desktop app
- **Supported browsers:** the save location is chosen before the request and response bytes stream directly to that file. Browsers without the File System Access API use the normal in-memory browser download fallback
- Each active download has a **Cancel** button; finished downloads clear on their own

## File Types

### Supported Files

- All file types supported
- MIME type detected from file content (magic bytes)
- Preview for images and documents

### Document Editing and Viewers

- **OnlyOffice Integration (browser):** Edit `.docx`, `.xlsx`, `.pptx` files in the browser when OnlyOffice is configured
- **Desktop Editing (desktop app):** In the Electron app, open any file in the Windows app registered for its type (Word, Excel, PowerPoint, an image viewer, and so on), and changes sync back automatically when you save. Windows shows **Open with** when no app is registered. Programs, scripts and shortcuts are not opened
- **Export / Save As (desktop app):** When a document is opened via **Open on desktop** in the Windows app and you use Save As / Export to create a new file in the temporary folder opened by the desktop app (for example a `.pdf`, `.docx`, `.xlsx`, `.pptx`, `.csv`, or `.rtf`), the new file is uploaded automatically as a separate file in the same cloud folder. If you save the new file to another location (for example Desktop or Documents), it is not uploaded automatically.
- **Image Viewing (browser):** View images with zoom in the built-in viewer
- **Double-click (desktop app):** In the Electron app, double-clicking any file opens it in the default desktop application

## Best Practices

- Organize files in folders
- Use descriptive file names
- Star important files for quick access
- Regularly clean up trash

## Related Topics

- [Manage Folders](/docs/guides/user/manage-folders) - Organize your files
- [Starred Files](/docs/guides/user/starred-files) - Quick access to favorites
- [Trash & Restore](/docs/guides/user/trash-restore) - Recover deleted files
