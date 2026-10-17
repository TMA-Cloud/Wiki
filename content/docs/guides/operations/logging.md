---
title: 'Logging'
description: 'Logging system documentation for TMA Cloud.'
---

Logging system documentation for TMA Cloud.

## Overview

The server writes one log line per event to stdout: plain text by default, or JSON for
log collectors. Every request gets a request ID that appears on its log lines and in the
`X-Request-ID` response header.

## Configuration

### Environment Variables

```bash
LOG_LEVEL=info     # error, warn, info, debug, trace (default: info)
LOG_FORMAT=json    # leave unset for plain text
```

`RUST_LOG`, when set, takes precedence over `LOG_LEVEL` and accepts per-module filters,
for example `RUST_LOG=info,tma_server::jobs=debug`.

**Recommendation:**

- Production: `LOG_LEVEL=info`
- Development: `LOG_LEVEL=debug`

Database driver and AWS SDK messages are limited to warnings unless `RUST_LOG` says
otherwise, so `debug` stays readable.

## Log Formats

### Plain Text

The default. Colours are used only when stdout is a terminal, so log files and container
logs have no escape codes.

```bash
2026-10-16T01:14:10.331Z  INFO GET /api/files 200 request_id=4f1c2a... method=GET path=/api/files status=200 ms=12
```

### JSON Format

Set `LOG_FORMAT=json` for one JSON object per line:

```json
{
  "timestamp": "2026-10-16T01:14:10.331Z",
  "level": "INFO",
  "fields": {
    "message": "GET /api/files 200",
    "request_id": "4f1c2a...",
    "method": "GET",
    "path": "/api/files",
    "status": 200,
    "ms": 12
  }
}
```

## Request Logging

Each request is logged once when it finishes, with its request ID, method, path, status
and duration in milliseconds:

- `5xx` responses are logged as errors and `4xx` as warnings; everything else is info.
- Only the path is logged, never the query string, headers, cookies or body, so tokens
  and passwords do not reach the log.
- `/health`, the favicon and the web app's static files are not logged.

**Request ID:** A client or reverse proxy can send its own `X-Request-ID` (up to 128
letters, digits, `.`, `_` or `-`) to follow a request across systems. Any other value is
replaced with a new random ID.

## Log Output

Logs go to stdout. JSON logs can be sent to ELK, Datadog, Splunk, CloudWatch, Loki, and
similar tools.

**Example:**

```bash
docker compose logs -f app worker
tma-server serve > logs/app.log 2>&1
```

## Metrics Endpoint

See [API: Monitoring](/docs/api/monitoring) for `/metrics` endpoint details.

## Related Topics

- [Audit Logs](/docs/guides/operations/audit-logs) - Audit trail system
- [Monitoring](/docs/guides/operations/monitoring) - System monitoring
- [Debugging: Common Errors](/docs/debugging/common-errors) - Troubleshooting
