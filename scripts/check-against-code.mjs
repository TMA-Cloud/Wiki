// Compares the wiki with the TMA Cloud source, so docs cannot drift from the code.
// Usage: npm run check:code [-- <path to the app checkout>]
// Without a path it uses $TMA_REPO, or the folder next to the wiki that holds the app.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DOCS = new URL('../content/docs/', import.meta.url).pathname.replace(
  /^\/(\w:)/,
  '$1',
);
const isApp = (dir) => existsSync(join(dir, 'crates/tma-server/src'));
const sibling = () => {
  const parent = join(DOCS, '../../..');
  return readdirSync(parent, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => join(parent, e.name))
    .find(isApp);
};
const REPO = process.argv[2] ?? process.env.TMA_REPO ?? sibling();
if (!REPO || !isApp(REPO)) {
  console.error(
    'No TMA Cloud checkout found next to the wiki. Pass its path: npm run check:code -- <path>',
  );
  process.exit(2);
}
const SERVER = join(REPO, 'crates/tma-server');

const walk = (dir, re) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? walk(join(dir, e.name), re)
      : re.test(e.name)
        ? [join(dir, e.name)]
        : [],
  );
const read = (f) => readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const doc = (page) => read(join(DOCS, page));
const docPages = walk(DOCS, /\.mdx?$/).map((f) => ({
  id: relative(DOCS, f).replace(/\\/g, '/'),
  text: read(f),
}));
const rust = (dir) =>
  walk(dir, /\.rs$/).map((f) => ({
    id: relative(REPO, f).replace(/\\/g, '/'),
    text: read(f),
  }));
const serverSrc = rust(join(SERVER, 'src'));

const problems = [];
const compare = (what, code, docs, where) => {
  for (const x of [...code].filter((x) => !docs.has(x)).sort())
    problems.push(`${what}: ${x} is in the code but not in ${where}`);
  for (const x of [...docs].filter((x) => !code.has(x)).sort())
    problems.push(`${what}: ${x} is in ${where} but not in the code`);
};

// 1. Routes: every served METHOD and path has a "### METHOD `path`" heading, and no heading is made up.
const PREFIX = [
  [/^routes\/files\//, '/api/files'],
  [/^routes\/(admin\/|subusers\.rs)/, '/api/user'],
  [/^routes\/(auth\/|sessions\.rs|mfa\.rs)/, '/api'],
  [/^routes\/onlyoffice\.rs/, '/api/onlyoffice'],
  [/^routes\/public_share\.rs/, '/s'],
];
const served = new Set();
const norm = (p) =>
  p.replace(/\{[^}]+\}|:[A-Za-z_]+/g, ':x').replace(/(.)\/$/, '$1');
