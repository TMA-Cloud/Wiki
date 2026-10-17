---
title: 'Upload Files'
description: 'Learn how to upload and manage files in TMA Cloud.'
---

Learn how to upload and manage files in TMA Cloud.

## Uploading Files

### Basic Upload

1. Open **My Files** (TMA Cloud opens there after sign-in) and go to the folder where you want to upload
2. Click **Upload** in the header (or **Upload files** on the dashboard)
3. In the Upload dialog, click **Choose files** or **Choose folder**, click the drop area, or drag files and folders onto it. The dialog's header names the folder they go to
4. Check the list: each entry shows where it lands and its size, and **×** removes it. Adding the same file again does not add it twice. A file larger than the upload size limit shows its size in red and is skipped
5. Click **Upload N files**. The files upload to the current folder

### Upload a Folder

- In the Upload dialog, click **Choose folder** and choose a folder on your computer (in the browser too)
- All subfolders and files under it are uploaded, and the folder structure is recreated under the current folder
- If the current folder already holds a folder with the same name, in any letter case, the files go into that folder instead of a second one. The same applies to every subfolder
- Empty subfolders are not created, because only files are uploaded
- One folder upload can hold up to 50,000 files

### Drag and Drop

- Drop files from your computer onto the window: the Upload dialog opens with them listed, so you can check them before anything is sent. They go into the open folder (the root outside **My Files**)
- While the Upload dialog is open, dropped files join its list
- In the desktop app, dropped folders keep their structure, as with **Folder**

### Paste from Explorer (Windows desktop app)

- Copy files or folders in Explorer (or any app that copies files), open the folder in **My Files**, and press **Ctrl+V** or right-click empty space in the list and choose **Paste**. They upload to the open folder
- A pasted folder keeps its structure, as with a folder upload
- Attachments copied from Outlook and files copied from a zip folder paste too, as do a copied image or screenshot (saved as `Pasted image <date> <time>.png`) and file paths copied as text
- **Paste** appears in that menu while the Windows clipboard holds any of these
- Paste uses whichever copy is newer: files copied in Explorer after a **Copy** or **Cut** in TMA Cloud are uploaded; otherwise the TMA Cloud items are pasted
- Same size and quota limits apply as for **Upload**

### Duplicate file names

When you upload into a folder that already has a file with the same name (compared without regard to case), the app asks before sending anything:

- **Replace** uploads the new content into the existing file. Its ID, share links and star stay the same.
- **Keep both** uploads the new file beside it with a number added, for example `document (1).pdf`.

Choose for each file, or use **Replace all** or **Keep all**. **Cancel** uploads nothing, including the files whose names were free. Files inside an uploaded folder are not asked about: they go into the folder of the same name, and a clashing file there gets a number.

The check covers the items loaded in the open folder. In a very large folder, a name further down the list that has not been loaded yet gets a number instead of a question.

### Upload Limits

- Per-file size limited by the max upload size setting (default 10 GB, configurable by admin in **Settings** → **Storage**). Larger files are not queued, and a message says how many were skipped
- Total upload size limited by your storage quota
- Upload rate limited to 20000 uploads per 30 minutes per user

### Upload Progress and Cancel

- A panel in the bottom-right corner lists uploads and downloads, one line per file with its icon and name. A running file adds a progress bar below its name, and a finished one shows a mark for how it went. The panel's heading names the work, for example **Uploading 2 of 5 files** or **Uploaded report.pdf**
- When everything finishes without an error, the panel closes after five seconds (it stays open while the pointer is over it). After a failure it stays until you close it
- Notifications appear above the panel
- Three uploads run at a time; the rest wait in the queue
- Each running or waiting transfer has a **Cancel** button
- A failed upload stays in the list with the reason below its name (hover to see all of a long reason), and the other files still upload
- When a batch finishes with failures, a dialog lists the files that were not uploaded, grouped by reason (up to 50 names per reason). **Copy details** copies every file and its reason. Uploads you cancelled are not listed
- Files that finished before a cancel stay in the folder
- The same panel shows work the server does for you, with a moving bar until it finishes: moving to the trash, restoring, deleting forever, emptying the trash, copying and moving

