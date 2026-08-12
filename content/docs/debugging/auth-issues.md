---
title: "Authentication Issues"
description: "Troubleshooting authentication problems."
---

Troubleshooting authentication problems.

## Login Problems

### Cannot Login

**Check:**

1. Verify email and password are correct
2. Check if account exists
3. Verify signup is enabled (if creating new account)
4. Check for rate limiting (25 attempts per 15 minutes per IP and email)
5. For MFA: verify/disable limited to 5 attempts per minute

### MFA Issues

**Problems:**

- MFA code not working
- QR code not displaying
- Cannot disable MFA

**Solutions:**

1. Verify time sync on device (TOTP requires accurate time)
2. Check MFA secret is correct
3. Ensure MFA is properly enabled after setup
4. Contact admin if MFA needs to be reset (admin cannot disable user MFA)
5. If using backup codes, dashes are optional (ABCD-EFGH can be typed as ABCDEFGH)
6. If rate-limited, wait one minute and retry

## Session Issues

### Sessions Not Persisting

**Check:**

1. Verify cookies are enabled
2. Check `httpOnly` cookie settings
3. Verify JWT token is being set
4. Check browser console for errors

### Users Logged Out Unexpectedly

Sessions end after `SESSION_IDLE_DAYS` of inactivity (30 by default), and the token is re-issued while the user is active, so an active user should not be logged out mid-use. When it happens anyway:

1. **Check `TRUST_PROXY`.** Behind a reverse proxy without it, every request looks like it came from the proxy, so all users share one rate-limit bucket. Once it is exhausted the API returns `429`. See [Environment Variables](/docs/reference/environment-variables).
2. **Check for `429` in the backend logs.** Rate-limited responses are not authentication failures, but they interrupt the session.
3. **Check whether someone changed the password or used Logout All.** Both increment `token_version` and end every session for that login. On a shared login this affects everyone using it — giving each person their own [sub-user](/docs/guides/user/sub-users) avoids it.
4. **Check backend availability.** The frontend retries a failed profile check a few times before giving up, but a backend that stays unreachable ends with the login screen.
5. **Check `SESSION_IDLE_DAYS`.** A short value expires idle sessions sooner.

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

- Cannot logout
- Sessions not revoking

**Solutions:**

1. Clear browser cookies
2. Use "Logout All" option
3. Check session management endpoint

## Token Issues

### Token Expired

**Solutions:**

1. Login again to get new token
2. Check `SESSION_IDLE_DAYS` — the token lives for that window and is renewed on activity
3. Verify system time is correct

## Permission Issues

### Sub-user Cannot Perform an Action

A sub-user only has the permissions its account owner granted. Actions it lacks are hidden from the interface; if the request is made anyway the server responds `403` with a message naming the missing permission.

**Solutions:**

1. Ask the account owner to review **Settings** → **Sub-users** → **Manage sub-users** and tick the permission
2. Check `account.permission_denied` events in the audit log to see exactly which permission was refused
3. Changes apply on the next request — no need to log in again

### Sub-user Cannot Reach Sub-user Settings

Only account owners can manage sub-users. A sub-user receives `403 Only the account owner can perform this action.` and does not see the section in Settings. This is expected — sub-users cannot create sub-users.

### Invalid Token

**Solutions:**

1. Clear cookies and login again
2. Check JWT_SECRET is set correctly
3. Verify token format

## Related Topics

- [Common Errors](/docs/debugging/common-errors) - General troubleshooting
- [Authentication API](/docs/api/authentication) - API endpoints
- [Authentication Concepts](/docs/concepts/authentication) - How auth works
- [Authorization](/docs/concepts/authorization) - Accounts and permissions
