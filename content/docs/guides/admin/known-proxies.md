---
title: 'Known Proxies'
description: 'Configure reverse proxies that may supply client IP headers.'
---

Configure reverse proxies that may supply client IP headers (admin only).

## Why This Setting Is Required

The backend uses the socket address unless the connecting proxy is trusted. Without this setting, sessions, audit records, metrics checks, and anonymous rate limits see the reverse proxy IP instead of the client IP.

Trusting every proxy would let a direct client forge `X-Forwarded-For`. The server therefore accepts forwarded headers only when the immediate connection comes from a configured address.

## Configuration

1. Navigate to **Settings** → **Administration**
2. Open **Known Proxies** under **Networking**
3. Enter a comma-separated list of proxy IP addresses, CIDR ranges, or hostnames
4. Click **Save Settings**
5. Restart the backend server or container

Examples:

```text
10.1.2.100, 172.18.0.0/16, proxy.example.com
```

An empty list disables forwarded client IP handling.

## Choosing Entries

- Enter the address of nginx, Traefik, Cloudflare Tunnel, or the load balancer that connects to the backend. Do not enter client addresses.
- If the session screen currently shows an address such as `::ffff:10.1.2.100` for every user, the proxy IPv4 address is `10.1.2.100`.
- Add every proxy in a multi-proxy chain.
- Prefer exact IP addresses. Use a CIDR range only when proxy addresses cannot be kept stable.
- Hostnames are resolved when the backend starts. A hostname that cannot be resolved is not trusted.

The reverse proxy must also send the forwarding headers. For nginx:

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Host $host;
```

## Verify the Result

After restarting, sign in through the reverse proxy and open **Settings** → **Security** → **Active Sessions**, then click **Refresh**. The IP should be the client address. Authenticated requests and heartbeats update an existing session's stored IP, so an online device does not need to sign in again.

## Related Topics

- [Rate Limits](/docs/reference/rate-limits) - Limits that use the client IP
- [Authentication Issues](/docs/debugging/auth-issues) - Session troubleshooting
- [Monitoring](/docs/guides/operations/monitoring) - Metrics address checks