## File Management

### Viewing Files

- **List View:** One row per item: the name, and the size and modified date below it
- **Grid View:** Large icons, and a thumbnail for each image (images up to 25 MB; thumbnails load as their tiles come into view)
- **Sort Options:** Name, Date modified, Size, Last opened, each in either direction (for example **A to Z** or **Newest first**). Folders are always listed before files. Choose them from the sort button (the two arrows) at the right of the toolbar
- **Name order:** Letter case is ignored and numbers are read by value, so `custom` comes before `Thomas` and `Photo 2` before `Photo 10`. On a database server built without ICU, numbers sort digit by digit

### Breadcrumbs

The bar above the list shows where you are. It shows as many of the innermost folders as fit beside the toolbar buttons; the folders before them fold into **…**, and clicking it lists them to jump to. Going up a level, with a crumb, **Back** or **Alt+Up**, selects the folder you came from.

### Phones and Tablets

On a phone (or a tablet with a touch screen) the browser shows a compact header with the place's name, search, **Upload** and your account menu (theme and sign out), and a tab bar at the bottom: **Home**, **Files**, **Shared**, **Starred**, **Trash** and **Settings**.

- **Tap** a folder or file to open it, and **swipe** to scroll
- **Long-press** an item for its menu
- **Select** (the check box in the toolbar) turns on selection: taps then add or remove items, and the toolbar shows what you can do with them. Tap it again to finish
- In the image viewer, swipe left or right to move between images, and pinch to zoom
- Documents open in a new tab

### Keyboard Navigation

These keys work in the browser and the desktop app:

- **Arrow keys:** Up and Down move the selection by one row. With nothing selected, the first press selects the first item
- **Home / End:** Select the first or last item
- **Page Up / Page Down:** Move the selection by ten rows
- **Shift+Arrow, Shift+Home, Shift+End, Shift+Page Up/Down:** Select a range from the anchor (the item where the range started) to the new item. Turning back shrinks the range
- **Type a name:** Typing the first letters of a name selects the next matching item and scrolls it into view. Case is ignored
- **Same letter again:** Pressing one letter repeatedly (for example **r**, **r**, **r**) moves through every item that starts with it, then wraps to the top of the list. This works however fast you press it
- **Several letters:** Letters typed less than one second apart form one search (for example **rep** for `Report.pdf`), unless they are all the same letter. After a one-second pause, the next letter starts a new search. If nothing matches, the selection does not change
- **Enter:** Opens the selected item, the same as a double-click. Works when exactly one item is selected
- **Backspace:** Goes back to the previous folder in the navigation history
- **Alt+Up:** Goes to the parent folder
- **Ctrl+A / Cmd+A:** Select all items in the current view
- **Escape:** Clear the selection
- **Delete:** Move the selection to the trash after you confirm (in the trash: delete forever)
- **F2:** Rename the selected item
- **Ctrl+Shift+I:** Show details of the selected item
- **Ctrl+C / Ctrl+X / Ctrl+V:** Copy, cut and paste between folders
- **Ctrl+K:** Focus the search field
- **Mouse back and forward buttons:** Move through folder history

The search follows the current sort order and covers only the items loaded so far. In a large folder, scroll down to load more items first.

Mouse selection uses the same anchor. A click selects one item, **Ctrl+click** adds or removes an item, and **Shift+click** selects the items from the anchor to the clicked item.

**Select with a rectangle:** drag on empty space in the list or grid to draw a selection rectangle; every item it touches is selected. In the list, the blank part of a row to the right of its name counts as empty space, so a rectangle can start there even in a full folder; dragging the name moves the item. Hold **Ctrl** (**Cmd** on a Mac) to flip the items the rectangle touches, or **Shift** to add them to the current selection. Moving past the top or bottom edge scrolls the list, faster the further the pointer goes, and the rectangle keeps selecting while it scrolls; the mouse wheel scrolls it too. Clicking empty space clears the selection.

None of these keys act while you type in a text field such as search, or while a dialog or viewer is open.

### File Operations

