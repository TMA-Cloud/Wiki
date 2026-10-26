---
title: 'Testing'
description: 'Run the unit and end-to-end tests, the house rules and the git hooks.'
---

Run the unit and end-to-end tests, the house rules and the git hooks.

## Overview

TMA Cloud is one Rust workspace. Unit tests live next to the code in each crate and run
from a clean checkout with no services. One end-to-end suite talks to real infrastructure.

| Suite              | Location                             | Needs                                                                        |
| ------------------ | ------------------------------------ | ---------------------------------------------------------------------------- |
| Unit (every crate) | `#[cfg(test)]` modules in `src/`     | Nothing                                                                      |
| Server end to end  | `crates/tma-server/tests/api.rs`     | PostgreSQL, Redis and an S3-compatible bucket                                |
| Cloud Drive core   | `crates/tma-drive/src/core/tests.rs` | Nothing (an in-memory backend)                                               |
| Load test          | `crates/tma-drive/examples/load`     | A throwaway server; see [Load Testing](/docs/guides/operations/load-testing) |

## Commands

Run from the repository root.

```bash
cargo xtask ci
```

Run what CI runs: the format check (rustfmt for Rust, Prettier for Markdown, YAML, JSON,
HTML and CSS), the house rules below, Clippy with warnings as errors, every unit test,
and Clippy for the WebAssembly build of the web app. Exits non-zero on failure. Without
Node.js the Prettier half is skipped with a note; CI always runs it.

```bash
cargo xtask fmt
```

Format everything: `cargo fmt` and Prettier 3.9.9 through `npx`. Add `--check` to only
report.

```bash
cargo xtask house
```

Check the project's own rules, which rustfmt and Clippy do not cover:

- No source file over 400 lines of code. Blank lines, comments and the test module do
  not count. Clippy separately limits functions to 150 lines.
- No run of 10 or more identical code lines in two places, and no two functions with the
  same body of 3 or more lines, whatever their names.
- No dependency that a crate's code never names. One needed only for a feature or for
  linking is listed under `[package.metadata.cargo-machete] ignored`.
- Interface colours come from the theme, never literal values, and text uses the ASCII
  apostrophe.

Deprecated and unused code is refused by the compiler itself, not only in CI: the
workspace lints deny `deprecated` and the whole `unused` group, so `cargo check`,
`cargo build` and `trunk build` fail on a deprecated call or an unused import, variable,
function, field or result. A lint can be silenced only with
`#[expect(lint, reason = "...")]`; Clippy rejects `#[allow]` and missing reasons, and an
`expect` that nothing triggers any more is itself an error, so a stale suppression
cannot hide dead code.

`cargo xtask house --sizes` lists the largest files. `cargo xtask house --near` also finds
copies that differ only in strings or numbers; it flags look-alike data tables too, so
it is a review aid rather than a CI check.

```bash
cargo test --workspace
```

Run the unit tests only.

```bash
cargo test -p tma-drive
```

Run one crate's tests (here, Cloud Drive).

### End-to-end Tests

```bash
cargo test -p tma-server --test api
```

