---
title: 'Updating'
description: 'Update a Docker install to a new version with update.sh.'
---

Update a Docker install to a new version with `update.sh`.

## Run an Update

`setup.sh` puts `update.sh` in the install directory. Run it there:

```bash
cd tma-cloud
./update.sh
```

Without a local copy, for example on an install made before `update.sh` existed:

```bash
cd tma-cloud
curl -fsSL https://raw.githubusercontent.com/TMA-Cloud/TMA/main/update.sh | bash
```

The containers that change are recreated, so the app is unavailable for a short time.

## What It Does

1. **Downloads and checks the new files.** `compose.yml`, `.env.example`, `setup.sh`, `rotate.sh`, and `update.sh` are downloaded over HTTPS only. Each script must start with `#!/usr/bin/env bash` and pass `bash -n`, and the new `compose.yml` must load with your `.env` and `compose.override.yml`. If any check fails, nothing is changed.
2. **Updates itself.** When `update.sh` changed, the new copy replaces the old one and runs the rest of the update.
3. **Backs up the database.** `pg_dump` writes `backups/pre-update-<time>.dump` before the new version runs its migrations. The dump is checked with `pg_restore --list`. If the backup fails, nothing is changed.
4. **Replaces the files.** The old versions are copied to `.update/backup-<time>/`. See [Files You Edited](#files-you-edited).
5. **Adds new settings to `.env`.** See [New Settings](#new-settings).
6. **Pulls the new images and restarts.** The running app image is first tagged `tma-cloud/tma:pre-update-<time>`, then `docker compose pull` and `docker compose up -d --wait` run. The script ends when the containers are healthy.

Each file is written to a temporary name in the same directory and renamed into place, so an interrupted update leaves the old file or the new one, never half of one. Scripts are saved with mode `0700`, `.env`, `compose.yml`, and `.env.example` with `0600`.

## Files You Edited

`setup.sh` and `update.sh` record the SHA-256 hash of each file they install in `.tma-manifest`. On the next update:

| Current file                                       | Result                                                        |
| -------------------------------------------------- | ------------------------------------------------------------- |
| Same as the new version                            | Left as is                                                    |
| Same as the recorded hash                          | Replaced; the old file goes to `.update/backup-<time>/`       |
| Different from both (you edited it)                | Kept; the new version is saved as `<name>.new` with a warning |
| No recorded hash (install from before `update.sh`) | Replaced; the old file goes to `.update/backup-<time>/`       |

To replace edited files as well, run `TMA_FORCE=1 ./update.sh`. The edited copies are backed up first.

Put local changes to the stack in `compose.override.yml` instead of `compose.yml`. Docker Compose merges it automatically, and updates never touch it:

```yaml
services:
  app:
    image: ghcr.io/tma-cloud/tma:3.1.5
  worker:
    image: ghcr.io/tma-cloud/tma:3.1.5
```

## New Settings

Settings that the new `.env.example` has and `.env` lacks are added at the end of `.env` under `# Added by update.sh on <time>`, with the comment lines above each one. Existing lines are never changed, so passwords and keys stay as they are. The script lists the added settings; review their values.

Settings in `.env` that the new version no longer reads are listed as safe to remove. They are not removed.

A copy of the current `.env.example` is kept in the install directory for its comments.

## Options

| Variable               | Effect                                                                  |
| ---------------------- | ----------------------------------------------------------------------- |
| `TMA_DIR`              | Install directory (default: the current directory)                      |
| `TMA_REF`              | Git branch or tag to download the files from (default: `main`)          |
| `TMA_NO_START=1`       | Update the files only: no database backup, pull, or restart             |
| `TMA_SKIP_DB_BACKUP=1` | Skip the database backup                                                |
| `TMA_NO_PULL=1`        | Use the image already on the machine, for example one built from source |
| `TMA_FORCE=1`          | Replace files you edited too                                            |

Example: `TMA_REF=v3.2.0 ./update.sh`

## Kept Backups

- The last 3 database dumps in `backups/`
- The last 5 file backups in `.update/`
- One previous app image, `tma-cloud/tma:pre-update-<time>`

## Roll Back

Migrations only move forward, so going back to the previous image also needs the database from before the update.

1. Stop the app and the worker:

   ```bash
   docker compose stop app worker
   ```

2. Recreate the database and restore the dump. Use `DB_USER` and `DB_NAME` from `.env`:

   ```bash
   docker compose exec -T postgres psql -U postgres -d postgres \
     -c 'DROP DATABASE tma_cloud_storage' \
     -c "CREATE DATABASE tma_cloud_storage ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C' TEMPLATE template0"
   docker compose exec -T postgres pg_restore -U postgres -d tma_cloud_storage --single-transaction --no-owner \
     < backups/pre-update-<time>.dump
   ```

3. Set the previous image for `app` and `worker` in `compose.override.yml`:

   ```yaml
   services:
     app:
       image: tma-cloud/tma:pre-update-<time>
     worker:
       image: tma-cloud/tma:pre-update-<time>
   ```

4. Copy the files you need back from `.update/backup-<time>/`, then start the stack:

   ```bash
   docker compose up -d
   ```

Files uploaded after the backup are left in the bucket without a database row. Find them with [Orphan Review](/docs/guides/admin/orphan-review).

## If an Update Fails

- **A download or check fails:** Nothing was changed. Run it again later.
- **The database backup fails:** Nothing was changed. Check that the `postgres` container is running.
- **The pull fails:** The files were updated, but the running containers were not changed. Run `./update.sh` again.
- **The containers do not become healthy:** The script prints the paths of the database dump, the file backup, and the previous image. Check `docker compose logs app`, then fix the cause or [roll back](#roll-back).
- **"Another update is running":** Remove `.update.lock` if no update is running.

`update.sh` does not run while `rotate.sh` is running, and the other way round, because both rewrite `.env`.

## Related Topics

- [Docker Deployment](/docs/getting-started/docker) - Install with `setup.sh`
- [Backups](/docs/guides/operations/backups) - Regular database and key backups
- [Key Rotation](/docs/guides/operations/key-rotation) - `rotate.sh`