- **Download:** Right-click → **Download**. One file downloads as is; a folder or several items download as one ZIP archive
- **Copy:** Right-click → **Copy** (or **Ctrl+C**). A copy can be pasted more than once. In the Windows desktop app the files also go on the Windows clipboard, to paste into Explorer or any app; see [Desktop App](/docs/getting-started/desktop-app#copy-and-paste-with-other-apps-windows)
- **Cut:** Right-click → **Cut** (or **Ctrl+X**). A cut is used up by its paste
- **Paste:** Right-click empty space in the list → **Paste** (or **Ctrl+V**) to paste into the open folder. Works in **My Files** only. In the Windows desktop app, files copied in Explorer paste too; see [Paste from Explorer](#paste-from-explorer-windows-desktop-app)
- **Name conflicts on paste:** A pasted file or folder with the same name as one already in the folder is kept beside it with a name such as `report (1).pdf`. Names are compared without regard to case
- **Missing items:** If a copied or cut item, or the destination folder, was deleted or moved to the trash after the Copy or Cut, Paste fails with a message and nothing is pasted
- **Move:** Drag items onto a folder and confirm, or use Cut and Paste
- **Rename:** Right-click → **Rename** (or **F2**)
- **Delete:** Right-click → **Delete** (or the **Delete** key), then confirm. The item stays in the trash for 15 days
- **Empty space:** Right-click empty space in the list for **Paste**, **New folder**, **Upload** and **Refresh**
- **Star:** Mark files as favorites
- **Get info:** Right-click → **Get info** shows size, dates and type
- **Trash:** Items in the trash cannot be copied or cut

### Download Progress and Cancel

- **Desktop app:** You choose where to save, and the transfer panel shows the progress. A ZIP shows the bytes received, because the archive is streamed and its final size is not known in advance
- **Browser:** Downloads are handed to the browser's own download manager, which shows the progress and saves straight to disk, so even a very large ZIP never has to fit in the page's memory. Cancel it from the browser's downloads list

## File Types

### Supported Files

- All file types supported
- MIME type detected from file content (magic bytes)
- Preview for images; documents open in OnlyOffice when it is configured

### Document Editing and Viewers

- **OnlyOffice Integration:** In the browser, opening a document (`.docx`, `.xlsx`, `.pptx`, and similar) edits it in OnlyOffice inside TMA Cloud when OnlyOffice is configured. **Open in tab** moves it to its own tab; **Close** returns to your files
- **Desktop app:** Opening any file (double-click, **Enter** or **Open**) opens it in the computer's app for its type (Word, Excel, Photos, and so on), never in the browser. Every save uploads back. Programs, scripts and shortcuts are not opened. See [Desktop App](/docs/getting-started/desktop-app#open-files-in-desktop-apps)
- **Export / Save As (desktop app):** When a file opened in its desktop app is saved as a new file in the same folder (for example a `.pdf`, `.docx`, `.xlsx`, `.pptx`, `.csv`, or `.rtf`), the new file is uploaded as a separate file in the same cloud folder. A file saved anywhere else (for example Desktop or Documents) is not uploaded.
- **Preview (desktop app):** Right-click an image → **Preview** to see it in the built-in viewer instead of its desktop app
- **Image Viewing:** In the browser, opening an image shows it in the built-in viewer; the Left and Right arrow keys move to the previous and next image. Scroll (or pinch) to zoom at the pointer, drag to move around a zoomed image, double-click to zoom in or back out, and press **+**, **-** or **0** to zoom in, out or back to fit
- **Other files:** In the browser, opening a file that has no viewer (a `.zip`, for example) shows the notice "No preview for .zip files. Use Download." instead of downloading it. Opening it again while the notice is up does not repeat it

## Best Practices

- Organize files in folders
- Use descriptive file names
- Star important files for quick access
- Regularly clean up trash

## Related Topics

- [Manage Folders](/docs/guides/user/manage-folders) - Organize your files
- [Starred Files](/docs/guides/user/starred-files) - Quick access to favorites
- [Trash & Restore](/docs/guides/user/trash-restore) - Recover deleted files
