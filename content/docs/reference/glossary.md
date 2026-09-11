---
title: 'Glossary'
description: 'Short definitions for terms that appear throughout the TMA Cloud docs.'
---

Short definitions for terms that appear throughout the TMA Cloud docs.

### Account owner

A top-level login — one with no `parent_user_id`. Owns the files, folders and storage quota that its sub-users share, and is the only login that can manage those sub-users. See [Sub-users](/docs/guides/user/sub-users).

### Admin / first user

The first account created on a fresh deployment. Permanently stored in `app_settings.first_user_id`. Sees the Administration section in Settings and controls signup, storage, and MFA settings. Separate from account ownership: every account is an owner, but only one is the admin.

### Audit log

Append-only record of notable events (logins, uploads, shares, admin changes). See [Audit Events](/docs/reference/audit-events) for the full catalog.

### Bulk operation

Any endpoint that accepts an `ids` array and processes multiple files in one request (move, copy, delete, star, share, download).

### Cloud Drive

A Windows drive the desktop app can mount (via WinFsp) so files can be opened and saved from any application's file dialogs. Backed by the `desktop-fs` host and `clouddrive.cjs` in the main process. See [Desktop App](/docs/getting-started/desktop-app#cloud-drive-mounted-windows-drive).

### Derived file

A new file exported from an existing one — e.g. saving a `.docx` as `.pdf` from the desktop app. Created as a sibling of the source via `POST /api/files/:id/derived`.

### Forcesave

An OnlyOffice command that tells the document server to flush the current editor state to storage without closing the document. TMA Cloud schedules a forcesave every five minutes by default while a document is open, and the background worker sends it.

### Heartbeat

A presence signal sent every two minutes by a signed-in browser or desktop client. A session is shown as online when its latest heartbeat is less than three minutes old. Missing heartbeats change the displayed status to offline; they do not revoke the session.

### JWT (JSON Web Token)

The signed token used to authenticate API requests. Delivered as an httpOnly cookie, not a header.

### Last opened (`accessed_at`)

When a file or folder was last read. Downloads, document opens and share-link reads update it; searching, renaming and viewing Get Info do not. Opening a folder marks the folder, not the files inside it. The value is written at most once per hour per item, so it can lag a read by that much. The [Cloud Drive](#cloud-drive) reports it as the NTFS last-access time. See [Last Access Time](/docs/concepts/file-system#last-access-time).

### Known proxy

A reverse proxy allowed to supply `X-Forwarded-For` and related headers. Entries are stored in `app_settings.known_proxies` as IP addresses, CIDR ranges, or hostnames and loaded when the server starts. See [Known Proxies](/docs/guides/admin/known-proxies).

### MFA (Multi-Factor Authentication)

Optional second factor (TOTP) on top of the password. Managed per user; admins can enforce it — see [MFA Management](/docs/guides/admin/mfa-management).

### MIME type / magic bytes

The actual file format, read from the first few bytes of the file content (not the file extension). TMA Cloud does not reject an upload when this doesn't match the extension so the file is stored either way. OnlyOffice editing is the exception: a document is only opened when its content matches its extension.

### OnlyOffice

The third-party document server that powers in-browser editing of `.docx`, `.xlsx`, `.pptx`, and `.pdf` files. Optional — the rest of TMA Cloud works without it.

### Orphan

Either a stored object that no `files` row points at, or a `files` row whose stored object is missing. Found by an on-demand scan and deleted only when an admin selects it. See [Orphan Review](/docs/guides/admin/orphan-review).

### Permission

One capability a sub-user can be granted: `files.download`, `files.upload`, `files.edit`, `files.share`, `files.delete`, or `files.trash`. Stored in `users.permissions`. Account owners hold all of them implicitly and are never checked against the list. Anything not granted is refused. See [Authorization](/docs/concepts/authorization).

### pg-boss

The PostgreSQL-backed job queue used for audit writes, large file-tree operations, maintenance, orphan review, and OnlyOffice force-save commands. The web process submits jobs and maintains schedules; the standalone worker executes them.

### Share domain

An optional separate domain you can point at `/s/*` routes, so share links don't expose the main app's domain. It is an admin setting stored in the database (`app_settings.share_base_url`), set it under **Settings** → **Administration**. See [Share Base URL](/docs/guides/admin/share-base-url).

### Share link / share token

A public URL (e.g. `https://example.com/s/abc123`) that lets anyone with the link view or download a file or folder, without a TMA Cloud account.

### Shared at (`shared_at`)

When a file or folder most recently joined a share. It is shown under **Shared** in Get Info. Re-sharing an active item keeps the value; unsharing clears it. Items inside a shared folder receive their own value when they join that share.

### Signup control

The admin toggle that decides whether new accounts can be created. See [Signup Control](/docs/guides/admin/signup-control).

### Soft delete

Moving a file to trash rather than removing it from storage. Trashed files are auto-purged after 15 days.

### Storage driver

Uploaded file contents stream to an S3-compatible bucket. Configure its endpoint, bucket name, and credentials with the R2, RustFS, or AWS environment variables.

### Sub-user

An extra login created by an account owner. Has its own email, password, MFA and sessions, but reads and writes the owner's files and counts against the owner's quota. Holds only the permissions the owner grants, and cannot create sub-users of its own. See [Sub-users](/docs/guides/user/sub-users).

### Token version (`token_version`)

A per-user counter that increments when the user logs out of all devices or changes password. Existing JWTs are rejected if their embedded version is older than the current one — this is how "logout everywhere" works without a token denylist. The counter is per login, so a sub-user changing its password does not sign out the rest of the account.

### Trash

The per-user soft-delete area. Deleting a file moves it here; files auto-purge after 15 days. Trash counts toward the user's storage quota.

### WinFsp

Windows File System Proxy — a user-mode filesystem driver for Windows. The desktop app uses it to provide the [Cloud Drive](#cloud-drive). Installed by the desktop installer if not already present. GPLv3 with a FLOSS exception; see [winfsp.dev](https://winfsp.dev).
