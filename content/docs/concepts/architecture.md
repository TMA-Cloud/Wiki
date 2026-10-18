---
title: 'Architecture Overview'
description: 'System architecture and design patterns for TMA Cloud.'
---

System architecture and design patterns for TMA Cloud.

## System Architecture

TMA Cloud is written in Rust and uses a **single-origin architecture**: one server
program, `tma-server`, serves the web app and all APIs from the same origin.

- **Production:** the Docker image runs `tma-server serve` for the API and web app and
  `tma-server worker` for background work. Both are the same binary.
- **Development:** build the web app once with `trunk build` and run
  `tma-server serve --with-worker`; the server finds the build in
  `apps/tma-cloud-web/dist`.

### Production Architecture

```bash
┌─────────┐        ┌──────────────┐
│ Browser │        │ Desktop app  │
└────┬────┘        └──────┬───────┘
     │ HTTP               │ HTTP (desktop header)
┌────▼────────────────────▼────────────────────────┐
│         tma-server serve (:3000)                 │
│  ┌──────────────────────────────────────────┐    │
│  │ /          → Web app (WebAssembly)       │    │
│  │ /api/*     → API Endpoints               │    │
│  │ /s/*       → Share Links                 │    │
│  │ /health    → Health Check                │    │
│  │ /metrics   → Prometheus Metrics          │    │
│  └──────────────────────────────────────────┘    │
└────┬───────────────────┬─────────────────────────┘
     │                   │
┌────▼─────┐      ┌──────▼──────┐     ┌─────────────────────┐
│PostgreSQL│      │    Redis    │     │ tma-server worker   │
│ Database │      │   (Cache)   │     │ (jobs, maintenance) │
└──────────┘      └─────────────┘     └─────────────────────┘
```

**Benefits:** No CORS issues, simplified deployment, cookie-based auth, no frontend
environment variables.

### One interface, two apps

The interface is written once with [egui](https://www.egui.rs). It runs in the browser
as WebAssembly (the web app the server serves) and natively as the desktop app for
Windows, macOS and Linux. Both talk to the same `/api/*` endpoints.

### Custom Share Domain (Optional)

Configure custom share base URL in Settings → Administration → Share link address (admin only). When
configured, share links use the custom domain. The share domain blocks all routes
except `/s/*`, `/health`, and `/metrics`.

## Code Structure

```bash
crates/
├── tma-core/     # Shared types, file kinds, names and formatting (also built to WebAssembly)
├── tma-server/   # The server: routes, models, services, jobs, storage, crypto, CLI
├── tma-client/   # API client used by both apps
├── tma-ui/       # The egui interface
└── tma-drive/    # Cloud Drive
apps/
├── tma-cloud/      # Desktop app
└── tma-cloud-web/  # Web app (built with trunk)
```

**Server components:**

- **Routes:** Parse requests and shape responses; one file per area
- **Middleware:** Request context and access log, share domain blocking, desktop-only
  mode, security headers, CSRF, authentication and rate limits
- **Models:** All SQL, with Redis caching for hot lookups
- **Services:** Audit batching, live events, access-time buffering, metrics, OnlyOffice
- **Jobs:** A durable job queue in PostgreSQL (see [Background Workers](/docs/guides/operations/background-workers))
- **Real-Time Events:** Redis pub/sub + SSE for file event broadcasting; a burst for one
  user is published as one batch envelope and causes one list refresh. Each API process
  holds one Redis subscriber connection shared by all of its SSE streams, so open tabs do
  not add Redis connections

**Interface:** views draw the screen; background requests run off the frame and their
results are applied on the next frame. The light and dark palettes follow the system
setting until you switch with the sun or moon button in the header. Text is set in Inter,
bundled with the app.

## Desktop App

A native app for Windows, macOS and Linux. It signs in to a server you choose, keeps the
session in the system's credential store (Windows Credential Manager, macOS Keychain,
Secret Service on Linux), and reports itself as a desktop client, so it works when the
server is set to allow only the desktop app.

Extras over the web app:

- **Open in desktop apps:** opening any file opens it from the Cloud Drive folder with
  the computer's app for its type, and the drive uploads every save. A "Save As" PDF or
  copy saved next to it uploads beside the original
- **System clipboard:** Copy also puts the files' Cloud Drive paths on the Windows
  clipboard, to paste into Explorer, mail or chat; files copied in Explorer paste in
  (Windows)
- **Updates:** a newer release downloads and installs itself (Windows)
- **One copy at a time:** opening the app again brings the running window forward
- **Cloud Drive:** see below

## Cloud Drive

The desktop app shows TMA Cloud as a `TMA Cloud` folder so files can be opened and saved
from any application's file dialogs, with no extra driver on any system:

- **Windows:** the Cloud Files API (what OneDrive uses). Files are placeholders that
  download when opened; a watcher uploads local changes, and server events refresh the
  folders you have opened. Cloud Files is built into Windows 10 version 1709 and later.
