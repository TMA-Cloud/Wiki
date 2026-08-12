---
title: "Authentication"
description: "Authentication system overview for TMA Cloud."
---

Authentication system overview for TMA Cloud.

## Authentication Methods

TMA Cloud supports multiple authentication methods:

### Email/Password Authentication

- Secure password hashing with bcrypt
- JWT token-based sessions
- httpOnly cookies for token storage

### Google OAuth (Optional)

- OAuth 2.0 integration
- Automatic account creation
- Linked to email/password accounts

### Multi-Factor Authentication (MFA)

- TOTP-based (Time-based One-Time Password)
- QR code setup
- Optional per-user
- Backup codes as fallback (single-use, replaceable)

## Session Management

### Token Structure

- JWT tokens with expiration
- Token versioning for revocation
- Session ID bound to the token, so single sessions can be revoked

### Session Lifetime

Sessions expire after a period of **inactivity**, not a fixed period after login.

- Tokens are issued for the idle window, 30 days by default (`SESSION_IDLE_DAYS`)
- While the user is active, the token is re-issued before it runs out, so an active user is not logged out mid-use
- `sessions.last_activity` is updated on each authenticated request and is what the idle check reads
- After the idle window passes with no requests, the session ends and the user logs in again

Set `SESSION_IDLE_DAYS` to change the window. See [Environment Variables](/docs/reference/environment-variables).

### Active Sessions

- View all active sessions
- Revoke individual sessions
- Logout from all devices
- Session activity tracking

## Security Features

- **Token Versioning:** Invalidate all tokens on logout-all
- **Rate Limiting:** 25 login/signup attempts per 15 minutes per IP/email; MFA verify/disable 5 attempts per minute; backup code regeneration 3 attempts per 10 minutes with 5-minute cooldown
- **Audit Logging:** All authentication events logged
- **Password Change:** When enabled, users can change their own password from Settings → Security and password change will invalidate all active sessions

## Sub-user Logins

Sub-users authenticate the same way as any other account: their own email and password, their own MFA, and their own sessions. Logging out or changing the password on one login does not affect the others on the same account.

What differs is what the login can reach — see [Authorization](/docs/concepts/authorization).

## First User Privileges

The first user to sign up becomes the administrator with full system access.

## Signup Control

Administrators can enable/disable user registration:

- When enabled: Anyone can create an account
- When disabled: Only admins can create accounts

## Related Topics

- [Authorization](/docs/concepts/authorization) - Access control and permissions
- [Sub-users](/docs/guides/user/sub-users) - Extra logins on one account
- [Security Model](/docs/concepts/security-model) - Overall security architecture
- [API: Authentication](/docs/api/authentication) - API endpoints
