---
title: 'Authentication Issues'
description: 'Fix sign-in, two-factor, session and sub-user permission problems.'
---

Fix sign-in, two-factor, session and sub-user permission problems.

## Login Problems

### Cannot Login

**Check:**

1. The email and password are correct; the server answers "Invalid credentials" for both a wrong password and an unknown email
2. For a new account, **Allow sign-up** is on
3. Check for rate limiting (25 attempts per 15 minutes per IP and email). Failed logins are also limited to 100 per 15 minutes per IP and 20 per 15 minutes per account; the second can be reached by someone else trying the same email, and clears after 15 minutes
4. For MFA: verify/disable limited to 5 attempts per minute

### MFA Issues

**Problems:**

- Two-factor code not accepted
- Cannot turn two-factor authentication off

**Solutions:**

1. Verify time sync on device. TOTP accepts only the current 30-second step and the one before it, so a device clock more than about a minute off will fail every code
2. Each code can be used once. Re-entering a code that just worked is rejected as a replay, which looks identical to a wrong code
3. Without the authenticator app or a backup code, nobody can turn it off for you: the admin cannot disable another user's two-factor authentication
4. Backup codes are 8 characters and contain no dashes. The login and MFA-disable fields strip any dashes you type, so `ABCD-EFGH` and `ABCDEFGH` both work in the app but a direct API call is compared as sent, so send the code without separators
5. A backup code works once. Check the remaining count under **Settings** → **Security**; regenerating replaces all ten and invalidates the old set
6. If rate-limited, wait one minute and retry

### Password Rejected When Setting It

New passwords must be 8–128 characters and at most 72 bytes. Letters outside ASCII (accented letters, emoji, other scripts) take 2–4 bytes each, so a password under 72 characters can still exceed the limit. The form shows the reason before sending.

## Session Issues

### Sessions Not Persisting

**Check:**

1. The browser accepts cookies for the site
2. The site is served over HTTPS. In production the session cookie has the `Secure` flag, so a browser on plain HTTP drops it. For a test install on HTTP, set `FORCE_INSECURE_COOKIES=true`
3. The `token` cookie appears in the browser's developer tools after signing in

### Users Logged Out Unexpectedly

Sessions end after the session timeout passes without activity (30 days by default), and the token is re-issued while the user is active, so an active user should not be logged out mid-use. When it happens anyway:

1. **Check Known Proxies.** Behind a reverse proxy that is not listed under **Settings** → **Administration** → **Known proxies**, every request looks like it came from the proxy, so all users share one rate-limit bucket. Once it is exhausted the API returns `429`. Restart the server after changing the list. See [Known Proxies](/docs/guides/admin/known-proxies).
2. **Check for `429` in the backend logs.** Rate-limited responses are not authentication failures, but they interrupt the session.
3. **Check whether someone changed the password or used Logout All.** Both increment `token_version` and end every session for that login. On a shared login this affects everyone using it — giving each person their own [sub-user](/docs/guides/user/sub-users) avoids it.
4. **Check backend availability.** The frontend retries a failed profile check a few times before giving up, but a backend that stays unreachable ends with the login screen.
5. **Check the session timeout** under **Settings** → **Administration** → **Session timeout**. A short value ends idle sessions sooner, and lowering it ends sessions already idle longer than the new value. See [Session Timeout and Recently Opened](/docs/guides/admin/sessions-and-activity).

Query recent session-related events:

```sql
SELECT created_at, actor_email, action, status
FROM audit_activity
WHERE action IN ('auth.login', 'auth.logout', 'auth.logout_all', 'auth.password_change')
ORDER BY created_at DESC
LIMIT 50;
```

### Logout Issues

**Problems:**

- A device stays signed in after signing out elsewhere

**Solutions:**

1. Use **Sign out everywhere** in **Settings** → **Security**, which ends every session of that login
2. To end one device, click **View sessions** under **Settings** → **Security**, then **Sign out** on its row

## Token Issues

### Token Expired

**Solutions:**

1. Sign in again
2. Check the session timeout in **Settings** → **Administration**. The token lives for that window and is renewed on activity

## Permission Issues

### Sub-user Cannot Perform an Action

A sub-user only has the permissions its account owner granted. Actions it lacks are hidden from the interface; if the request is made anyway the server responds `403` with a message naming the missing permission.

**Solutions:**

1. Ask the account owner to review **Settings** → **Sub-users**, open the sub-user's permission summary and tick the permission
2. Check `account.permission_denied` events in the audit log to see exactly which permission was refused
3. Changes apply on the next request — no need to log in again

### Sub-user Cannot Reach Sub-user Settings

Only account owners can manage sub-users. A sub-user receives `403 Only the account owner can perform this action.` and does not see the section in Settings. This is expected — sub-users cannot create sub-users.

### Invalid Token

**Solutions:**

1. Sign in again
2. If every user is signed out at once, check whether `JWT_SECRET` changed. A new secret ends every session

## Related Topics

- [Common Errors](/docs/debugging/common-errors) - General troubleshooting
- [Authentication API](/docs/api/authentication) - API endpoints
- [Authentication Concepts](/docs/concepts/authentication) - How auth works
- [Authorization](/docs/concepts/authorization) - Accounts and permissions
