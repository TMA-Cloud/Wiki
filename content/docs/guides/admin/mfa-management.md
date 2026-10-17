---
title: 'MFA Management'
description: 'Manage multi-factor authentication in TMA Cloud (admin only).'
---

Manage multi-factor authentication in TMA Cloud (admin only).

## MFA Overview

### TOTP-Based MFA

- Time-based One-Time Password
- QR code setup
- Optional per-user

## Admin Capabilities

### View MFA Status

- The **Registered users** list shows each user's MFA status, and above it how many users have MFA on and off and the adoption percentage

### MFA Configuration

- Cannot enable MFA for users (user must do it)
- Cannot disable user MFA (user must do it)
- Monitor MFA usage

## User MFA Setup

### User-Initiated

- Users enable MFA themselves in **Settings** → **Security** → **Two-factor authentication** → **Manage**
- QR code generation, with the secret shown for manual entry and a copy button
- Verification with a 6-digit code required before enabling
- Backup codes are shown after MFA is enabled. The browser downloads them as a text file at once; the desktop app offers **Save as file**, and **Copy all** copies them
- After MFA is turned on or off, the app offers to sign out every other session
- Backup codes are one-time use; regenerating invalidates prior codes

### MFA Disable

- Users can disable their own MFA
- Requires a 6-digit code or an unused backup code (dashes typed for readability are ignored)
- Admin cannot disable user MFA

### Backup Codes

- Delivered as a downloadable text file on enable or regenerate
- File format includes application name, masked account email, generation date, and usage instructions
- File name: `mfa-backup-codes_TMA-Cloud_YYYY-MM-DD.txt`
- Each code is single-use. Codes are 8 characters drawn from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` and contain no dashes
- Ten codes, printed in numbered brackets and separated into groups of 5
- Regenerate to replace all existing codes. The app asks for confirmation first
- Cooldown: 5 minutes between regenerations; the button shows the time left
- Rate limit: 3 attempts per 10 minutes

## Best Practices

- Encourage MFA adoption
- Monitor MFA usage
- Provide support for setup
- Document MFA benefits

## Security Considerations

- MFA significantly improves security
- Recommended for all users
- Especially important for admins
- Protects against password theft

## Related Topics

- [User Management](/docs/guides/admin/user-management) - Manage users
- [Authentication](/docs/concepts/authentication) - Authentication system
- [Security Model](/docs/concepts/security-model) - Security overview
