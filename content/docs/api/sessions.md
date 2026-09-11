---
title: 'Sessions API'
description: 'Session management endpoints for TMA Cloud.'
---

Session management endpoints for TMA Cloud.

## Get Sessions

### GET `/api/sessions`

Get all active sessions for the authenticated user.

Pass `refreshIp=true` to bypass the two-minute session-list cache. The Settings **Refresh** button uses this option.

**Response:**

```json
{
  "sessions": [
    {
      "id": "session_123",
      "user_id": "user_123",
      "token_version": 1,
      "user_agent": "Mozilla/5.0...",
      "ip_address": "192.168.1.1",
      "created_at": "2024-01-01T00:00:00Z",
      "last_activity": "2024-01-01T12:00:00Z",
      "is_online": true,
      "isCurrent": true
    }
  ]
}
```

- `ip_address` is the latest address observed for the session. A recent heartbeat takes precedence over the stored session address.
- `is_online` is `true` only when the server received a heartbeat for that session in the last three minutes.
- Browsers and desktop clients send a heartbeat every two minutes while signed in and visible. Hidden pages pause heartbeats and mark their presence offline; becoming visible starts it again. A normal page or window exit also sends an offline request.
- `isCurrent` marks the session used for the request.

## Session Presence

### POST `/api/sessions/heartbeat`

Record or refresh the current browser session's presence, IP, and last activity.

**Response:**

```json
{
  "ok": true
}
```

### POST `/api/sessions/offline`

Remove the current session's presence heartbeat without revoking the session. The client sends this request when its page or window exits.

**Response:**

```json
{
  "ok": true
}
```

## Revoke Session

### DELETE `/api/sessions/:sessionId`

Revoke a specific session.

When a session is revoked, its matching presence entries are removed from `client_heartbeats`.

**Response:**

```json
{
  "message": "Session revoked successfully"
}
```

## Revoke Other Sessions

### POST `/api/sessions/revoke-others`

Revoke all other active sessions except the current one.

This also removes other presence entries for the same user.

**Response:**

```json
{
  "message": "Other sessions revoked successfully",
  "deletedCount": 3
}
```

## Related Topics

- [Authentication](/docs/api/authentication) - Authentication endpoints
- [Authentication Concepts](/docs/concepts/authentication) - Authentication overview
