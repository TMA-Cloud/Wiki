---
title: 'OnlyOffice Issues'
description: 'Fix documents that do not open, do not save, or keep auto-saving.'
---

Fix documents that do not open, do not save, or keep auto-saving.

## Editor Not Loading

### Configuration Missing

**Check:**

1. The Document Server URL and secret are saved in **Settings** → **Administration** → **Integrations**
2. `BACKEND_URL` is set in `.env`

**Solutions:**

1. Save the OnlyOffice settings (first user only)
2. Set `BACKEND_URL` in `.env` and restart
3. Open the Document Server URL in a browser to check it answers

### File Not Opening

**Check:**

1. The file type is supported: Word, Excel and PowerPoint formats (`.docx`, `.doc`, `.xlsx`, `.xls`, `.csv`, `.pptx`, `.ppt` and their macro and template variants), OpenDocument (`.odt`, `.ods`, `.odp`) and `.pdf`
2. The Document Server is running
3. The file content matches its extension

**Solutions:**

1. A sub-user needs the **Download** permission to open documents
2. A `.txt` file renamed to `.docx` does not open; see the next section

### MIME Type Mismatch

**Error:** "Cannot open file: type mismatch (expected .docx format)"

**Cause:**

The file content does not match its extension, usually because the file was renamed to another type.

**Solution:** Rename the file back to its real extension, or save it in the right format and upload it again.

## Callback Issues

### Callback Not Working

**Check:**

1. `BACKEND_URL` is the address the Document Server uses to reach TMA Cloud
2. From the Document Server host, `curl $BACKEND_URL/health` answers
3. No firewall blocks the Document Server from TMA Cloud

### Edits Not Saved

When the Document Server reports a saved document, the server downloads it from the URL in the callback. It refuses some URLs and logs why:

- `[ONLYOFFICE] Blocked save URL outside the document server`: the URL points to a private or internal IP address that is not the Document Server's own host. Set **Document Server URL** in **Settings** → **Administration** → **Integrations** → **OnlyOffice** to the address the Document Server uses in its download links.
- `[ONLYOFFICE] Callback error` with `resolves only to internal addresses`: the URL's hostname resolves to a private or internal address. Only the configured Document Server host may do that, so use that host name in **Document Server URL**.
- `[ONLYOFFICE] Callback error` with a timeout: the Document Server stopped sending the file for a minute. Check the network between the two servers.

## Auto-Save Issues

### Changes Not Saving Until Close

**Expected behavior:** Documents save to storage every five minutes by default while being edited.

**Check:**

1. The background worker is running: `docker compose ps worker`, or `tma-server worker` outside Docker
2. The `job_schedules` table has a row named `onlyoffice:<document key>`
3. Callback logs show status 6 with `forcesavetype: 0`

**If no schedule appears:**

1. Check app logs for `[ONLYOFFICE-AUTOSAVE] Failed to schedule document`
2. Verify PostgreSQL is reachable from the app
3. Open the document again after resolving the queue error

**If force-save jobs fail:**

1. Check the OnlyOffice URL is correct and reachable from the worker
2. If OnlyOffice uses HTTPS with a self-signed certificate, set `ONLYOFFICE_REJECT_UNAUTHORIZED=false` so the app accepts it when it downloads saved documents, or give the Document Server a trusted certificate
3. Check the Document Server container logs

**If forcesave commands return non-200:**

1. Status 403: JWT secret mismatch between backend and OnlyOffice server
2. Status 404 on both `/command` and `/coauthoring/CommandService.ashx`: The proxy is not exposing the command service
3. Check worker logs and failed jobs in the `onlyoffice-forcesave` queue

### Auto-Save Running After Document Closed

**Cause:** Callback with status 2 or 4 was not received, so the document schedule was not removed. A later force-save response reporting that the document is closed also removes it.

**Check:**

1. OnlyOffice server can reach the callback URL (`BACKEND_URL`)
2. Callback endpoint returns `{ "error": 0 }` (required for OnlyOffice to stop retrying)
3. No network/firewall issues between OnlyOffice container and backend

### Only Manual Saves (Ctrl+S) Work

**Cause:** The auto-save service is not sending forcesave commands, or they are being rejected.

**Check:**

1. Failed jobs in the `onlyoffice-forcesave` queue and worker logs
2. OnlyOffice JWT secret matches between backend settings and OnlyOffice server config
3. OnlyOffice server is accessible from the backend host (not just from the browser)

## Related Topics

- [OnlyOffice API](/docs/api/onlyoffice) - API endpoints
- [Architecture](/docs/concepts/architecture) - System architecture
