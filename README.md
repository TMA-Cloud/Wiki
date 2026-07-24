# TMA Cloud | Wiki

Documentation site for [TMA Cloud](https://github.com/TMA-Cloud), built with [Fumadocs](https://fumadocs.dev) (Next.js, static export).

**Live:** [Documentation Wiki](https://tma-cloud.github.io/Wiki/)

## Development

```bash
npm install
npm run dev      # http://localhost:3000
```

- `npm run build` — static export to `out/`
- `npm run types:check` — typecheck

## Deploy

Pushing to `main` builds and publishes to GitHub Pages via `.github/workflows/deploy.yml`.