for (const { id, text } of serverSrc) {
  const rel = id.replace(/^crates\/tma-server\/src\//, '');
  for (const m of text.matchAll(
    /\.route\(\s*"([^"]+)",([\s\S]*?)(?=\.route\(|\.nest\(|\.merge\(|\.layer\(|\.route_layer\(|;|\n\s*\})/g,
  )) {
    let prefix = PREFIX.find(([re]) => re.test(rel))?.[1];
    if (rel === 'routes/meta.rs')
      prefix = /version/.test(text.slice(0, m.index).split('pub fn').at(-1))
        ? '/api/version'
        : '/api';
    if (rel === 'routes/mod.rs') prefix = '';
    if (prefix === undefined) continue;
    const path = norm(prefix + (m[1] === '/' && prefix ? '' : m[1]));
    for (const method of m[2].matchAll(/\b(get|post|put|patch|delete)\(/g))
      served.add(`${method[1].toUpperCase()} ${path}`);
  }
}
const documented = new Set();
for (const { id, text } of docPages.filter((p) => p.id.startsWith('api/'))) {
  for (const m of text.matchAll(
    /^###? (GET|POST|PUT|PATCH|DELETE) `([^`?]+)/gm,
  ))
    documented.add(`${m[1]} ${norm(m[2])}`);
  void id;
}
compare('Route', served, documented, 'the API pages');

// 2. Error codes: the tables in reference/error-codes.md list exactly what the server sends.
const codes = new Set();
for (const { text } of serverSrc) {
  for (const m of text.matchAll(
    /\.code\("([A-Z_]+)"\)|"error":\s*"([A-Z][A-Z_]+)"/g,
  ))
    codes.add(m[1] ?? m[2]);
}
const codeDocs = new Set(
  [...doc('reference/error-codes.md').matchAll(/^\| `([A-Z][A-Z_]+)`/gm)].map(
    (m) => m[1],
  ),
);
compare('Error code', codes, codeDocs, 'reference/error-codes.md');

// 3. Audit events: the list items in reference/audit-events.mdx are exactly the events written.
const events = new Set();
const EVENT =
  /"((?:auth|file|folder|share|document|admin|account)\.[a-z_]+(?:\.[a-z_]+)*)"/g;
for (const { id, text } of serverSrc) {
  if (/events\.rs$/.test(id) || !/audit|Event::new/.test(text)) continue; // events.rs holds live-update names
  for (const m of text.matchAll(EVENT)) events.add(m[1]);
}
const eventDocs = new Set(
  [
    ...doc('reference/audit-events.mdx').matchAll(/^- `([a-z_]+\.[a-z_.]+)`/gm),
  ].map((m) => m[1]),
);
compare('Audit event', events, eventDocs, 'reference/audit-events.mdx');

// 4. Database: every table and column the migrations leave is in reference/database-schema.md.
const tables = {};
for (const f of walk(join(SERVER, 'migrations'), /\.sql$/).sort()) {
  const sql = read(f).replace(/--.*$/gm, '');
  for (const m of sql.matchAll(
    /create table (?:if not exists )?(\w+)\s*\(([\s\S]*?)\n\);/gi,
  )) {
    tables[m[1].toLowerCase()] = new Set(
      m[2]
        .split('\n')
        .map((l) => /^\s*(\w+)\s+\w/.exec(l)?.[1]?.toLowerCase())
        .filter(
          (c) =>
            c && !/^(primary|unique|constraint|foreign|check|exclude)$/.test(c),
        ),
    );
  }
  for (const m of sql.matchAll(
    /alter table (?:if exists )?(?:only )?(\w+)([\s\S]*?);/gi,
  )) {
    const cols = (tables[m[1].toLowerCase()] ??= new Set());
    for (const a of m[2].matchAll(/add column (?:if not exists )?(\w+)/gi))
      cols.add(a[1].toLowerCase());
    for (const d of m[2].matchAll(/drop column (?:if exists )?(\w+)/gi))
      cols.delete(d[1].toLowerCase());
    for (const r of m[2].matchAll(/rename column (\w+) to (\w+)/gi)) {
      cols.delete(r[1].toLowerCase());
      cols.add(r[2].toLowerCase());
    }
  }
  for (const m of sql.matchAll(/drop table (?:if exists )?(\w+)/gi))
    delete tables[m[1].toLowerCase()];
}
const schema = doc('reference/database-schema.md');
const docTables = {};
for (const sec of schema.split(/\n### /).slice(1)) {
  const name = /^`(\w+)`/.exec(sec)?.[1];
  if (name)
    docTables[name] = new Set(
      [...sec.matchAll(/^\| `(\w+)`/gm)].map((m) => m[1]),
    );
}
const views = new Set(
  [...schema.matchAll(/create (?:or replace )?view (\w+)/gi)].map((m) => m[1]),
);
for (const v of ['audit_activity', 'migrations']) views.add(v); // a view, and the runner's own table
compare(
  'Table',
  new Set(Object.keys(tables)),
  new Set(Object.keys(docTables).filter((t) => !views.has(t))),
  'reference/database-schema.md',
);
for (const [t, cols] of Object.entries(tables)) {
  if (docTables[t]?.size)
    compare(
      `Column of ${t}`,
      cols,
      docTables[t],
      'reference/database-schema.md',
    );
}

// 5. Environment variables: everything the server reads is in the reference, and nothing there is invented.
const envCode = new Set(['RUST_LOG']);
for (const { text } of serverSrc) {
  for (const m of text.matchAll(
    /\b(?:required|flag|var|read_secret)\("([A-Z][A-Z0-9_]+)"/g,
  ))
    envCode.add(m[1]);
  // read_secret also accepts NAME_FILE, a path to a file holding the value.
  for (const m of text.matchAll(/\bread_secret\("([A-Z][A-Z0-9_]+)"/g))
    envCode.add(`${m[1]}_FILE`);
}
const envDocs = new Set(
  [
    ...doc('reference/environment-variables.md').matchAll(
      /^\| `([A-Z][A-Z0-9_]+)`/gm,
    ),
  ].map((m) => m[1]),
);
for (const v of [...envCode].filter((v) => !envDocs.has(v)))
  problems.push(
    `Env var: ${v} is read by the server but not in reference/environment-variables.md`,
  );
const repoText = [
  join(REPO, '.env.example'),
  join(REPO, 'compose.yml'),
  join(REPO, 'docker-compose.yml'),
  join(REPO, 'setup.sh'),
  join(REPO, 'update.sh'),
  join(REPO, 'rotate.sh'),
  join(REPO, 'scripts/db-backup-restore.sh'),
]
  .filter(existsSync)
  .map(read)
  .join('\n');
for (const v of [...envDocs].filter(
  (v) => !envCode.has(v) && !repoText.includes(v),
)) {
  problems.push(
    `Env var: ${v} is in reference/environment-variables.md but nothing in the repo reads it`,
  );
}

// 6. Rate limits: every limiter's count and window appear in reference/rate-limits.md.
const limits = read(join(SERVER, 'src/services/limits.rs')).split(
  '#[cfg(test)]',
)[0];
const limitDoc = doc('reference/rate-limits.md');
for (const m of limits.matchAll(
  /window:\s*(?:Duration::from_secs\((\d+)\)|MIN),\s*max:\s*([\d_]+)/g,
)) {
  const max = Number(m[2].replace(/_/g, '')).toLocaleString('en-US');
  const minutes = m[1] ? Number(m[1]) / 60 : 1;
  const window =
    minutes === 1
      ? /per minute|1 minute/
      : new RegExp(`per ${minutes} minutes|${minutes} minutes`);
  if (!new RegExp(`\\b${max}\\b`).test(limitDoc) || !window.test(limitDoc)) {
    problems.push(
      `Rate limit: ${max} per ${minutes} minute(s) is not in reference/rate-limits.md`,
    );
  }
}

// 7. Version: image tags in examples match the workspace version (the changelog keeps history).
const version = /^version = "([^"]+)"/m.exec(
  read(join(REPO, 'Cargo.toml')),
)?.[1];
for (const { id, text } of docPages.filter(
  (p) => !p.id.startsWith('changelog/'),
)) {
  for (const m of text.matchAll(
    /tma-cloud\/tma:(\d+\.\d+\.\d+)|TMA_REF=v(\d+\.\d+\.\d+)/g,
  )) {
    if ((m[1] ?? m[2]) !== version)
      problems.push(
        `Version: ${id} shows ${m[0]}, but the workspace is ${version}`,
      );
  }
}

// 8. UI labels: each bold step of a menu path (**Settings** → **Storage**) is a string in the app.
const uiText = [join(REPO, 'crates/tma-ui/src'), join(REPO, 'apps')]
  .filter(existsSync)
  .flatMap((d) => (statSync(d).isDirectory() ? rust(d) : []))
  .map((f) => f.text)
  .join('\n');
const OUTSIDE_APP = new Set(['Apps', 'Settings']); // Windows Settings, and the app's own sidebar entry drawn as an icon label
for (const { id, text } of docPages.filter(
  (p) => !p.id.startsWith('changelog/'),
)) {
  for (const line of text.split('\n')) {
    if (!line.includes('→')) continue;
    for (const path of line.matchAll(
      /\*\*[^*\n]+\*\*(?:\s*→\s*\*\*[^*\n]+\*\*)+/g,
    )) {
      for (const label of path[0]
        .split(/\s*→\s*/)
        .map((s) => s.replace(/\*\*/g, '').trim())) {
        if (
          OUTSIDE_APP.has(label) ||
          uiText.includes(`"${label}`) ||
          uiText.includes(`${label}"`)
        )
          continue;
        problems.push(
          `UI label: ${id} names **${label}**, which no string in the app contains`,
        );
      }
    }
  }
}

if (problems.length) {
  console.error([...new Set(problems)].join('\n'));
  console.error(
    `\n${new Set(problems).size} difference(s) between the wiki and the app checkout.`,
  );
  process.exit(1);
}
console.log(
  `check-against-code: routes, error codes, audit events, schema, env vars, limits, version and labels match the app checkout`,
);
