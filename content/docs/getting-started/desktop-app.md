---
title: 'Desktop App'
description: 'The TMA Cloud desktop app for Windows, macOS and Linux, with Cloud Drive and editing in local apps.'
---

The TMA Cloud desktop app for Windows, macOS and Linux. It has the same interface as the
web app, plus Cloud Drive, editing files in the computer's own apps, and copying files to
other apps.

## Install

Download the installer for your system from the
[GitHub releases](https://github.com/TMA-Cloud/TMA/releases) page:

| System  | File                                | How to install                                                                                 |
| ------- | ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| Windows | `tma-cloud_<version>_x64-setup.exe` | Run it; no administrator needed                                                                |
| macOS   | `.dmg`                              | Open it and drag TMA Cloud to Applications                                                     |
| Linux   | `.deb` or `.AppImage`               | `sudo apt install ./tma-cloud_<version>_amd64.deb`, or make the AppImage executable and run it |

**Windows.** The installer puts the app in your user folder
(`%LOCALAPPDATA%\TMA Cloud`), adds Start menu and desktop shortcuts, and registers an
uninstaller in **Settings → Apps**. Nothing else is installed: Cloud Drive uses the Cloud
Files support built into Windows 10 (version 1709) and later. For unattended installs,
run the installer with `/S`.

**Linux.** The `.deb` pulls in FUSE 3 (for Cloud Drive) and the D-Bus library (for the
saved sign-in).

**macOS.** Nothing else to install: Cloud Drive uses the NFS client built into macOS.

### Build from source

```bash
cargo build --release -p tma-cloud
```

The app is in `target/release/`. On Linux, building it needs the D-Bus and FUSE
development packages (`libdbus-1-dev`, `libfuse3-dev`).

To build the installers for the current system:

```bash
cargo install cargo-packager --locked
cargo xtask package
```

They are written to `target/packages/`. Set `TMA_UPDATE_REPO=owner/repo` while building to
take updates from another repository's releases, for example to test an update.

## Sign in

On first start, enter the server address (for example `https://cloud.example.com`),
your email and password (the eye in the password field shows what you typed). The app keeps the session in the system's credential store —
Windows Credential Manager, the macOS Keychain, or the Secret Service on Linux — so it
stays signed in after a restart and after an update. Signing out removes it.

The server renews the session while the app is used, and the app saves the renewed one,
so it does not ask for the password again after the first one expires.

If the server cannot be reached when the app starts (it is restarting, or the network is
not up yet), the app keeps the sign-in and shows **Can't reach** with the server address.
It tries again after 2, 4, 8 and 16 seconds, then every 30 seconds. **Try now** retries at
once; **Sign in again** opens the sign-in form. The password is asked for only when the
server refuses the session.

A request that receives nothing from the server for two minutes, for example after the
network drops or the computer wakes from sleep, fails with an error instead of waiting
forever. Cloud Drive requests stop waiting the same way.

A session ended elsewhere (a password change, **Sign out everywhere**, or a session
revoked in **Settings → Security**) returns the app to the sign-in form within a minute,
even while it sits idle.

Google sign-in is available in the browser only.

Only one copy of the app runs at a time: opening it again brings the running window
to the front.

The window opens where you left it: at the same size and position, or maximized if it
was maximized. **Restore** after a maximized start returns it to the size it had before.
On Windows the window appears only once it has drawn at that size, so it opens without
a flash.

## Version and updates

- **Settings → Updates** shows the server version and this app's version.
- **Updates install themselves on Windows.** After sign-in the app checks the published
  release list (`/api/version/latest`). When a newer release exists, its installer
  downloads in the background (shown in the transfers panel), then installs silently
  once no upload or download is running, and the app starts again. On macOS and Linux
  a notice points to the releases page.
- **Where updates come from.** The version is the `desktop` entry of the server's
  update feed (see [`VERSIONS_URL`](/docs/reference/environment-variables#update-feed)).
  The installer is the release asset `tma-cloud_<version>_x64-setup.exe` on GitHub,
  from [TMA-Cloud/TMA](https://github.com/TMA-Cloud/TMA/releases) unless the app was built
  with another `TMA_UPDATE_REPO`. Publish the release before raising the feed's version.
- **Check now** in **Settings** → **Updates** compares the installed and latest versions by hand.

## Active desktop clients (admin view)

- Signed-in desktop apps send a heartbeat every minute.
- The admin can view active clients in **Settings → Administration → Active desktop clients**.
- Each row includes user, platform, app version, IP, and last seen time.
- This admin list excludes browser-session presence rows.
- Revoking sessions removes related heartbeat rows; stale rows are also purged automatically.

## Open files in desktop apps

In the desktop app, every file opens in the computer's own app for its type — Word,
Excel, Photos, a PDF reader — never in the browser, and every save uploads back.

- **Double-click** a file, press **Enter**, or right-click → **Open**.
- The file opens from the [Cloud Drive](#cloud-drive) folder, where it already is, with
  the system's default app. No other copy is made. When no app is set for the type,
  Windows asks which one to use.
- Opening needs Cloud Drive. While it is not connected, the app says so and points to
  **Settings → Desktop app**.
- **Blocked:** programs, scripts, installers and shortcuts (for example `.exe`, `.msi`,
  `.bat`, `.cmd`, `.ps1`, `.vbs`, `.js`, `.lnk`, `.reg`) are refused with "Programs and
  scripts can't be opened from the cloud. Download the file to run it."

### How saves sync

- Saving in the app saves into the Cloud Drive folder, and the drive uploads the change
  (on Windows about two seconds after the app stops writing).
- The same file entry is updated (the ID stays the same), also when the app saves to a
  temporary name and renames it over the original, as Word and Excel do.
- **Save As** or **Export** into the same folder (for example, Word → Export to PDF)
  uploads the new file beside the original. Files saved anywhere else (Desktop,
  Documents) stay on your computer only.
- Office's lock files (`~$…`) and temporary files stay on your computer.

If you open a document and close it without saving, nothing is uploaded.

## Cloud Drive

The desktop app shows TMA Cloud as a folder, so you can open and save files from the file
dialogs of any application — WhatsApp, Telegram, Outlook, Office, browsers, and so on. No
extra driver is needed on any system.

| System  | Where it appears                       | How it works                                       |
| ------- | -------------------------------------- | -------------------------------------------------- |
| Windows | The `TMA Cloud` folder in your profile | Cloud Files, the system OneDrive also uses         |
| Linux   | The `TMA Cloud` folder in your home    | FUSE (`/dev/fuse`, the `fuse3` package)            |
| macOS   | The `TMA Cloud` folder in your home    | A local network share only this computer can reach |

- **Connects automatically.** The folder connects after you sign in and stops syncing
  when you sign out or close the app. It uses the app's own session — no separate login.
  The header shows **TMA Cloud** while it is connected; click it to open the folder.
- **Status.** **Settings → Desktop app → Cloud Drive** shows whether the drive is
  connected, and what is missing when it cannot start.
- **Save As anywhere.** In any app's Save dialog, choose the TMA Cloud folder as the
  destination. The file uploads through the same pipeline as a normal upload, so
  permissions, encryption, and audit all apply. Saving a name that exists replaces that
  file.
- **Office saves keep the file.** Word, Excel and LibreOffice save through a temporary
  copy, and Word and Excel also rename the document to a backup name while they save.
  The cloud file keeps its name and ID and gets the new version. Lock, temporary and
  backup files (`~$…`, `*.tmp`, and Excel's eight-character names such as `B9EC1600`)
  stay on your computer and are never uploaded.
- **Live updates.** Changes made from the web app or another device appear in the folder
  within a few seconds.
- **Every name shows up.** On Windows, a name Windows cannot hold, such as
  `Q3: plan?.docx`, is listed with a private-use character in place of each reserved
  one. Most fonts draw these as boxes. Renaming or saving the file keeps its real name on
  the server. See [File Names](/docs/concepts/file-system#file-names).
- **Large folders.** A folder shows every item it contains. The app reads the server's
  listing 500 items at a time until it reaches the end.
- **Deleting** a file or folder in the drive moves it to the trash, as in the app.
- **Timestamps.** The access time shows the server's last-read time; created, modified
  and change times show the modification time.

### On Windows

The folder works like OneDrive's:

- **Files download when opened.** Until then each file is a placeholder that takes no
  space, shown with a cloud in Explorer's **Status** column. A folder's contents are
  listed the first time you open it.
- **Changes upload in the background** about two seconds after an app stops writing.
- **Free up space.** Right-click a file → **Free up space** to drop the downloaded copy;
  it downloads again the next time it is opened.
- **Moving a file out** of the folder removes it from TMA Cloud (to the trash), as with
  any synced folder.
- **While the app is closed** the folder stays. Folders you have opened still list, files
  already downloaded still open, and changes made to them upload when the app starts
  again. A folder you have never opened, or a file not downloaded yet, shows "The cloud
  file provider is not running" until the app runs.
- **Another account.** If a different account signs in, the previous account's synced
  files are removed from the folder. Anything not uploaded yet is kept in a
  `TMA Cloud (previous account …)` folder beside it.
- **Uninstalling** removes the folder's downloaded copies and its registration with
  Windows; nothing is deleted on the server. Anything not uploaded yet stays in the
  `TMA Cloud` folder. Updating the app keeps the folder as it is.

Cloud Drive needs Windows 10 version 1709 or later, where Cloud Files is built in. On
older versions **Settings → Desktop app** says so and the rest of the app works as usual.

### On Linux and macOS

- **Only your account can read it.** The folder is owned by your user. On macOS the share
  listens only on this computer (`127.0.0.1`), never on the network.
- **Open files.** A file open from the drive is kept in `TMA Cloud/drive` in the user's
  cache folder while it is open. It is deleted once the file is closed (on macOS, a few
  seconds after the last write), and anything left by a crash is removed on the next
  mount. On Windows, files download straight into the folder and nothing else is kept.

### Save-only mode

The first user sets this for every desktop app in **Settings → Administration → Policies
→ Cloud Drive save-only**. **Settings → Desktop app → Access mode** shows the mode the
drive on this computer uses.

- **On:** folders and files stay browsable and **Save As** still works, but opening or
  copying file content from the drive is refused ("Access denied"). Files you open in
  TMA Cloud stay readable for 12 hours, and files you **Copy** in TMA Cloud for a day, so
  they can be edited or pasted.
- **Off:** files can be opened and copied from the drive normally.

The app reads the mode when the drive mounts and every minute after that, and applies a
change without remounting. Until the server answers, the drive stays save-only.

## Copy and paste with other apps (Windows)

**Copy** (or **Ctrl+C**) in the desktop app also puts the files and folders on the
Windows clipboard, so **Paste** in Explorer, on the desktop, in Outlook or in a chat app
pastes the real files. Folders keep their structure. The clipboard holds the items'
paths in the [Cloud Drive](#cloud-drive) folder, so nothing is copied beforehand: Windows
downloads the files while it pastes them. Without Cloud Drive, the copy pastes in TMA
Cloud only.

Pasting back inside TMA Cloud still copies on the server, without uploading anything.
**Cut** (or **Ctrl+X**) moves items between folders on the server, and empties the
Windows clipboard so an older copy from another app is not pasted by mistake.

The other way works too. These paste into the open folder with **Ctrl+V** or the
**Paste** button, and upload:

- Files and folders copied in Explorer or any other app
- Files that exist only inside another app, such as Outlook attachments and messages or
  files copied from a zip folder in Explorer (up to 500 MB at once)
- A copied image or screenshot, as `Pasted image <date> <time>.png`
- File paths copied as text, for example with Explorer's **Copy as path**

Paste takes whichever copy is newer.
See [Paste from Explorer](/docs/guides/user/upload-files#paste-from-explorer-windows-desktop-app).

## Pointers

The app uses its own pointers, drawn in the app's colours, in a light and a dark set
that follow the theme: an arrow over files, a hand on buttons, a text beam in fields,
and grab, zoom and busy pointers where they apply. The same pointers appear in the
browser and in the desktop app on Windows, macOS and Linux. On a Linux desktop that
runs Wayland the app keeps the system's pointers, because Wayland only lets apps pick
from the system's own set; under X11 it shows its own. Resize arrows at the window's
edges stay the system's.

## Drag and drop

Drop files or folders from the computer onto the window to upload them into the open
folder (the root outside **My Files**). Folders keep their structure.

## Keyboard Shortcuts

- **Arrow keys, Home, End, Page Up/Down:** Move the selection (with **Shift**: select a range).
- **Type a name:** Select the next item whose name starts with the letters typed. Pressing the same letter again moves to the next item that starts with it.
- **Ctrl+A / Cmd+A:** Select all items in the current view.
- **Ctrl+C / Ctrl+X / Ctrl+V:** Copy, cut and paste within TMA Cloud.
- **Delete:** Move the selection to the trash (in the trash: delete forever).
- **F2:** Rename the selected item.
- **Enter:** Open the selected file or folder.
- **Backspace:** Go back to the previous folder; **Alt+Up** goes to the parent folder.
- **Escape:** Clear the selection.
- **Ctrl+K:** Focus the search field.

The same shortcuts work in the browser. See [Keyboard Navigation](/docs/guides/user/upload-files#keyboard-navigation) for details.

## Desktop-only mode (optional)

- When the administrator enables **Desktop app only** in **Settings → Administration**,
  the server rejects browser access to the main app.
- The desktop app continues to work because it sends the required HTTP header on its
  requests.
- Share links (`/s/*`), `/health`, and `/metrics` still respond as normal.
- The OnlyOffice file and callback endpoints also stay open, because the Document Server
  calls them without the desktop header. Documents the desktop app opens in the browser
  use a one-minute link, which is allowed too.
- Browsers that open the main URL see a simple page stating that the instance is
  configured for desktop app access only.

## Related Topics

- [Architecture — Desktop App](/docs/concepts/architecture#desktop-app) - How the desktop app fits in the system
- [Manage Folders](/docs/guides/user/manage-folders) - Folders and navigation
- [Upload Files](/docs/guides/user/upload-files) - Uploading and downloading
