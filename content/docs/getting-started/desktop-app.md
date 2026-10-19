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
uninstaller in **Settings** → **Apps**. Nothing else is installed: Cloud Drive uses the Cloud
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
revoked in **Settings** → **Security**) returns the app to the sign-in form within a minute,
even while it sits idle.

Only one copy of the app runs at a time: opening it again brings the running window
to the front.

The window opens where you left it: at the same size and position, or maximized if it
was maximized. **Restore** after a maximized start returns it to the size it had before.
On Windows the window appears only once it has drawn at that size, so it opens without
a flash.

## Version and updates

- **Settings** → **Updates** shows the server version and this app's version.
- **When an update is available**, the sidebar says so, and **Settings** → **Updates** adds an
  **Update to v…** section:
  - **Release notes** opens that version's entry in the [changelog](/docs/changelog/overview).
  - **Update guide** opens [Updating](/docs/guides/operations/updating). Only the
    administrator (the first user) sees it, because only they can update the server.
    Everyone else is told that their admin takes care of server updates.

  The web app shows the same section. Both links open in the browser; nothing pops up.

- **When it checks.** After sign-in, and then every 6 hours while the app stays signed
  in, the app reads the published release list (`/api/version/latest`). **Check now** in
  **Settings** → **Updates** checks at once.
- **Updates install themselves.** When a newer release exists, it downloads in the
  background (shown in the transfers panel). Once no upload or download is running, the
  app closes and the new version opens a few seconds later. A download that fails is
  tried again at the next check.

  | Install                                       | How the update is applied                                                                                     |
  | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
  | Windows installer                             | The new installer runs silently over the installed app                                                        |
  | Linux AppImage (x86_64)                       | The new AppImage replaces the file the app was started from                                                   |
  | macOS app (Apple Silicon)                     | The new app from the disk image replaces `TMA Cloud.app` in its folder                                        |
  | Linux `.deb`, or a folder you cannot write to | By hand: a notice says once that a new version exists, and **Settings** → **Updates** shows **Open releases** |

  A `.deb` install is left to you because replacing it needs administrator rights.
  Intel Macs and ARM Linux also update by hand, because releases are built for Apple
  Silicon and x86_64 Linux only.

