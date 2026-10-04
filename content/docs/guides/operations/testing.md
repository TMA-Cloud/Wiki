---
title: 'Testing'
description: 'Running the TMA Cloud test suites.'
---

Running the TMA Cloud test suites.

## Overview

There are five suites, all using [Vitest](https://vitest.dev). Three run from a clean
checkout with no services; two talk to real infrastructure.

| Suite               | Location                                          | Needs                   |
| ------------------- | ------------------------------------------------- | ----------------------- |
| Backend unit        | `backend/tests/unit`, `backend/tests/integration` | Nothing                 |
| Backend integration | `backend/tests/integration-db`                    | PostgreSQL and Redis    |
| S3 storage driver   | `backend/tests/integration-s3`                    | An S3-compatible bucket |
| Frontend            | `frontend/tests`                                  | Nothing                 |
| Desktop app         | `electron/tests`                                  | Nothing                 |

`backend/tests/integration` holds route-level tests that mount the real routers with
the controllers stubbed. They need no services, so they run as part of the unit suite.

## Backend Commands

Run from the `backend` directory.

### Unit Tests

```bash
npm test
```

Run the unit and route-level suites once. Exits non-zero on failure.

```bash
npm run test:watch
```

Re-run affected tests as files change.

```bash
npm run test:coverage
```

Write a coverage report to `backend/coverage`.

### Integration Tests

```bash
npm run test:integration
```

Run the suite that uses PostgreSQL and Redis. See [Integration Setup](#integration-setup) first.

```bash
npm run test:integration:coverage
```

Same, with a coverage report in `backend/coverage-integration`.

### S3 Tests

```bash
npm run test:s3
```

Exercise the storage driver against the bucket configured in `.env`. Requires
bucket credentials to be set.

### Everything

```bash
npm run test:all
```

Run the unit suite, then the integration suite.

## Frontend Commands

Run from the `frontend` directory.

```bash
npm test
```

Run the frontend suite once.

```bash
npm run test:watch
```

Re-run affected tests as files change.

```bash
npm run test:coverage
```

Write a coverage report to `frontend/coverage`.

Test files are type-checked by their own TypeScript project:

```bash
npx tsc -b tsconfig.test.json
```

## Desktop App Commands

Run from the `electron` directory.

```bash
npm test
```

Run the desktop app suite once.

```bash
npm run test:watch
```

Re-run affected tests as files change.

```bash
npm run test:coverage
```

Write a coverage report to `electron/coverage`.

The suite runs under plain Node with no Electron runtime: `require('electron')` is
redirected to an in-memory double, and `child_process.spawn` and `net.createServer`
are replaced per test so PowerShell never runs and no named pipe is bound. Nothing is
mounted, no window opens, and it runs the same on Windows and on the Linux CI runner.

## Integration Setup

The integration suite reads connection details from the project `.env`, then overrides
database and cache settings and replaces bucket storage with an in-memory double so it never touches working data. Setup fails with an error if an
override has not taken effect.

| Override                 | Reason                                                         |
| ------------------------ | -------------------------------------------------------------- |
| `DB_NAME=tma_cloud_test` | Its own database. Setup stops unless the name ends in `_test`. |
| `REDIS_DB=15`            | Its own cache. Setup stops if the value is `0`.                |

Bucket operations use an isolated in-memory double in this suite. Run `npm run test:s3` separately to verify the actual provider.

Create the database once:

```bash
createdb tma_cloud_test
```

Migrations run against it on the first test run, so the schema matches production. Each
test starts from a truncated database, an empty in-memory bucket, and a flushed cache.

The S3 suite writes every object under a `tma-test/<run-id>/` prefix and deletes the
prefix objects in a multi-object request when the run finishes.

## What the Suites Cover

### Unit

Validation and path handling, AES-256-GCM encryption, MIME detection from magic bytes,
Redis caching, JWT handling, the auth and permission middleware, error-to-status
mapping, and the rate limiters. Database and Redis are replaced with in-memory doubles.

### Integration

The whole request path with nothing stubbed: real routers, real middleware, real
controllers and models, against PostgreSQL and Redis.

- Signup, login, sessions, revocation, CSRF
- Upload, download, rename, move, copy, trash, restore, permanent delete
- Sub-user permissions and the account boundary
- Share links, expiry, and anonymous access
- Storage quotas across an account
- Trash retention and the 15-day cleanup job
- Password change, its re-authentication gate, and session invalidation

### S3

Single-request and unknown-length multipart uploads, full and ranged reads, atomic and
multipart copies, single and multi-object deletion, stat, pagination, and encryption
round trips against the configured bucket. Run it once for each supported provider
configuration, including R2, because the main integration suite uses an in-memory
storage double.

### Frontend

API client and error handling, storage and file-name helpers, the Electron bridge,
React hooks, and the Modal, Toast, and PermissionChecklist components.

### Desktop App

The main process end of every desktop feature:

- Window security — context isolation, sandbox, blocked navigation and `window.open`,
  denied permission requests, and the desktop-client header that only ever goes to the
  configured server origin
- The preload bridge: which channels it exposes, and that it never hands the page a
  generic way to reach the main process
- Open on desktop — download, watch, throttled re-upload, exported "Save As" files,
  the size-based reuse of an already downloaded copy, and refusing programs and scripts
  before download
- Clipboard — the file-drop, OLE and text-as-paths sources, size caps, name
  sanitising, and origin checks on server-side copies
- Cloud Drive — the per-session bridge token and that it reaches the host on stdin,
  the staging-directory confinement on every path the filesystem host sends, save-only mode, mount and unmount, and mounting from the auth cookie without unmounting on a token refresh
- Updates — the installer URL, `Content-Disposition` filename sanitising, download
  progress, and launching the installer silently through `elevate.exe`, falling back
  to opening it through the shell
- Save and bulk save dialogs, temp-directory cleanup, single-instance behaviour, and
  the packaging contract the build scripts depend on

## Static Checks

Each Node package runs [knip](https://knip.dev) to find unused files, exports and
dependencies:

```bash
npm run knip
```

Run it from `backend`, `frontend` or `electron`. It exits non-zero when it finds
anything. In `frontend` and `electron` it runs twice, once with tests and once without,
so an export that only tests use is reported too. A frontend export kept for tests is
tagged `/** @internal Exported for tests. */`. Configuration is in each package's
`knip.jsonc`.

The backend exports through `export { ... }` lists, which the `@internal` tag cannot
mark, so its run without tests is a manual audit:

```bash
npm run knip:production
```

The Cloud Drive host in `desktop-fs` reports unused private members, unread fields and
unused parameters as build warnings. Build with `-warnaserror` to fail on them:

```bash
dotnet build -warnaserror
```

## Git Hooks

Hooks live in `.githooks/`. Turn them on once per clone from the repository root:

```bash
make hooks
```

### pre-commit

Checks staged files only:

- Prettier and ESLint, per package
- `dotnet format whitespace` for `.cs` files
- Blocks `.env` files, conflict markers and files over 5 MB

### commit-msg

- Subject starts with a capital letter and is at most 72 characters
- No trailing period and no `type:` prefix on the subject
- Blank line between the subject and the body
- Body wrapped at 72 columns and at most 40 lines
- A `Signed-off-by` line (`git commit -s`)

### pre-push

For each package the push changes:

- Lint, format check and unit tests
- Type checks (frontend only)
- knip
- `dotnet build -warnaserror` and `dotnet format` (`desktop-fs`)

A partly staged file is checked on its staged content, which is what the commit
contains. `pre-push` runs against the working tree and skips the integration suites,
which need PostgreSQL and Redis. Bypass a hook with `--no-verify` only when you have a
reason to.

## Continuous Integration

`.github/workflows/test.yml` runs lint, format check, knip, and every suite on each push
and pull request. The integration job starts PostgreSQL and Redis service containers, so
it does not need shared infrastructure. The `desktop-fs` checks are not part of CI.

## Related Topics

- [CLI Commands](/docs/reference/cli-commands) - All commands
- [Environment Variables](/docs/reference/environment-variables) - Configuration
- [Background Workers](/docs/guides/operations/background-workers) - Cleanup jobs the tests exercise
- [Backups](/docs/guides/operations/backups) - Database backup and restore
