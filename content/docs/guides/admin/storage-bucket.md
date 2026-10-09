---
title: 'Storage Bucket'
description: 'Connect the S3-compatible bucket that stores file contents.'
---

Connect the S3-compatible bucket that stores file contents (admin only).

## Why This Setting Is Required

File contents are stored in an S3-compatible bucket. The bucket is not configured in `.env`; the first user enters it in **Settings**. Until a bucket is saved:

- Uploads, downloads, ZIP downloads, and OnlyOffice file requests return `503` with the code `STORAGE_NOT_CONFIGURED`.
- The first user sees a banner with a **Set up storage** button. Other users see a banner asking them to contact the administrator.

Sign-in, signup, and folder listings work without a bucket.

## Supported Providers

| Provider            | Endpoint                                                  | Region                 | Addressing            |
| ------------------- | --------------------------------------------------------- | ---------------------- | --------------------- |
| Cloudflare R2       | Built from the account ID and jurisdiction                | Always `auto`          | Virtual-hosted        |
| Amazon S3           | Optional; defaults to `https://s3.<region>.amazonaws.com` | Required               | Virtual-hosted        |
| Other S3-compatible | Required (RustFS, MinIO, Ceph, and similar)               | Optional (`us-east-1`) | Path-style by default |

## Configuration

1. Create a private bucket and an access key that is limited to that bucket. The key needs list, read, write, and delete permission on objects.
2. Navigate to **Settings** → **Storage**
3. Open **Storage bucket** under **Bucket**
4. Select the provider and enter its fields:
   - **Cloudflare R2:** account ID (32 characters, shown on the R2 overview page) and jurisdiction (Default, European Union, or FedRAMP)
   - **Amazon S3:** region, and an endpoint only if you use a non-standard one
   - **Other S3-compatible:** endpoint URL, optional region, and **Path-style addressing** (leave it on for RustFS and MinIO unless they serve buckets on subdomains)
5. Enter the bucket name, access key ID, and secret access key
6. Click **Test connection** to run the checks without saving, or **Save** to run them and save

The setting applies to the API and the background worker without a restart. Each process re-reads it within 15 seconds.

## Connection Checks

**Save** stores nothing unless every check passes. **Test connection** runs the same checks.

| Check               | What it does                                                                   |
| ------------------- | ------------------------------------------------------------------------------ |
| Reach the bucket    | `HeadBucket` on the bucket                                                     |
| List objects        | `ListObjectsV2` with one key                                                   |
| Write an object     | Writes a 32-byte object under `.tma-cloud-probe/`                              |
| Read it back        | Reads the object and compares the bytes                                        |
| Delete it           | Deletes the object, also when the read fails                                   |
| Find existing files | Only when files exist: at least one of the 5 newest stored files must be found |

The last check stops a save that points at an empty or wrong bucket, which would make every existing file unreadable. To move to another bucket, copy the objects first, then change the setting.

A failed check is shown with its name and a reason, for example `Reach the bucket failed: Bucket "files" was not found at this endpoint`. Provider error text is not shown.

## Endpoint Rules

- The endpoint is reduced to scheme, host, and port. A path, query string, fragment, or credentials in the URL are rejected.
- `https://` is required for public hosts. `http://` is accepted only for loopback, private (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `100.64.0.0/10`, IPv6 ULA), single-label hosts such as a Docker service name, and names ending in `.local`, `.internal`, `.lan`, `.home.arpa`, or `.localhost`.
- Link-local addresses, including the cloud metadata address `169.254.169.254`, are rejected.
- Bucket names follow the S3 rules: 3-63 lowercase letters, numbers, dots, or hyphens, starting and ending with a letter or number.

## Credentials

- The secret access key is encrypted with AES-256-GCM before it is stored. The key is derived from `FILE_ENCRYPTION_KEY` with HKDF, and the ciphertext is bound to the access key ID. See [Security Model](/docs/concepts/security-model#bucket-credentials).
- The secret is never returned by the API. The access key ID is shown masked, for example `AKIA••••MPLE`.
- When editing, leave both key fields blank to keep the saved keys. A new access key ID needs its secret.
- `rotate-kek.js` re-encrypts the stored secret under a new `FILE_ENCRYPTION_KEY`. See [CLI Commands](/docs/reference/cli-commands#rotate-file_encryption_key-kek).

## Concurrent Edits

Each save increments a version number. A save sent from a page that loaded an older version returns `409` instead of replacing the newer settings. Reload and try again.

## Related Topics

- [Storage Management](/docs/concepts/storage-management) - How files use the bucket
- [Users API](/docs/api/users#storage-bucket-configuration) - Storage bucket endpoints
- [CLI Commands](/docs/reference/cli-commands) - Bucket protection scripts
