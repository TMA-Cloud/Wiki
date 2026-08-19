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

- The **Registered Users** list shows an `mfaEnabled` flag per user

### MFA Configuration

- Cannot enable MFA for users (user must do it)
- Cannot disable user MFA (user must do it)
- Monitor MFA usage

## User MFA Setup

### User-Initiated

- Users enable MFA themselves
- QR code generation
- Verification required before enabling
- Backup codes auto-download after MFA is enabled
- Backup codes are one-time use; regenerating invalidates prior codes

### MFA Disable

- Users can disable their own MFA
- Requires verification code
- Admin cannot disable user MFA

### Backup Codes

- Delivered as a downloadable text file on enable or regenerate
- File format includes application name, masked account email, generation date, and usage instructions
- File name: `mfa-backup-codes_TMA-Cloud_YYYY-MM-DD.txt`
- Each code is single-use. Codes are 8 characters drawn from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` and contain no dashes
- Ten codes, printed in numbered brackets and separated into groups of 5
- Regenerate to replace all existing codes
- Cooldown: 5 minutes between regenerations
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
