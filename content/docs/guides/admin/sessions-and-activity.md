---
title: 'Session Timeout and Last Opened'
description: 'Set how long idle sessions last and how access times are recorded.'
---

Set how long an idle session lasts and how TMA Cloud records when files and folders were last opened (admin only). Both settings are stored in the database and apply without a restart.

## Where to Find Them

1. Navigate to **Settings** → **Administration**
2. Open **Session Timeout** or **Last Opened Tracking** under **Sessions & activity**
3. Change the values and click **Save Settings**

Every backend process re-reads the settings every 15 seconds. The process that handled the save applies them at once.

## Session Timeout

| Field                 | Range      | Default |
| --------------------- | ---------- | ------- |
| Days without activity | 1–365 days | 30      |

A session ends after this many days with no requests. Each request counts as activity and the token is re-issued while the user is active, so an active user is not signed out mid-use. See [Authentication](/docs/concepts/authentication#session-lifetime).

A change applies to existing sessions:

- **Shorter timeout:** a session idle longer than the new value is refused on its next request, and the user signs in again.
- **Longer timeout:** a token issued under the shorter value is re-issued for the new length on its next request.

The background worker deletes sessions that are idle past the timeout, and sessions ended by a password change or **Logout All**. A session is never deleted because of its age alone.

Choose a value that fits how the workspace is used. The [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) suggests shorter idle timeouts for higher-risk data. A short timeout signs out users who leave the app open but unused, including the desktop app.

## Last Opened Tracking

| Field                    | Range     | Default |
| ------------------------ | --------- | ------- |
| Tracking                 | on or off | on      |
| Update window (minutes)  | 0–1440    | 60      |
| Write interval (seconds) | 1–300     | 10      |

**Tracking:** Turned off, existing **Last opened** dates stay in place but stop changing, and the **Recent** list stops updating. Timestamps already collected in memory are still written. Windows offers the same switch as `NtfsDisableLastAccessUpdate`.

**Update window:** After an item's access time is written, further opens of it within the window are not written. A larger window means fewer database writes and less precise dates. `0` writes every open. NTFS keeps its last-access time to within one hour; Linux `relatime` rewrites it once the stored value is more than a day old (1440 minutes).

**Write interval:** Opens are collected in memory and written in one batched statement per interval, so a download never waits on the write. A longer interval means fewer statements; a shorter one makes dates appear sooner. Collected opens are written when the server shuts down.

See [File System](/docs/concepts/file-system#last-access-time) for what counts as an open.

## Related Topics

- [Authentication](/docs/concepts/authentication) - Tokens, sessions, and revocation
- [Authentication Issues](/docs/debugging/auth-issues) - Unexpected logouts
- [User API](/docs/api/users#session-and-access-time-configuration) - The endpoints behind these settings
