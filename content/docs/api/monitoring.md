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

Two groups are exposed:

- **Node.js process metrics** collected by `prom-client`, prefixed `nodejs_` — memory, CPU, event loop lag, garbage collection, handles.
- **Audit queue metrics**, listed below.

| Metric                              | Type      | Labels             | Meaning                                |
| ----------------------------------- | --------- | ------------------ | -------------------------------------- |
| `audit_events_queued_total`         | Counter   | `action`, `status` | Events handed to pg-boss               |
| `audit_events_processed_total`      | Counter   | -                  | Events written to `audit_log`          |
| `audit_events_failed_total`         | Counter   | `reason`           | Events that failed to process          |
| `audit_queue_depth`                 | Gauge     | -                  | Jobs in `created` or `retry` state     |
| `audit_queue_failed_depth`          | Gauge     | -                  | Jobs in `failed` state                 |
| `audit_processing_duration_seconds` | Histogram | -                  | Time to process one event              |
| `audit_last_processed_timestamp`    | Gauge     | -                  | Unix time of the last successful write |

The two queue depth gauges are refreshed every 30 seconds by querying the pg-boss job table.

**Example:**

```bash
audit_events_queued_total{action="file.upload",status="success"} 1234
audit_queue_depth 0
nodejs_heap_size_used_bytes 4.2e+07
```

There are no HTTP request counters or latency histograms. Per-request data lives in the structured logs instead — see [Logging](/docs/guides/operations/logging).

## Version

### GET `/api/version`

Get currently deployed backend version. Requires authentication.

**Rate limiting:** General API limit (10000 per 15 minutes, per user when authenticated).

**Response:**

```json
{
  "backend": "3.0.0"
}
```

- `backend`: Backend version from backend package.json

### GET `/api/version/latest`

Fetch latest versions from update feed.

**Rate limiting:** General API limit (10000 per 15 minutes, per user when authenticated).

**Response:**

The response format depends on the external update feed. Example:

```json
{
  "frontend": "3.0.0",
  "backend": "3.0.0",
  "electron": "1.0.0"
}
```

- `frontend`: Latest frontend version from the update feed
- `backend`: Latest backend version from the update feed
- `electron`: Latest Windows Electron app version from the update feed

**Note:** This endpoint proxies the response directly from the update feed. If the request fails, returns an error response.

## Related Topics

- [Monitoring](/docs/guides/operations/monitoring) - Monitoring guide
- [Operations](/docs/guides/operations/background-workers) - Background services