- **Where updates come from.** The version is the `desktop` entry of the server's
  update feed (see [`VERSIONS_URL`](/docs/reference/environment-variables#update-feed)).
  The files are the release assets `tma-cloud_<version>_x64-setup.exe`,
  `tma-cloud_<version>_x86_64.AppImage` and `tma-cloud_<version>_aarch64.dmg` on GitHub,
  from [TMA-Cloud/TMA](https://github.com/TMA-Cloud/TMA/releases) unless the app was built
  with another `TMA_UPDATE_REPO`. `cargo xtask package` gives them these names. Publish
  the release before raising the feed's version. Until the feed has a `desktop` entry,
  the app reports no update.

## Active desktop clients (admin view)

- Signed-in desktop apps send a heartbeat every minute.
- The admin can view active clients in **Settings** → **Administration** → **Active desktop clients**.
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
  **Settings** → **Desktop app**.
- **Blocked:** programs, scripts, installers and shortcuts (for example `.exe`, `.msi`,
  `.bat`, `.cmd`, `.ps1`, `.vbs`, `.js`, `.lnk`, `.reg`) are refused with "Programs and
  scripts can't be opened from the cloud. Download the file to run it."

### How saves sync

- Saving in the app saves into the Cloud Drive folder, and the drive uploads the change
  (on Windows about two seconds after the app stops writing).
- The same file entry is updated (the ID stays the same), also when the app saves to a
  temporary name and renames it over the original, as Word and Excel do.
- **Save As** or **Export** into the same folder (for example, Word's Export to PDF)
  uploads the new file beside the original. Files saved anywhere else (Desktop,
  Documents) stay on your computer only.
- Office's lock files (`~$…`) and temporary files stay on your computer.

If you open a document and close it without saving, nothing is uploaded.

### Who is editing

While you have a document open in Word, Excel, PowerPoint or LibreOffice from the Cloud
Drive folder, TMA Cloud marks it as yours for editing:

- Everyone else in the account sees **Your name is editing** on the file, and you see
  **You are editing**.
- On their computers the file is read-only, so Office opens it read-only instead of
  letting two people change it at once. If they open it from the desktop app, it tells
  them who is editing.
- In the browser, the document opens for viewing only.
- It works the other way round too: while someone edits a document in OnlyOffice in the
  browser, it is read-only in everyone's Cloud Drive and in other browsers, and the row
  says who is editing.
- When you close the document, the file is free again within a few seconds.

This also holds for you on another computer. If you left a document open on your
work PC, your laptop shows **You are editing on another computer** and opens it
read-only, so you cannot overwrite your own unsaved work by accident.

**Other files on Windows:** when you open any other file from the desktop app (a text
file, an image, a PDF), it stays marked as yours while a window shows it. Programs name
the open file in their title bar ("Notes.txt - Notepad"), and TMA Cloud watches for
that:

- The file is free again about 15 seconds after its window closes.
- If no window names the file within 30 seconds, it is not marked.
- A program with tabs, such as Notepad, names only the tab in front. Switching to
  another tab for more than 15 seconds frees the file.

Files you open straight from the Cloud Drive folder in File Explorer are marked only for
Office and LibreOffice documents. On Linux and macOS, only Office and LibreOffice
documents are marked.

If your computer crashes or goes offline, the file frees itself within a few minutes.
When a file is not marked, the next section covers what happens if two people save it.

### When someone else saved first

Two people can have the same file open. If someone else saves it after you opened it,
your next save does not overwrite theirs. Instead:

- Their version stays as the file.
- Your save is uploaded beside it as **name (conflicted copy date time)**, for example
  `Report (conflicted copy 2026-10-15 1946).xlsx`, so neither save is lost.
- On Windows the file in the Cloud Drive folder goes back to their version.

Open both and copy your changes across, then delete the conflicted copy. Saving several
times while the file stays open never conflicts with your own earlier saves.

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
- **Status.** **Settings** → **Desktop app** → **Cloud Drive** shows whether the drive is
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
  within a few seconds. The server says something changed; the app then asks which folders
  changed and lists again only those it has open, so a busy account does not make every
  computer list every folder after each change. It also asks once a minute, in case a
  notice was lost, and lists all its open folders again every 30 minutes.
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
older versions **Settings** → **Desktop app** says so and the rest of the app works as usual.

### On Linux and macOS

- **Only your account can read it.** The folder is owned by your user. On macOS the share
  listens only on this computer (`127.0.0.1`), never on the network.
- **Open files.** A file open from the drive is kept in `TMA Cloud/drive` in the user's
  cache folder while it is open. It is deleted once the file is closed (on macOS, a few
  seconds after the last write), and anything left by a crash is removed on the next
  mount. On Windows, files download straight into the folder and nothing else is kept.

### Save-only mode

The first user sets this for every desktop app in **Settings** → **Administration** → **Policies**
→ **Cloud Drive save-only**. **Settings** → **Desktop app** → **Access mode** shows the mode the
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

The other way works too. These paste into the open folder with **Ctrl+V** or **Paste**
in the right-click menu on empty space, and upload:

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

Drop files or folders from the computer onto the window: the Upload dialog opens with
them listed, to check before they upload into the open folder (the root outside
**My Files**). Folders keep their structure.

## Keyboard Shortcuts

The desktop app uses the same shortcuts as the browser. See [Keyboard Navigation](/docs/guides/user/upload-files#keyboard-navigation).

## Desktop-only mode (optional)

- When the administrator enables **Desktop app only** in **Settings** → **Administration** → **Policies**,
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
