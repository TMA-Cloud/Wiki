---
title: 'Backups'
description: 'Backup and restore procedures for TMA Cloud.'
---

Backup and restore procedures for TMA Cloud.

## What to Backup

- **Database:** PostgreSQL database (all schemas including `pgboss`). It includes the bucket and Google sign-in settings with their encrypted secrets
- **Files:** S3 bucket contents
- **Configuration:** `.env` file
- **Encryption key:** See [Encryption Key](#encryption-key)

## Encryption Key

Every stored file and the saved bucket secret are encrypted under this key. Without it, a restored database and bucket cannot be decrypted, and the key cannot be recovered.

Where the key is:

| Setup                   | Variable                   | Location                                |
| ----------------------- | -------------------------- | --------------------------------------- |
| Docker (`setup.sh`)     | `FILE_ENCRYPTION_KEY_FILE` | `tma-cloud/secrets/file_encryption_key` |
| Key file outside Docker | `FILE_ENCRYPTION_KEY_FILE` | The path set in `.env`                  |
| Key in `.env`           | `FILE_ENCRYPTION_KEY`      | The value in `.env`                     |

After a rotation the key file holds every key version. Back up the whole file: a database backup can only be read with the versions that were in use when it was taken. See [Key Rotation](/docs/guides/operations/key-rotation).

How to keep it:

1. Copy the key once, after setup, and again after each key rotation. It does not change otherwise.
2. Store it apart from the database backups, for example in a password manager. A backup that holds both the database and the key gives full access to the files.
3. To restore, put the key back at the same location with the same value before starting the containers. The server refuses to start with a different key.

## Before Updates

`update.sh` dumps the database to `backups/pre-update-<time>.dump` before each update and keeps the last 3. These dumps are for rolling back an update, not a replacement for regular backups. See [Updating](/docs/guides/operations/updating#roll-back).

## Backup Script

TMA Cloud includes a backup and restore script, `db-backup-restore.sh`. `setup.sh` puts it in the install directory and `update.sh` keeps it current. In a repository checkout it is `scripts/db-backup-restore.sh`. It handles full PostgreSQL backups and restores through Docker or the PostgreSQL client tools on the host.

Run it from the install directory with `./db-backup-restore.sh`; the examples below use that form.

### How It Works

- Uses `pg_dump` with custom format (compressed binary, supports selective and parallel restore)
- Takes a `--serializable-deferrable` snapshot (consistent read without blocking writes)
- Verifies the dump with `pg_restore --list` immediately after creation. The dump is written as `<name>.dump.part` and renamed only after this check, so a failed dump leaves no file behind
- Computes a SHA-256 checksum and writes a `.meta` sidecar file
- Records per-table row counts at backup time
- Auto-prunes its own old backups based on `BACKUP_RETAIN_COUNT` (default 10). The `pre-update-*.dump` files from `update.sh` are not counted or removed
- Writes dumps with mode `0600` in a `0700` `backups/` directory

### Container Detection

The script finds the PostgreSQL container in this order:

1. `DB_CONTAINER` (explicit override)
2. The `postgres` service of the Docker Compose project in the script's directory

Otherwise it uses the PostgreSQL client tools on the host and connects to `DB_HOST`:`DB_PORT`. It never picks a container by name or image, because a restore drops the database.

## Database Backup

### Create a Backup

```bash
./db-backup-restore.sh backup
```

Output is saved to `backups/<DB_NAME>_<TIMESTAMP>.dump` with a `.meta` file alongside it.

### Example Output

```text
── Full Database Backup ──
[INFO]  Connected to 'tma_cloud_storage' via Docker container 'tma-cloud-postgres'
[INFO]  Database   : tma_cloud_storage
[INFO]  Collecting table statistics …
[INFO]  Running pg_dump (custom format, serializable snapshot) …
[INFO]  Verifying backup integrity (pg_restore --list) …
[OK]    Backup contains 145 TOC entries.
[INFO]  Computing SHA-256 checksum …

── Backup Complete ──
[OK]    File       : backups/tma_cloud_storage_20260115T020000Z.dump
[OK]    Size       : 12M
[OK]    Duration   : 4s
[OK]    TOC entries: 145
[OK]    SHA-256    : a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
```

### Metadata File

Each backup has a `.meta` file with:

```text
timestamp=20260115T020000Z
database=tma_cloud_storage
user=postgres
mode=docker
format=custom
compression=--compress=6
toc_entries=145
file_size=12M
duration_seconds=4
sha256=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2

# Table row counts at backup time
public.users=5
public.files=218
public.audit_log=1340
pgboss.job_common=64
```

## Database Restore

### Restore from Backup

```bash
./db-backup-restore.sh restore backups/tma_cloud_storage_20260115T020000Z.dump
```

The restore process:

1. Validates the backup file (SHA-256 checksum + TOC inspection) before touching the database
2. Asks for confirmation by typing the database name
3. Stops the `app` and `worker` services when it runs against the Compose project, so nothing writes during the restore. With a host or `DB_CONTAINER` database, stop the API and the worker yourself first
4. Drops the database `WITH (FORCE)`, which ends any remaining connections, and creates it again
5. Restores in `--single-transaction` mode (atomic — rolls back entirely on error)
6. Runs `ANALYZE` to update query planner statistics
7. Reports table and row counts for verification
8. Clears the Redis cache of the Compose project with `FLUSHDB`, because cached rows from before the restore may no longer exist. Redis holds only cache entries and event messages. With a host or `DB_CONTAINER` database, run `FLUSHDB` yourself or wait 5 minutes for the entries to expire
9. Starts the services it stopped. After a failed restore they stay stopped, because the database is empty, and the script prints the command that starts them

The restored data opens only with the encryption key file from the time of the backup or a later one, since rotation keeps older key versions.

## Verify a Backup

```bash
./db-backup-restore.sh verify backups/tma_cloud_storage_20260115T020000Z.dump
```

Checks the SHA-256 checksum against the `.meta` file and inspects the dump TOC without restoring.

## List Backups

```bash
./db-backup-restore.sh list
```

Lists all `.dump` files in the `backups/` directory with file size and date.

## Configuration

The script reads these keys from `.env` in its directory (or the repository root for `scripts/db-backup-restore.sh`, or `TMA_DIR`). It reads them as plain values and never runs `.env` as a shell script. Variables already set in the environment take precedence. The password reaches `pg_dump` and `docker exec` through the environment, so it does not appear in the process list.

| Variable              | Default             | Description                                |
| --------------------- | ------------------- | ------------------------------------------ |
| `DB_HOST`             | `localhost`         | PostgreSQL host                            |
| `DB_PORT`             | `5432`              | PostgreSQL port                            |
| `DB_USER`             | `postgres`          | Database username                          |
| `DB_PASSWORD`         | -                   | Database password                          |
| `DB_NAME`             | `tma_cloud_storage` | Database name                              |
| `DB_CONTAINER`        | -                   | PostgreSQL container name                  |
| `REDIS_PASSWORD`      | -                   | Redis password, to clear the cache         |
| `REDIS_DB`            | `0`                 | Redis database the cache uses              |
| `BACKUP_RETAIN_COUNT` | `10`                | Backups to keep before pruning (1 or more) |

## File Backups

The backup script only covers the PostgreSQL database. It does **not** back up uploaded files or folders.

You must back up file storage separately:

### S3-compatible

Use your storage vendor's replication or snapshot tools. The application stores object keys in the database; the bucket holds the blobs. Both must be backed up together to stay in sync.

## Backup Schedule

Recommended cron schedule for automated backups:

```bash
# Daily database backup at 02:00 UTC
0 2 * * * cd /path/to/tma-cloud && ./db-backup-restore.sh backup >> /var/log/tma-backup.log 2>&1
```

## Related Topics

- [Database Schema](/docs/reference/database-schema) - Table structure
- [Environment Variables](/docs/reference/environment-variables) - Full variable reference
- [CLI Commands](/docs/reference/cli-commands) - All available commands
- [Storage Management](/docs/concepts/storage-management) - Storage overview
