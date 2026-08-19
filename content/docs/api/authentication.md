---
title: 'Authentication API'
description: 'Authentication endpoints for TMA Cloud.'
---

Authentication endpoints for TMA Cloud.

## Signup

### POST `/api/signup`

Create a new user account. This endpoint respects the server's signup enabled/disabled setting.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "User Name"
}
```

**Validation:**

- `email`: Must be a valid email format and not exceed 254 characters.
- `password`: Must be between 8 and 128 characters.
- `name`: Optional. Must not exceed 100 characters.

**Response:**

The user object for the created account.

```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

**Note:** The JWT token is set as an httpOnly cookie named `token`.

**Rate limiting:** 25 attempts per 15 minutes per IP/email.

## Login

### POST `/api/login`

Authenticate a user and receive a JWT token. If MFA is enabled for the user, `mfaCode` is required.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "mfaCode": "123456" // Optional, required if MFA enabled
}
```

**Validation:**

- `email`: Must be a valid email format.
- `password`: Must not exceed 128 characters.

**Response:**

The authenticated user's object, including `isSubUser` and the login's `permissions` (same meaning as in [Profile](#profile)).

```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "User Name",
    "isSubUser": false,
    "permissions": ["files.download", "files.upload"]
  }
}
```

**Note:** The JWT token is set as an httpOnly cookie named `token`.

**Note:** Sub-users log in through this endpoint like any other account.

**Rate limiting:** 25 attempts per 15 minutes per IP/email.

## Logout

### POST `/api/logout`

Log out the current user by clearing the authentication token cookie.

**Response:**

```json
{
  "message": "Logged out"
}
```

**Rate limiting:** General API limit (10000 per 15 minutes per IP).

### POST `/api/logout-all`

Log out from all devices by invalidating all of the user's active sessions and tokens.

**Response:**

```json
{
  "message": "Successfully logged out from all devices",
  "sessionsInvalidated": true
}
```

**Rate limiting:** General API limit (10000 per 15 minutes per IP).

## Change Password

### POST `/api/change-password`

Change the current authenticated user's password.

This endpoint:

- Requires authentication.
- Is only available when password change is enabled by the first user (admin).
- Only works for accounts that have a local email/password (not Google-only accounts).
- Requires **recent** authentication: the session must have been created within the last 10 minutes. An older session is rejected with `403` and the user has to log in again first.
- Requires a valid MFA or backup code in `mfaCode` when MFA is enabled on the account, regardless of session age.

**Request Body:**

```json
{
  "oldPassword": "current-password",
  "newPassword": "new-password",
  "mfaCode": "123456"
}
```

**Validation:**

- `oldPassword`: Required. String, 1–128 characters.
- `newPassword`: Required. String, 8–128 characters. Must be different from `oldPassword`.
- `mfaCode`: Optional at the schema level, 6–20 characters. Required by the handler when the account has MFA enabled. Accepts a 6-digit TOTP code or an 8-character backup code.

**Response (success):**

```json
{
  "message": "Password changed successfully, Please log in again!"
}
```

On success, all existing sessions and tokens are invalidated. The user must log in again with the new password.

**Error cases:**

- `401 Not authenticated`
- `403 Password change is currently disabled by the administrator`
- `403 For your security, please log in again before changing your password.`
- `400 MFA verification code is required to change your password.`
- `401 Invalid MFA code.`
- `400 Current password is incorrect`
- `400 New password must be different from the current password`
- `400 Password change is not available for this account` [Accounts created with Google]

Failed attempts are recorded as `auth.password_change` audit events with a `reason` in the metadata.

**Rate limiting:** Auth rate limit (same as login/signup: 25 attempts per 15 minutes per IP/email).

## Profile

### GET `/api/profile`

Get the current authenticated user's profile, including what this login is allowed to do.

**Response:**

```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "User Name",
  "mfaEnabled": false,
  "createdAt": "2024-01-01T00:00:00Z",
  "isSubUser": false,
  "permissions": [
    "files.download",
    "files.upload",
    "files.edit",
    "files.share",
    "files.delete",
    "files.trash"
  ]
}
```

**Fields:**

- `isSubUser`: `true` when this login belongs to another account.
- `permissions`: What this login may do. Owners receive the full set; sub-users receive only what was granted. See [Authorization](/docs/concepts/authorization).

**Rate limiting:** General API limit (10000 per 15 minutes, per user when authenticated).

## Google OAuth

### GET `/api/google/enabled`

Check if Google OAuth is configured and enabled on the server.

**Response:**

```json
{
  "enabled": true
}
```

### GET `/api/google/login`

Initiate the Google OAuth login flow. This will redirect the user to Google's authentication page.

### GET `/api/google/callback`

The callback endpoint for Google to redirect to after successful authentication.

**Rate limiting:** 25 attempts per 15 minutes per IP/email.

## Multi-Factor Authentication

### GET `/api/mfa/status`

Get the MFA status for the current authenticated user.

**Response:**

```json
{
  "enabled": false
}
```

**Rate limiting:** General API limit (10000 per 15 minutes per IP).

### POST `/api/mfa/setup`

Generate an MFA secret and a corresponding QR code for setup in an authenticator app.

**Response:**

```json
{
  "secret": "MFA_SECRET_IN_BASE32",
  "qrCode": "data:image/png;base64,..."
}
```

**Rate limiting:** General API limit (10000 per 15 minutes per IP).

### POST `/api/mfa/verify`

Verify an MFA code (TOTP) and enable MFA for the user's account.

**Request Body:**

```json
{
  "code": "123456"
}
```

**Validation:**

- `code`: Required. Must be a 6-digit TOTP string. Anything else is rejected as an invalid code.

Only valid during enrolment. If MFA is already enabled the request returns `400 MFA is already enabled`, so a replayed code cannot mint a second batch of backup codes.

**Response:**

Returns a success message, a set of 10 backup codes, and a flag to prompt the user to sign out other sessions.

```json
{
  "message": "MFA enabled successfully",
  "backupCodes": ["K7RM2PXQ", "H4TCVB9D"],
  "shouldPromptSessions": true
}
```

**Error cases:**

- `400 MFA not set up. Please set up MFA first.`
- `400 MFA is already enabled`
- `400 Invalid verification code`

**Rate limiting:** 5 attempts per minute per IP/user.

### POST `/api/mfa/disable`

Disable MFA for the user's account. Requires a valid MFA code (either TOTP or a backup code).

**Request Body:**

```json
{
  "code": "123456"
}
```

**Validation:**

- `code`: Required. Must be a 6-digit TOTP string or an 8-character backup code. The TOTP check runs first; a code that is not six digits falls through to the backup-code check.

**Response:**

```json
{
  "message": "MFA disabled successfully",
  "shouldPromptSessions": true
}
```

**Rate limiting:** 5 attempts per minute per IP/user.

### POST `/api/mfa/backup-codes/regenerate`

Regenerate MFA backup codes, which invalidates all existing backup codes. Returns 10 fresh codes. The delete and insert share one transaction, so a failure part-way leaves the previous codes usable.

**Response:**

```json
{
  "backupCodes": ["K7RM2PXQ", "H4TCVB9D"]
}
```

**Backup code format:** 8 characters drawn from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` — uppercase letters and digits with the ambiguous `0 O 1 I L` removed. The web UI strips dashes from its MFA input fields, so a user may type `ABCD-EFGH`, but an API client must send `ABCDEFGH`.

**Error Response (429 Too Many Requests):**

When the cooldown is active or the rate limit is exceeded:

```json
{
  "message": "Please wait 3 minutes and 45 seconds before regenerating backup codes again",
  "retryAfterMs": 225000
}
```

**Rate limiting:** 3 attempts per 10 minutes per user.

**Cooldown:** A 5-minute cooldown period is enforced between regeneration attempts.

**Note:** Backup codes are automatically downloaded on the client after regeneration.

### GET `/api/mfa/backup-codes/count`

Get the number of remaining unused backup codes for the user.

**Response:**

```json
{
  "count": 7
}
```

**Rate limiting:** General API limit (10000 per 15 minutes per IP).

## Related Topics

- [Sessions](/docs/api/sessions) - Session management
- [Authentication Concepts](/docs/concepts/authentication) - Authentication overview
