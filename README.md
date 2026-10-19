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
- `npm run lint` — oxlint and the house rules (`scripts/check-docs.mjs`)
- `npm run check:code` — compare the docs with the app's code
- `npm run hooks` — turn on the pre-commit hook

## Writing

Read [WRITING.md](WRITING.md) before changing a page: every fact comes from the code,
plain words, one fact in one place.

## Deploy

Pushing to `main` builds and publishes to GitHub Pages via `.github/workflows/deploy.yml`.
