---
title: 'Monitoring'
description: 'Health checks, Prometheus metrics and suggested alerts for TMA Cloud.'
---

Health checks, Prometheus metrics and suggested alerts for TMA Cloud.

## Health Check

**Endpoint:** `GET /health` — no authentication.

This is a **liveness** check. It returns `200` with `status`, `timestamp` and `uptime` whenever the HTTP server is accepting requests. It does not query PostgreSQL or Redis, so a healthy response does not tell you the database is reachable. The Compose healthcheck uses it to decide whether the container is serving.

To check the database from outside the app, use `pg_isready -d "$DATABASE_URL"`; for Redis, `redis-cli -u "$REDIS_URL" ping`. The Compose health checks for the `postgres` and `redis` services run these commands.

## Metrics Endpoint

**Endpoint:** `GET /metrics` — Prometheus text format.

**Access:** restricted to the addresses in `METRICS_ALLOWED_IPS`. The default is loopback only (`127.0.0.1,::ffff:127.0.0.1,::1`); addresses are compared as addresses, and any loopback entry admits both `127.0.0.1` and `::1`, since a local scrape of `localhost` may arrive over IPv6. A request from anywhere else is answered `403 Forbidden` and logged as an unauthorized access attempt. Behind a reverse proxy, add that proxy under **Settings** → **Administration** → **Known proxies** or the check sees the proxy's address rather than the caller's.

### What Is Exposed

| Metric                              | Type      | Useful for                                                                                      |
| ----------------------------------- | --------- | ----------------------------------------------------------------------------------------------- |
| `http_requests_total`               | Counter   | Traffic and error rate, by status `class` (`2xx`, `4xx`, `5xx`)                                 |
| `audit_events_processed_total`      | Counter   | Audit throughput                                                                                |
| `audit_events_failed_total`         | Counter   | Audit write failures, broken down by `reason`                                                   |
| `audit_processing_duration_seconds` | Histogram | Time to write one batch of audit events                                                         |
| `audit_last_processed_timestamp`    | Gauge     | Staleness — alert when the gap from now grows                                                   |
| `job_queue_depth`                   | Gauge     | Backlog per `queue` and `state` — a rising `created` count means the worker is down or too slow |

On Linux the endpoint also has process metrics (`process_` prefix): CPU time, resident
memory and open files.

The queue gauges are refreshed every 30 seconds from one aggregate query against the
`job_queue` table. Scraping `/metrics` returns the latest values without starting another
database count.

### What Is Not Exposed

There are no latency histograms, cache hit/miss counters, or storage-usage gauges.
Per-request data lives in the structured logs, and storage figures are available through
`GET /api/user/storage`.

## Suggested Alerts

- `job_queue_depth{state="created"}` above a few hundred and climbing — the background worker is not running
- `job_queue_depth{state="failed"}` greater than zero — jobs exhausted their retries
- `rate(http_requests_total{class="5xx"}[5m])` above zero — server errors
- `time() - audit_last_processed_timestamp` much larger than usual — audit events are not being written
- `/health` not answering `200` — the process is down
- Bucket usage, provider quotas, and request failures, checked through your storage provider

## Monitoring Beyond the App

- **Logs:** structured JSON on stdout, with a request ID on every line. See [Logging](/docs/guides/operations/logging).
- **Database:** standard PostgreSQL monitoring. Migration state is the `migrations` table.
- **Redis:** `redis-cli INFO`. `REDIS_URL` must be set, but while Redis is unreachable the app keeps serving requests without its cache.

## Related Topics

- [Logging](/docs/guides/operations/logging) - Application logging
- [Audit Logs](/docs/guides/operations/audit-logs) - Audit system
- [API: Monitoring](/docs/api/monitoring) - Metrics endpoint
