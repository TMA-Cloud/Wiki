---
title: 'Key Rotation'
description: 'Rotate the master encryption key and the database and Redis passwords.'
---

Rotate the master encryption key and the database and Redis passwords.

## Overview

| What                                   | Docker install       | Manual install                   |
| -------------------------------------- | -------------------- | -------------------------------- |
| Master key (`FILE_ENCRYPTION_KEY`)     | `./rotate.sh key`    | `npm run rotate -- key`, restart |
| Database password (`DB_PASSWORD`)      | `./rotate.sh db`     | `npm run rotate -- db-password`  |
| Redis password (`REDIS_PASSWORD`)      | `./rotate.sh redis`  | Change it in Redis and `.env`    |
| All three, with one restart            | `./rotate.sh all`    | -                                |
| Key versions and file keys per version | `./rotate.sh status` | `npm run rotate -- status`       |

Every new value is random: a 32-byte key in base64 for the master key, and 32 bytes in hex for the passwords.

## Docker Install

`setup.sh` puts `rotate.sh` in the install directory. Run it there, with the stack running:

```bash
cd tma-cloud
./rotate.sh key
```

Without a local copy:

```bash
curl -fsSL https://raw.githubusercontent.com/TMA-Cloud/TMA/main/rotate.sh | bash -s -- key
```

Set `TMA_DIR` to run it from another directory.

What it does:

1. Copies `.env` and `secrets/file_encryption_key` to `.rotate-backup/`
2. **key:** Adds the next key version to `secrets/file_encryption_key` and keeps the older lines. The new version is above every version in the file and every version in the `kek_checks` table, so a number left by an earlier failed attempt is never reused
3. **db:** Has the app change its own database role's password, then writes the new `DB_PASSWORD` to `.env`
4. **redis:** Writes the new `REDIS_PASSWORD` to `.env`
5. Recreates the containers that use the changed files and waits until they are healthy
6. **key:** Rewraps the stored file keys and the bucket secret under the new version
7. Deletes `.rotate-backup/`. A run that stops before it changes anything deletes it too

The containers restart once, so the app is unavailable for a few seconds. Sessions are kept: Redis keeps its data, and sign-in tokens do not depend on these values.

After a key rotation, back up `secrets/file_encryption_key` again. See [Backups](/docs/guides/operations/backups#encryption-key).

## Manual Install

From the **backend** directory:

```bash
npm run rotate -- key
```

This adds the next key version to the file named by `FILE_ENCRYPTION_KEY_FILE`, or to `FILE_ENCRYPTION_KEY` in `.env`. Restart the API, then the worker. The worker rewraps the stored file keys when it starts. To rewrap at once and see the result:

```bash
npm run rotate -- rewrap
```

```bash
npm run rotate -- db-password
```

This changes the password of the database role in `DB_USER` and saves it as `DB_PASSWORD` in `.env`. Restart the API and the worker right after: connections opened with the old password keep working, new ones need the new password.

The script does not change the Redis password, because a Redis server outside Docker keeps it in its own configuration file. Redis accepts several passwords per user, so it can be changed without failed connections:

1. Add the new password: `ACL SETUSER default >new-password`
2. Set `REDIS_PASSWORD` in `.env` and restart the API and the worker
3. Remove the old password: `ACL SETUSER default <old-password`
4. Set the new password as `requirepass` in the Redis configuration file, so a Redis restart keeps it

## Master Key

The master key wraps each file's data key and the stored bucket secret. Rotating it rewraps those small values, one database update per file. Objects in the bucket are never read or rewritten.

The key file is a keyring with one `version:key` entry per line:

```text
# TMA Cloud file encryption keys, one "version:key" per line.
# The highest version encrypts new data. Older lines decrypt data not yet
# rewrapped and data in older backups, so keep them with those backups.
1:<base64 key, version 1>
2:<base64 key, version 2>
```

- The highest version encrypts new files. Lower versions only decrypt.
- A key without a version prefix is version 1, so a single key from `npm run key:generate` works as is.
- In `.env`, entries are separated by commas: `FILE_ENCRYPTION_KEY=1:<key>,2:<key>`.
- Older versions may be passphrases, so a passphrase key can be replaced by a random one with the same rotation. The newest key must be a random 32-byte key in production.

Rewrapping is safe to interrupt and to run again: only file keys under an older version are changed, and two runs at once do not conflict. Trashed files are included, so they still open after a restore.

### Old Key Versions

Rotation keeps the older lines. A database backup taken before the rotation still holds file keys wrapped under them, so removing a line makes that backup unreadable.

`status` lists the versions that no current data uses:

```text
Master key versions: 1, 2
Newest (encrypts new files): 2
  version 2: 394 file key(s)
Bucket secret: version 2
All keys are current.
Not used by current data: version 1. Database backups from before a rotation still need them, so remove a line only once you no longer keep those backups.
```

Remove a line only when no kept backup needs it. If a version that stored data uses is removed, the server refuses to start with `Stored data is encrypted under key version <n>, which FILE_ENCRYPTION_KEY does not contain`.

If the old key leaked, rotate, check that `status` reports `All keys are current.`, then remove the leaked line. Backups from before the rotation can then only be read with that key, kept apart from the server.

## If a Rotation Fails

- **Nothing was changed yet** (for example, a line in the key file is not `version:key`, or the database refused the new password): the script stops and leaves no backup or temporary files. Fix the cause and run it again.
- **The app does not become healthy after a key rotation:** The key file keeps the new version. Do not remove it: it still holds every older key, and the worker may already have wrapped file keys under the new version. The previous key file stays in `.rotate-backup/`. Check `docker compose logs app`, fix the cause, and run `docker compose up -d`.
- **The containers do not become healthy after a db or redis rotation:** The previous `.env` stays in `.rotate-backup/`. Check `docker compose logs app`.
- **`.rotate-backup/` is left:** `rotate.sh` does not run again until that folder is removed, so the files in it are not overwritten. Remove it once the stack works.
- **Some file keys are not rewrapped:** They still open with their old version, and the worker tries again when it starts. Run `./rotate.sh status` and fix the cause shown in the output. To rewrap at once: `docker compose exec app node backend/scripts/rotate.js rewrap`.

## Related Topics

- [Backups](/docs/guides/operations/backups) - Backing up the key file
- [Security Model](/docs/concepts/security-model#key-check) - How keys are checked at startup
- [Environment Variables](/docs/reference/environment-variables#file-storage) - Key variables
