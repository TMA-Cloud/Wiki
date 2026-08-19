---
title: 'Monitoring'
description: 'System monitoring and health checks in TMA Cloud.'
---

System monitoring and health checks in TMA Cloud.

## Health Check

**Endpoint:** `GET /health` — no authentication.

This is a **liveness** check. It returns `200` with `status`, `timestamp` and `uptime` whenever the HTTP server is accepting requests. It does not query PostgreSQL or Redis, so a healthy response does not tell you the database is reachable. The Compose healthcheck uses it to decide whether the container is serving.

To check the database from outside the app, use `pg_isready` against the Postgres container; for Redis, `redis-cli ping`.

## Metrics Endpoint

**Endpoint:** `GET /metrics` — Prometheus text format.

**Access:** restricted to the addresses in `METRICS_ALLOWED_IPS`. The default is loopback only (`127.0.0.1,::ffff:127.0.0.1,::1`), and a request from anywhere else is answered `403 Forbidden` and logged as an unauthorized access attempt. Behind a reverse proxy, `TRUST_PROXY` has to be right or the check sees the proxy's address rather than the caller's.

### What is exposed

**Node.js process metrics** (`nodejs_` prefix, from `prom-client` defaults): heap and resident memory, CPU, event loop lag, active handles, garbage collection durations.

**Audit queue metrics:**

| Metric                              | Type      | Useful for                                                    |
| ----------------------------------- | --------- | ------------------------------------------------------------- |
| `audit_events_queued_total`         | Counter   | Event volume, broken down by `action` and `status`            |
| `audit_events_processed_total`      | Counter   | Worker throughput                                             |
| `audit_events_failed_total`         | Counter   | Processing failures, broken down by `reason`                  |
| `audit_queue_depth`                 | Gauge     | Backlog — a rising value means the worker is down or too slow |
| `audit_queue_failed_depth`          | Gauge     | Jobs that exhausted their retries                             |
| `audit_processing_duration_seconds` | Histogram | Per-event processing time                                     |
| `audit_last_processed_timestamp`    | Gauge     | Staleness — alert when the gap from now grows                 |

The two gauges are refreshed every 30 seconds from the pg-boss job table.

### What is not exposed

There are no HTTP request counters, latency histograms, error-rate metrics, cache hit/miss counters, or storage-usage gauges. Per-request data lives in the structured logs, and storage figures are available through `GET /api/user/storage`.

## Suggested Alerts

- `audit_queue_depth` above a few hundred and climbing — the audit worker is not running
- `time() - audit_last_processed_timestamp` above a few minutes — same signal, from the other direction
- `audit_queue_failed_depth` greater than zero — events are being lost
- `/health` not answering `200` — the process is down
- Disk usage on the volume behind `UPLOAD_DIR`, checked at the host level

## Monitoring Beyond the App

- **Logs:** structured JSON on stdout, with a request ID on every line. See [Logging](/docs/guides/operations/logging).
- **Database:** standard PostgreSQL monitoring. Migration state is the `migrations` table.
- **Redis:** `redis-cli INFO`. Redis is optional — the app degrades to no caching rather than failing.

## Related Topics

- [Logging](/docs/guides/operations/logging) - Application logging
- [Audit Logs](/docs/guides/operations/audit-logs) - Audit system
- [API: Monitoring](/docs/api/monitoring) - Metrics endpoint