Start the real server and background worker on a free port and drive them through the
same API client the apps use. See [End-to-end Setup](#end-to-end-setup) first. Without
the variables below, the test reports that it was skipped and passes.

## End-to-end Setup

The suite reads its connections from environment variables, never from `.env`, so it
cannot touch working data.

| Variable                 | Value                                                     |
| ------------------------ | --------------------------------------------------------- |
| `TMA_TEST_DATABASE_URL`  | A database whose name contains `test`. It is wiped first. |
| `TMA_TEST_REDIS_URL`     | A Redis database of its own, for example index `15`       |
| `TMA_TEST_S3_ENDPOINT`   | An S3-compatible endpoint (RustFS, MinIO, ...)            |
| `TMA_TEST_S3_ACCESS_KEY` | Its access key                                            |
| `TMA_TEST_S3_SECRET_KEY` | Its secret key                                            |
| `TMA_TEST_S3_BUCKET`     | A bucket for the test; created if it does not exist       |

Without the four `TMA_TEST_S3_*` variables, the upload checks are skipped and the rest
still runs.

Create the database once:

```bash
createdb tma_cloud_test
```

A local bucket for the test can run in Docker:

```bash
docker run -d --rm --name tma-test-s3 -p 9100:9000 \
  -e RUSTFS_ACCESS_KEY=tmatestkey -e RUSTFS_SECRET_KEY=tmatestsecret123 \
  rustfs/rustfs:latest /data
```

## What the Suites Cover

### Unit

- File encryption: the streaming format, ranged decryption, key wrapping, the keyring
  and its check values, sealed settings secrets
- Names and paths: the file name rule, extensions, Windows-safe names, ZIP entry names
- Listing cursors, share pages, upload sniffing, CSP hashes, rate limits, schedules
- The API client's error messages and server-sent event parsing
- Version comparison and other UI helpers

### Server End to End

The whole request path with nothing stubbed, against PostgreSQL, Redis and a bucket:

- Signup of the first account (administrator), login, wrong passwords
- Bucket configuration, tested before it is saved
- Upload, download (decrypted), folder uploads that create their folders, search, stars
- Copy and permanent delete through the background worker
- Share links, the public page, and unsharing
- Trash and restore
- Sub-user permissions: a view-only sub-user cannot upload
- Signing out of every device

### Cloud Drive

The drive's behaviour, independent of the system it runs on: creating and writing files,
empty placeholders that apps create before saving, saving the same name again,
temporary-file-then-rename saves, Word, Excel and LibreOffice saves (the document keeps
its ID and no backup or temporary file is uploaded), folders, moves, deletes, save-only
mode, and names with characters Windows does not allow. The Windows sync plan (what to
download, upload, rename or remove so a folder matches the server) is tested on its own.

To try a real drive against a running server, sign in with the `TMA_URL`, `TMA_EMAIL` and
`TMA_PASSWORD` variables and run:

```bash
cargo run -p tma-drive --example mount_test
```

It mounts the drive (Cloud Files on Windows, FUSE on Linux), then creates, saves (also the
way Word does), renames and deletes files from a second process and checks the server
after each step. On Linux,
`TMA_ADAPTER=nfs` tests the macOS NFS adapter (run as root with the NFS client installed).

## Git Hooks

Hooks live in `.githooks/`. Turn them on once per clone from the repository root:

```bash
make hooks
```

### `pre-commit`

Checks staged files only:

- `rustfmt` on staged `.rs` files
- Prettier on staged Markdown, YAML, JSON, HTML and CSS files (skipped without Node.js)
- Blocks `.env` files, conflict markers and files over 5 MB

### `commit-msg`

- Subject starts with a capital letter and is at most 72 characters
- No trailing period and no `type:` prefix on the subject
- Blank line between the subject and the body
- Body wrapped at 72 columns and at most 40 lines
- A `Signed-off-by` line (`git commit -s`)

### `pre-push`

When the push changes Rust code, runs `cargo xtask ci`.

A partly staged file is checked on its staged content, which is what the commit
contains. `pre-push` runs against the working tree and skips the end-to-end suite,
which needs PostgreSQL, Redis and a bucket. Bypass a hook with `--no-verify` only when
you have a reason to.

## Continuous Integration

`.github/workflows/ci.yml` runs on each push to `main` and on each pull request:

- Format (rustfmt and Prettier), house rules, Clippy and the WebAssembly build on Linux
- Unit tests and the end-to-end suite on Linux, with PostgreSQL and Redis service
  containers and a RustFS bucket
- Clippy and tests for the desktop app and Cloud Drive on Windows and macOS, since each
  system has its own drive adapter
- `shellcheck` on the install scripts and git hooks

A newer push to a pull request cancels its older run; runs on `main` always finish.

## Releases

`.github/workflows/release.yml` makes a release. Start it by pushing a `vX.Y.Z` tag, or
run it from the Actions tab: with the tag field empty it releases the version in
`Cargo.toml` and creates its tag on the commit it built. The tag must match
`Cargo.toml`, and a run without a tag stops if that version is already released.

1. The desktop installers for Windows, macOS and Linux and the Docker image are built.
   Meanwhile the release waits for the CI run that the push to `main` started on the same
   commit; a commit CI never ran on, or one it failed, is not released.
2. Only when all of them pass, the image gets its version tags (for `4.1.2`: `4.1.2`,
   `4.1`, `4` and `latest`; a pre-release such as `4.2.0-rc.1` gets only its own) and the
   GitHub release is published with the installers attached.

A failed build or check publishes nothing.

## Related Topics

- [CLI Commands](/docs/reference/cli-commands) - All commands
- [Environment Variables](/docs/reference/environment-variables) - Configuration
- [Background Workers](/docs/guides/operations/background-workers) - Jobs the tests exercise
- [Backups](/docs/guides/operations/backups) - Database backup and restore
