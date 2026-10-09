---
title: 'Google Sign-In'
description: 'Let people sign in with their Google account.'
---

Let people sign in with their Google account (admin only). Google sign-in is not configured in `.env`; the first user enters the OAuth client in **Settings**. Until a client is saved, the login page shows no Google button and the Google routes answer `503`.

## Create the OAuth Client in Google Cloud

1. In the [Google Cloud console](https://console.cloud.google.com/apis/credentials), open **APIs & Services** → **Credentials**
2. Configure the OAuth consent screen if the project has none. TMA Cloud asks only for `openid`, `profile`, and `email`
3. Click **Create credentials** → **OAuth client ID** and choose **Web application**
4. Under **Authorized redirect URIs**, add the redirect URI that TMA Cloud shows in its settings, for example `https://cloud.example.com/api/google/callback`
5. Copy the client ID and the client secret. Google shows the secret only once

## Configuration

1. Navigate to **Settings** → **Administration**
2. Open **Google Sign-In** under **Integrations**
3. Check the **Authorized redirect URI**. It is filled in from the address the page was opened on, so open Settings through the public address users sign in on
4. Enter the **Client ID** and **Client secret**
5. Click **Check and save**

Every backend process re-reads the setting within 15 seconds; no restart is needed.

## What Is Checked

Before saving, TMA Cloud asks Google's token endpoint to redeem a code that does not exist. Google authenticates the client before it looks at the code, so a wrong client ID or secret is answered with `invalid_client` and nothing is saved. A valid client reaches the code check and is saved. No account and no consent is involved.

The redirect URI is held to the rules Google applies:

- `https://`, or `http://` only for `localhost`, `127.0.0.1`, or `[::1]`
- A domain name, not an IP address (loopback excepted)
- No user name, password, query string, or fragment
- The path is exactly `/api/google/callback`

The check cannot tell whether the redirect URI is registered for the client. If it is not, Google shows `redirect_uri_mismatch` on the first sign-in. Add the URI in Google Cloud and retry.

## How the Secret Is Stored

- The client secret is encrypted with AES-256-GCM under a subkey of the master key (`FILE_ENCRYPTION_KEY`), bound to the client ID, in `app_settings`
- It is never returned by the API or shown in Settings again. To keep it while changing the redirect URI, leave the secret field empty. Changing the client ID requires a new secret
- Each backend process keeps the decrypted secret in memory only, never in Redis or logs
- A master key rotation rewraps it like the bucket secret. See [Key Rotation](/docs/guides/operations/key-rotation)

Saves are compare-and-swap on a settings version, so a save from a stale browser tab is refused with `409` instead of overwriting a newer one.

## Turning It Off

Click **Turn off Google sign-in**. The client and its secret are deleted, the login page stops offering Google, and a sign-in already in progress fails at the callback. Accounts keep their link to their Google account, so saving the client again restores Google sign-in for them. Accounts that have a password can still sign in with it.

## Account Rules

- A Google account signs in to the TMA Cloud account it is linked to
- An unlinked Google account is linked to the TMA Cloud account with the same email, but only when Google reports the email as verified
- Otherwise a new account is created, only while signup is allowed. See [Signup Control](/docs/guides/admin/signup-control)
- Accounts with MFA must enter their code after Google sign-in

See [Authentication](/docs/concepts/authentication#google-oauth-optional) for the flow and its protections.

## Related Topics

- [Authentication API](/docs/api/authentication#google-oauth) - The sign-in endpoints
- [User API](/docs/api/users#google-sign-in-configuration) - The endpoints behind this setting
- [Authentication Issues](/docs/debugging/auth-issues) - Sign-in errors
