---
title: 'Privacy Policy'
description: 'What data this documentation site and the TMA Cloud software collect, and who controls it.'
---

**Effective date:** October 1, 2026

This policy explains what personal data is handled when you visit the TMA Cloud documentation site at [tma-cloud.github.io/Wiki](https://tma-cloud.github.io/Wiki/) (the "Site"), and how that relates to the TMA Cloud software you install on your own servers.

The short version: the Site does not use cookies, analytics, advertising, accounts, or forms, and the TMA Cloud project does not receive data from the instances you run.

## Who is responsible

The Site and the TMA Cloud software are maintained by the TMA Cloud project, an open-source project on GitHub at [github.com/TMA-Cloud](https://github.com/TMA-Cloud). For questions about this policy, open an issue in the [Wiki repository](https://github.com/TMA-Cloud/Wiki/issues). Do not post personal data in a public issue; ask for a private contact channel instead.

## Scope

This policy covers two things:

1. **The Site.** The documentation pages, search, changelog, and embedded videos.
2. **The TMA Cloud software.** Only as far as the software sends anything to the TMA Cloud project or to other third parties by default. What happens to data inside a TMA Cloud instance is covered in [Self-hosted instances](#self-hosted-instances) below.

## Data the Site collects

The Site is a static website. It has no server-side code of its own, and:

- It does not set cookies.
- It does not use analytics, tracking pixels, fingerprinting, or advertising.
- It has no sign-up, login, comment, or contact forms.
- Fonts, images, and scripts are served from the Site itself, not from font or script CDNs.

### Search

The search box downloads a search index from the Site and runs queries in your browser. Your search terms are not sent anywhere.

### Browser storage

The Site saves your light/dark theme choice in your browser's `localStorage` under the key `theme`. It stays on your device and is not sent to the Site or to anyone else. You can remove it by clearing site data in your browser.

## Third parties

Some parts of the Site involve third-party services. Each has its own privacy policy.

### Hosting: GitHub Pages

The Site and the changelog data at `tma-cloud.github.io/changelog/` are hosted on GitHub Pages, operated by GitHub, Inc. When you visit a GitHub Pages site, GitHub logs your IP address for security purposes, whether or not you are signed in to GitHub. The TMA Cloud project cannot see these logs. See the [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection) and the [GitHub General Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).

### Embedded videos: YouTube

Pages with a video show a local preview image. Nothing is loaded from YouTube until you click **Play**. After you click, the player loads from `youtube-nocookie.com` (YouTube's privacy-enhanced mode), and Google receives your IP address and standard browser information. In this mode, YouTube states that the view is not used to personalize your YouTube experience or ads. If you click through to YouTube, YouTube's own terms apply. See the [Google Privacy Policy](https://policies.google.com/privacy) and [YouTube's privacy-enhanced mode](https://support.google.com/youtube/answer/171780).

### External links

The Site links to GitHub, container registries, and other external sites. Their privacy practices are their own; this policy does not cover them.

## The TMA Cloud software

TMA Cloud is self-hosted. The project does not operate a hosted service and does not collect telemetry, usage statistics, crash reports, or file contents from your installations.

The only network requests the software makes on its own are:

- **Update check.** The backend fetches the latest version numbers from the TMA Cloud update feed (see [`GET /api/version/latest`](/docs/api/monitoring)). The request comes from your server, so the feed host sees your server's IP address and standard HTTP headers. No user, file, or account data is included.
- **Desktop app.** The Windows app connects to the server URL set when it was built. If an update download URL (`updatorUrl`) was set at build time, installer downloads come from that URL. The desktop client heartbeat goes to your own TMA Cloud server, not to the project.
- **Services you configure.** S3-compatible storage, OnlyOffice, Redis, PostgreSQL, and any reverse proxy are chosen and operated by you.

## Self-hosted instances

Each TMA Cloud instance is run by its own operator (for example, a company, a school, or an individual). The operator decides what data the instance stores, such as accounts, files, sessions, share links, and [audit logs](/docs/guides/operations/audit-logs), and how long it is kept. Under data protection laws such as the GDPR, the operator is the controller of that data. The TMA Cloud project has no access to it.

If you use a TMA Cloud instance that someone else runs, contact that operator about your data. If you operate an instance, you are responsible for giving your own users a privacy notice and handling their requests. The [Security Model](/docs/concepts/security-model), [Backups](/docs/guides/operations/backups), and [User Management](/docs/guides/admin/user-management) pages describe the controls available to you.

## Legal basis (EEA and UK visitors)

The TMA Cloud project does not itself process personal data about Site visitors. The processing described above is carried out by GitHub (security logging, based on its legitimate interest in protecting its service) and, only after you click **Play**, by Google (to deliver the video you asked for).

## Your rights

Depending on where you live, you may have the right to access, correct, delete, or restrict the use of your personal data, to object to its use, and to lodge a complaint with your local data protection authority. Because the project holds no personal data about Site visitors, requests about hosting logs or video playback should go to GitHub or Google, and requests about a TMA Cloud instance should go to its operator.

## Children

The Site is technical documentation and is not directed at children. It does not knowingly collect personal data from anyone, including children.

## Changes to this policy

If the Site or the software starts handling data differently, this page will be updated and the effective date changed. The full history of this page is public in the [Wiki repository](https://github.com/TMA-Cloud/Wiki/commits/main/content/docs/legal/privacy-policy.md).
