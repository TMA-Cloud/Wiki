# TMA Cloud Wiki

The documentation site for TMA Cloud (Fumadocs, Next.js static export). Pages live in
`content/docs/**/*.md(x)`; each folder's `meta.json` sets the page order. The app's
source is a checkout of the app next to the wiki (or the path in `TMA_REPO`).

**Read [WRITING.md](WRITING.md) before changing any page.** Its rules are not optional:

- Check every fact, label and number in the app's code; never write from memory or copy
  from another page. Remove what the app no longer has.
- Plain words, no filler or "Best Practices"; "first user", not "admin".
- Title Case headings, a lead sentence, **Settings** → **X** menu paths, numbered steps,
  `## Related Topics` at the end.
- One fact in one place; link instead of copying.

## Before You Finish

| What                        | Command                              |
| --------------------------- | ------------------------------------ |
| Format                      | `npm run format`                     |
| Lint and house rules        | `npm run lint` (oxlint + check-docs) |
| Compare with the app's code | `npm run check:code`                 |
| Build                       | `npm run build`                      |

Fix every finding; do not weaken a check to pass it. If a check is wrong, fix the check
in the same commit and say why.

## Editing

- Edit pages with the Edit or Write tools. Shell one-liners mangle backticks and
  backslashes.
- Review a multi-page replacement with `git diff --word-diff` before committing.
- Commit with `git commit -s`, imperative sentence-case subject, body saying why.
  Push only when asked.