- **Linux:** FUSE.
- **macOS:** a local NFS server inside the app, reachable only from `127.0.0.1`, mounted
  with the system's own NFS client.

The drive runs inside the desktop app. Every operation becomes a call to `/api/*` with
the app's own session, so the drive uses the same auth, permissions, and audit as the
rest of the app. There is no separate helper process and no local pipe.

```bash
Any app's Save As → %USERPROFILE%\TMA Cloud (Cloud Files) or ~/TMA Cloud (FUSE, NFS)
        │
   Desktop app (Cloud Drive core, signed-in session) → /api/* → server
```

The app connects the drive after sign-in and disconnects it on sign-out or when it closes.
Directory listings are cached for five seconds and dropped when the server's event
stream reports a change. See [Desktop App — Cloud Drive](/docs/getting-started/desktop-app#cloud-drive).

**Names.** The server stores names that Windows cannot hold, such as `Q3: plan?.docx`. On
Windows, each reserved character `"*:<>?|\`, and a trailing dot or space, maps to the
private-use character `U+F000` plus its code when a folder is listed, and maps back
before a create, rename or save. This is the mapping Cygwin, WSL and Syncthing use, so a
name survives the round trip unchanged.

**Drive permissions.** On Windows, files and folders on the drive report a security
descriptor granting the signed-in Windows user, `SYSTEM` and the local Administrators
group but not `Everyone`, so other accounts on a shared machine cannot read the mount.

**Concurrent saves.** Creating a file or folder is serialized per path, so an app's
0-byte placeholder and the real content resolve to one file on the server. Saves to
different paths do not wait for each other.

**Local staging.** On Linux and macOS, reads and writes stage through files in
`TMA Cloud/drive` in the user's cache folder. Staging files are deleted when their handle
closes, and any survivors are removed when the drive unmounts. Cloud Files on Windows
streams downloads straight into the placeholder and stages nothing.

## Data Flow

### Authentication Flow

```bash
┌─────────┐     POST /api/login       ┌──────────┐
│  App    │ ────────────────────────> │  Server  │
└─────────┘                           └────┬─────┘
     │                                     │
     │                                     │ Validate credentials
     │                                     │ Create session
     │                                     │ Generate JWT token
     │                                     │
     │<────────────────────────────────────┘
     │ Set httpOnly cookie
```

### File Upload Flow

```bash
┌──────────┐     POST /api/files/upload     ┌──────────┐
│   App    │ ─────────────────────────────> │  Server  │
│(multipart)                                └────┬─────┘
└──────────┘                                     │
                                                 │ Enforce size while streaming
                                                 │ Encrypt and write to bucket
                                                 │ Validate request metadata
                                                 │ Create database record
                                                 │
┌─────────┐     Response with file info          │
│   App   │<─────────────────────────────────────┘
└─────────┘
```

**Storage:** S3-compatible object storage is required. File contents stream through
encryption to the bucket. Large files use multipart upload with a part size calculated
to stay within the S3 and R2 10,000-part limit. If later validation rejects the request,
the uploaded object is queued for deletion.

### Share Link Flow

```bash
┌─────────┐     POST /api/files/share      ┌──────────┐
│   App   │ ─────────────────────────────> │  Server  │
└─────────┘                                └────┬─────┘
                                                │
                                                │ Check items belong to account
                                                │ Create share link
                                                │ Generate token
                                                │ Link files
                                                │
┌─────────┐     Response with share URL         │
│   App   │<────────────────────────────────────┘
└─────────┘
```

## Database Schema

Key tables: `users`, `files`, `share_links`, `share_link_files`, `sessions`,
`mfa_backup_codes`, `client_heartbeats`, `storage_reservations`,
`file_operation_results`, `job_queue`, `job_schedules`, `app_settings`, `audit_log`

See [Database Schema](/docs/reference/database-schema) for details.

## Security

- JWT tokens in httpOnly cookies
- Input validation and sanitization
- SQL injection protection (parameterized queries)
- XSS protection (HTML escaping on server-rendered pages)
- Path traversal protection
- Rate limiting
- Security headers (CSP with per-request nonces, X-Frame-Options, etc.). See [Security Model](/docs/concepts/security-model#security-headers)

## Logging & Audit

- **Structured Logging:** one line per request with its request id; plain text, or JSON
  with `LOG_FORMAT=json`
- **Background Work:** the worker runs account-ordered file operations, object cleanup,
  maintenance schedules, admin-requested orphan work, share auto-linking, and OnlyOffice
  force-save commands from a job queue in PostgreSQL. Audit events are written in batches
  by each process
- **Request Logging:** All requests logged with context

See [Logging](/docs/guides/operations/logging) and [Audit Logs](/docs/guides/operations/audit-logs) for details.

## Technology Stack

**Server:** Rust, axum, PostgreSQL (sqlx), Redis, AWS SDK for S3

**Interface:** egui (native and WebAssembly), built with trunk for the web

**Cloud Drive:** Cloud Files (Windows), FUSE (Linux), NFS (macOS)

**Integration:** OnlyOffice
