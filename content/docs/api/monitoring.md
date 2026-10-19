---
title: 'Monitoring API'
description: 'Health and metrics endpoints for TMA Cloud.'
---

Health and metrics endpoints for TMA Cloud.

## Health Check

### GET `/health`

Get application liveness. No authentication required.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345.67
}
```

This is a liveness check, not a readiness check: it answers only whether the HTTP server is up and returns `200` unconditionally. It does not query PostgreSQL or Redis, so a healthy response does not mean the database is reachable. The Compose healthcheck uses it for to tell whether the process is serving.

## Metrics

### GET `/metrics`

Get application health and performance metrics. Restricted to IPs in `METRICS_ALLOWED_IPS`.

**Response:**
Prometheus text format.

| Metric                              | Type      | Labels           | Meaning                                       |
| ----------------------------------- | --------- | ---------------- | --------------------------------------------- |
| `http_requests_total`               | Counter   | `class`          | Responses by status class (`2xx`, `4xx`, ...) |
| `audit_events_processed_total`      | Counter   | -                | Events written to `audit_log`                 |
| `audit_events_failed_total`         | Counter   | `reason`         | Events that could not be written              |
| `audit_processing_duration_seconds` | Histogram | -                | Time to write one batch of events             |
| `audit_last_processed_timestamp`    | Gauge     | -                | Unix time of the last successful write        |
| `job_queue_depth`                   | Gauge     | `queue`, `state` | Jobs waiting (`created`) or `failed`          |

On Linux, process metrics (`process_` prefix: CPU, resident memory, open files) are also
exposed. The queue depth gauges are refreshed every 30 seconds with one aggregate query
against the `job_queue` table.

**Example:**

```bash
http_requests_total{class="2xx"} 5821
audit_events_processed_total 1234
job_queue_depth{queue="account-file-operations",state="created"} 0
```

There are no latency histograms. Per-request data lives in the structured logs instead —
see [Logging](/docs/guides/operations/logging).

## Version

### GET `/api/version`

Get the versions running here. Requires authentication.

**Rate limiting:** General API limit (30,000 per 15 minutes per user; 10,000 per IP without a session).

**Response:**

```json
{
  "server": "4.0.0",
  "web": "4.0.0",
  "desktop": "4.0.0"
}
```

The server, the web app and the desktop app are built from one workspace, so all three
report the same version.

### GET `/api/version/latest`

Fetch latest versions from the update feed (`VERSIONS_URL`, by default the feed published from the [TMA-Cloud/updates](https://github.com/TMA-Cloud/updates) repository). The answer is cached for ten minutes.

**Rate limiting:** General API limit (30,000 per 15 minutes per user; 10,000 per IP without a session).

**Response:**

The response format depends on the external update feed. Example:

```json
{
  "server": "4.0.0",
  "web": "4.0.0",
  "desktop": "4.0.0"
}
```

- `server`, `web`: Latest server and web app versions from the update feed
- `desktop`: Latest desktop app version from the update feed; the desktop app installs it where it can update itself (see [Desktop App](/docs/getting-started/desktop-app#version-and-updates))

A key missing from the feed is returned as `unknown`.

The feed is a `versions.json` with the same three keys:

```json
{
  "server": "4.0.0",
  "web": "4.0.0",
  "desktop": "4.0.0"
}
```

**Note:** This endpoint proxies the response from the update feed. A successful response is cached in the backend process for 10 minutes, so a release can take up to 10 minutes to appear. Failed requests are not cached and return an error response.

## Related Topics

- [Monitoring](/docs/guides/operations/monitoring) - Monitoring guide
- [Operations](/docs/guides/operations/background-workers) - Background services
