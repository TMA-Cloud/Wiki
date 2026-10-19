---
title: 'Load Testing'
description: 'Run many simulated desktop apps against a throwaway server to find breaking points before users do.'
---

Run many simulated desktop apps against a throwaway server, shaped like a real production account, to find breaking points before users do. Worth running before a release that touches syncing, uploads, locking or the database.

## What It Simulates

The load test is an example program in the Cloud Drive crate, `crates/tma-drive/examples/load`. It uses the same API client and drive backend as the desktop app, so its requests are the real ones. Each simulated app:

- Signs in as its own account and holds the live event stream open.
- Sends the desktop heartbeat every 60 seconds.
- Keeps a set of folders open, as Cloud Drive does for folders browsed in File Explorer. After a burst of events, and once a minute, it asks [which folders changed](/docs/api/files#folder-changes) and lists those again; it lists all of them at start and when the server asks for a full resync.
- Works in the proportions a production audit log showed: 55% downloads, 26% saves (taking the edit lock, saving against the listed version, letting the lock go), 7% uploads, then trash, renames, copies, new folders and moves.

It only ever signs in as the `@load.test` accounts it creates, so it cannot change anyone else's files. It still writes a lot of data: **never point it at production.**

## Set Up a Throwaway Stack

Docker containers for PostgreSQL, Redis and an S3-compatible store, and a release build of the server with its own `.env` on another port. In Git Bash on Windows, run `export MSYS_NO_PATHCONV=1` first, or Docker receives `/data` as a Windows path.

```bash
docker run -d --name tma-load-pg -e POSTGRES_USER=tma -e POSTGRES_PASSWORD=tma -e POSTGRES_DB=tma_load -p 55433:5432 postgres:18-alpine -c max_connections=300
```

```bash
docker run -d --name tma-load-redis -p 56380:6379 redis:8-alpine
```

```bash
docker run -d --name tma-load-s3 -p 59001:9000 -e RUSTFS_ACCESS_KEY=loadkey -e RUSTFS_SECRET_KEY=loadsecret123 rustfs/rustfs:latest /data
```

```bash
docker run --rm --network container:tma-load-s3 -e AWS_ACCESS_KEY_ID=loadkey -e AWS_SECRET_ACCESS_KEY=loadsecret123 -e AWS_DEFAULT_REGION=us-east-1 amazon/aws-cli --endpoint-url http://localhost:9000 s3 mb s3://tma-load
```

Build the server with `cargo build --release -p tma-server`, copy `target/release/tma-server` into an empty folder, and create a `.env` there. The server reads the `.env` of its working folder, so the project's own stays untouched.

```bash
APP_ENV=development
PORT=3200
BACKEND_URL=http://localhost:3200
DATABASE_URL=postgresql://tma:tma@localhost:55433/tma_load
REDIS_URL=redis://localhost:56380/0
JWT_SECRET=<a long random string>
FILE_ENCRYPTION_KEY=<from: tma-server key generate>
FORCE_INSECURE_COOKIES=true
LOG_LEVEL=warn
```

Start it from that folder with `tma-server serve --with-worker`.

## Run It

Point the tool at the server with `TMA_URL`. Use `127.0.0.1` rather than `localhost`: on Windows, `localhost` tries IPv6 first, and the server listens on IPv4, so every new connection waits about 300 ms before falling back, which shows up as slow sign-ins and first requests. The `TMA_LOAD_S3_*` variables let `seed` connect the bucket; without them it keeps the server's own.

```bash
export TMA_URL=http://127.0.0.1:3200 TMA_LOAD_S3_ENDPOINT=http://localhost:59001 TMA_LOAD_S3_BUCKET=tma-load TMA_LOAD_S3_ACCESS_KEY=loadkey TMA_LOAD_S3_SECRET_KEY=loadsecret123
```

```bash
cargo run --release -p tma-drive --example load -- seed 9 1
```

Creates `owner@load.test` (the first user on a fresh server), nine sub-users who may do everything, and a production-shaped tree: 2,194 folders up to 10 deep and 16,787 files, with a fifth of them in one folder in a hundred, as the busiest folders hold. The second number multiplies the tree. Uploads are spread across the accounts, so no one runs into their request budget. Expect about a quarter of an hour at scale 1: writes to one account commit one at a time, for its storage limit, so the disk's commit speed sets the pace. All accounts share one password, `TMA_LOAD_PASSWORD` or a default.

```bash
cargo run --release -p tma-drive --example load -- run 50 300 2 180
```

Starts 50 apps with 300 folders open each, doing 2 actions a minute each, for 180 seconds. Production's busiest hour had about 3 actions a minute across all its users, so this is roughly 30 times that. A report prints every 15 seconds and a summary at the end.

| Command                                             | What it does                                                                                  |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `seed <sub-users> <scale>`                          | Build the accounts and the tree                                                               |
| `run <apps> <open folders> <actions/min> <seconds>` | Simulate desktop apps                                                                         |
| `bigfiles <count> <MiB>`                            | Upload that many large files at once, then download them all at once                          |
| `bulk`                                              | Copy the largest top-level folder, trash the copy, and delete it for good, each timed         |
| `refusals`                                          | An over-quota upload and uploads without permission must report why, not a dropped connection |
| `reads`                                             | Time listing, search, recent files, stats, the change feed and storage usage on the account   |

## Reading the Results

Each line of a report is one operation: how many succeeded and failed, and the 50th, 95th and 99th percentile and the slowest time in milliseconds. `full pass` is one app listing every folder it has open. The summary ends with the most common failure reasons.

What a healthy run looks like, from the October 2026 tests on one Windows workstation:

| Load                                                                       | Result                                                        |
| -------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 50 apps, 300 open folders, 2 actions/min, 3 minutes                        | 22,000 requests, no failures                                  |
| 100 apps, 30 actions/min (writes), 4 minutes                               | No failures or deadlocks; saves p99 about 200 ms              |
| 150 apps, 1,000 open folders, a bulk copy and 10 × 300 MiB uploads mid-run | 378,000 requests, no failures; folder totals exact            |
| 30 uploads of 200 MiB at once                                              | Server memory peaked under 200 MB (`UPLOAD_MEMORY_MB` is 512) |

Any failure, a `deadlock detected` in the PostgreSQL log, or a server error in the server log is worth investigating. After a run, check that folder totals and storage use are still exact: the weekly [folder aggregate check](/docs/guides/operations/background-workers#maintenance-schedule) recomputes them, and `reconcile_folder_aggregates(user_id)` returns how many were wrong.

RustFS deletes objects one at a time, so `bulk`'s permanent delete is slower locally than on Amazon S3 or Cloudflare R2.

## Clean Up

```bash
docker rm -f -v tma-load-pg tma-load-redis tma-load-s3
```

Then delete the folder that held the server and its `.env`.

## Related Topics

- [Testing](/docs/guides/operations/testing) - Unit and end-to-end suites
- [Rate Limits](/docs/reference/rate-limits) - The request budgets the apps run into
- [Desktop App](/docs/getting-started/desktop-app#cloud-drive) - How Cloud Drive syncs
