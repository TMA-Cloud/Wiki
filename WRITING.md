# Writing the TMA Cloud Docs

These rules keep the wiki correct, plain and consistent. `npm run lint` checks the
ones a script can see (`scripts/check-docs.mjs`), and `npm run check:code` compares the
wiki with the TMA Cloud source (`scripts/check-against-code.mjs`). The rest is on you.

## 1. Every Fact Comes from the Code

The wiki describes the current release, nothing older and nothing planned.

- **Check before you write.** Look up each endpoint, field, status code, error code,
  limit, default, schedule, label and file path in the source. Do not write from memory
  or from another page; the other page may be wrong.
- **Copy UI labels exactly** from the app's strings (`crates/tma-ui`, `apps/`): it says
  **Delete forever**, so the docs do too, not "Delete Permanently".
- **Copy numbers from the code**, with their unit: "30,000 requests per 15 minutes per
  user", not "a generous limit".
- **Remove what is gone.** When a feature, field, code or setting is removed from the app,
  remove it from every page in the same change. Search the whole wiki for the name.
- **Never invent behaviour.** If you cannot find it in the code, leave it out or ask.
- **Old behaviour belongs in the changelog**, not in the guides. A reference page may say
  "rows written by older versions may also hold X" when readers will meet old data.

`npm run check:code` catches drift in routes, error codes, audit events, the database
schema, environment variables, rate limits, version tags and menu labels. It cannot check
prose, so read the code for everything else.

## 2. Say It Plainly

Write for someone running TMA Cloud who wants to get a task done.

- Use the active voice, the present tense and "you": "Click **Save**", "The server
  refuses the upload".
- Put the condition before the instruction: "To stop sharing, open **Share** and click
  **Stop sharing**."
- Say what happens, with the real outcome, number or message. Not "Real-time
  enforcement" but "Uploads that would pass the limit are refused with the space left".
- One idea per bullet or sentence. Prefer a sentence to a bullet list of fragments.
- Use the shortest word that is right: "use", not "utilize"; "to", not "in order to".
- No filler or praise: simply, easily, just (as filler), seamless, robust, powerful,
  comprehensive, user-friendly, please note, note that, it is important, ensures that,
  etc. The checker rejects all of these except "just", which has honest uses.
- No "Best Practices" sections. Give the concrete step under a heading that names it,
  such as "Before Going to Production".
- One name per thing. The administrator is **the first user**: write "(first user only)",
  never "(admin only)". Sub-users, account owner and share link are spelled as in the
  [Glossary](content/docs/reference/glossary.md).

## 3. Format

- **Frontmatter** has a quoted `title` and `description`. The page then opens with a
  sentence saying what it covers, before any heading or list.
- **Headings** use Title Case ("Open Files in Desktop Apps"). Quoted error messages and
  code inside a heading keep their own case.
- **UI labels** are bold. A menu path makes each step bold on its own:
  **Settings** → **Administration** → **Policies**. Never `**Settings → Storage**`.
- **Code font** for code, paths, file names, commands, environment variables, field
  names, status codes with names, and error codes.
- **Steps** are a numbered list, one action per step. Lists count up with no gaps.
- **Links** are absolute (`/docs/guides/user/upload-files#keyboard-navigation`) and the
  link text names the page or section. Every link and anchor must resolve.
- **Pages end** with `## Related Topics` (Getting Started pages may end with
  `## Next Steps`): two to four links, each `- [Page](/docs/...) - What it covers`.
- **Tables** hold reference data (variables, codes, limits), not prose.
- Prettier formats everything: run `npm run format`.

The changelog, legal pages, the gallery and the home page keep their own layout and
skip the page-shape rules, but not the wording or link rules.

## 4. One Fact, One Place

Each section of the wiki has one job (after [Diataxis](https://diataxis.fr)):

| Section         | Job                                                   |
| --------------- | ----------------------------------------------------- |
| Getting Started | Install and first steps, in order                     |
| Concepts        | How and why it works                                  |
| Guides          | How to do one task                                    |
| API             | Every endpoint: request, response, errors             |
| Debugging       | A symptom, then checks you can run, in order          |
| Reference       | Complete lists: variables, codes, events, schema, CLI |
| Changelog       | What changed in each version                          |

Write a fact once, on the page whose job it is, and link to it from the others. Do not
copy a table or a list of status codes onto a second page; copies drift apart.

## 5. Making a Change

1. Change the docs in the same session as the app change they describe.
2. Read the code for every fact you touch (section 1).
3. Edit with care. A find-and-replace across many pages must be reviewed line by line:
   run `git diff --word-diff` before you commit. A pattern that looked safe once wrapped
   correct menu paths in extra `**`.
4. Run, in this order:

   ```bash
   npm run format
   npm run lint
   npm run check:code
   npm run build
   ```

5. Commit with `git commit -s`: an imperative subject in sentence case, and a body that
   says what was wrong and why the change fixes it.

## Checklist

- [ ] Every fact, label and number checked in the code
- [ ] Removed features removed from every page
- [ ] No filler words, no "Best Practices", "first user" for the administrator
- [ ] Lead sentence, Title Case headings, bold menu paths, numbered steps
- [ ] Each fact on one page, linked from the rest
- [ ] Ends with Related Topics; links resolve
- [ ] `format`, `lint`, `check:code` and `build` pass
