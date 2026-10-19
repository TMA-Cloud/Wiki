// Checks the house rules in WRITING.md that a formatter cannot fix.
// Run with `npm run check:docs` (part of `npm run lint`). Exits 1 on any problem.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('../content/docs/', import.meta.url).pathname.replace(
  /^\/(\w:)/,
  '$1',
);

// Phrases that add nothing or oversell. Say what happens instead.
const BANNED = [
  [/\bsimply\b/i, 'drop "simply"'],
  [/\beasily\b/i, 'drop "easily"'],
  [/\beffortless(ly)?\b/i, 'drop "effortless"'],
  [/\bseamless(ly)?\b/i, 'say what actually happens instead of "seamless"'],
  [/\brobust\b/i, 'say what it withstands instead of "robust"'],
  [/\bpowerful\b/i, 'drop "powerful"'],
  [/\bcomprehensive\b/i, 'drop "comprehensive"'],
  [/\bblazing(ly)?\b/i, 'give a number instead of "blazing"'],
  [/\bstate[- ]of[- ]the[- ]art\b/i, 'drop "state of the art"'],
  [/\b(enterprise|production)[- ]grade\b/i, 'drop the "-grade" claim'],
  [/\bcutting[- ]edge\b/i, 'drop "cutting edge"'],
  [/\bworld[- ]class\b/i, 'drop "world-class"'],
  [
    /\buser[- ]friendly\b/i,
    'say what the user sees instead of "user-friendly"',
  ],
  [/\bleverag(e|es|ed|ing)\b/i, 'write "use"'],
  [/\butiliz(e|es|ed|ing)\b/i, 'write "use"'],
  [/\bin order to\b/i, 'write "to"'],
  [/\bplease note\b/i, 'drop "please note"'],
  [/(^|[.!?:]\s+|^\s*[-*]\s+)note that\b/i, 'drop "note that"'],
  [/\bit is important to\b/i, 'say why instead'],
  [/\bensures? that\b/i, 'say what happens instead of "ensures that"'],
  [/\bbest practices?\b/i, 'give concrete steps under a specific heading'],
  [/\badmin[- ]only\b/i, 'write "first user only"'],
  [/\betc\.?(?=\s|$|\))/i, 'name the items or drop "etc."'],
];

// Words that stay lowercase inside a Title Case heading, unless first or last.
const SMALL = new Set(
  'a an and as at but by en for from in into nor of on onto or per the to vs via with than'.split(
    ' ',
  ),
);

// Pages that are not instructions or reference and follow their own layout.
const FREE_FORM = /^(changelog\/|legal\/|gallery$|$)/;

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? walk(join(dir, e.name))
      : /\.mdx?$/.test(e.name)
        ? [join(dir, e.name)]
        : [],
  );

export const slug = (heading) =>
  heading
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .trim()
    .replace(/\s/g, '-');

// The words of a heading that Title Case wants capitalised but are not.
// Quoted text and inline code are left as written.
export const lowercaseWords = (heading) => {
  // Quoted text and code count as one capitalised word, so "on" after a quote stays small.
  const plain = heading.replace(/`[^`]*`/g, 'Q').replace(/"[^"]*"/g, 'Q');
  const words = plain.split(/\s+/).filter(Boolean);
  return words.filter((w, i) => {
    const bare = w.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');
    if (!bare || !/^\p{Ll}/u.test(bare)) return false;
    if (/[./_=]/.test(w) || /\p{Lu}|\d/u.test(bare.slice(1))) return false; // paths, names like iPhone
    const afterColon = i > 0 && /:$/.test(words[i - 1]);
    return (
      i === 0 ||
      i === words.length - 1 ||
      afterColon ||
      !SMALL.has(bare.toLowerCase())
    );
  });
};

const pages = new Map();
for (const file of walk(ROOT)) {
  const id = relative(ROOT, file)
    .replace(/\\/g, '/')
    .replace(/\.mdx?$/, '')
    .replace(/(^|\/)index$/, '');
  pages.set(id, {
    file,
    text: readFileSync(file, 'utf8').replace(/\r\n/g, '\n'),
  });
}

// Heading anchors per page, numbered like the site does for repeats.
for (const page of pages.values()) {
  page.anchors = new Set();
  let fence = false;
  for (const line of page.text.split('\n')) {
    if (/^\s*```/.test(line)) fence = !fence;
    const m = !fence && /^#{1,6} (.+)$/.exec(line);
    if (!m) continue;
    let s = slug(m[1]);
    for (let n = 1; page.anchors.has(s); n++) s = `${slug(m[1])}-${n}`;
    page.anchors.add(s);
  }
}

const problems = [];
const report = (id, line, message) =>
  problems.push(`${pages.get(id).file}:${line}: ${message}`);

for (const [id, { text }] of pages) {
  const free = FREE_FORM.test(id);
  const lines = text.split('\n');

  const front = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!front) {
    report(id, 1, 'missing frontmatter');
    continue;
  }
  for (const key of ['title', 'description']) {
    if (!new RegExp(`^${key}: ('.+'|".+")$`, 'm').test(front[1]))
      report(id, 1, `frontmatter needs a quoted ${key}`);
  }
  const bodyStart = front[0].split('\n').length;
  const lead = lines.slice(bodyStart - 1).find((l) => l.trim());
  if (!free && lead && /^(#|<|\||- |\d+\. |```)/.test(lead)) {
    report(
      id,
      bodyStart,
      'start the page with a sentence saying what it covers, before any heading or list',
    );
  }

  let fence = false;
  let listNext = 0;
  const h2 = [];
  lines.forEach((line, i) => {
    const n = i + 1;
    if (/^\s*```/.test(line)) {
      fence = !fence;
      return;
    }
    if (fence || n < bodyStart) return;

    const heading = /^(#{2,4}) (.+)$/.exec(line);
    if (heading) {
      if (heading[1] === '##') h2.push([heading[2], n]);
      const low = free ? [] : lowercaseWords(heading[2]);
      if (low.length)
        report(id, n, `heading needs Title Case: ${low.join(', ')}`);
    }

    // Banned phrases, outside inline code and link targets.
    const prose = line.replace(/`[^`]*`/g, '').replace(/\]\([^)]*\)/g, ']');
    for (const [re, fix] of BANNED)
      if (re.test(prose)) report(id, n, `${prose.match(re)[0]}: ${fix}`);

    // Menu paths: **Settings** → **Storage**, each label bold on its own.
    const boldWithArrow = [...prose.matchAll(/\*\*([^*\n]+)\*\*/g)].some((m) =>
      m[1].includes('→'),
    );
    if (boldWithArrow || /\*{4}/.test(prose)) {
      report(
        id,
        n,
        'write menu paths as **Settings** → **Storage**, one bold label per step',
      );
    }
    if (/\bSettings\s+→/.test(prose))
      report(id, n, 'bold each step of the menu path: **Settings** → ...');

    // Ordered lists count up from their first number with no gaps.
    const item = /^(\d+)\. /.exec(line);
    if (item) {
      const num = Number(item[1]);
      if (listNext && num !== listNext)
        report(id, n, `list item ${num} should be ${listNext}`);
      listNext = (listNext || num) + 1;
    } else if (line.trim() && !/^\s/.test(line)) {
      listNext = 0;
    }

    // Internal links point at a page and heading that exist.
    for (const m of line.matchAll(/\]\((\/docs[^)\s]*|#[^)\s]+)\)/g)) {
      const [path, anchor] = m[1].split('#');
      const target = path
        ? path.replace(/^\/docs\/?/, '').replace(/\/$/, '')
        : id;
      const page = pages.get(target);
      if (!page) report(id, n, `link to a missing page: ${m[1]}`);
      else if (anchor && !page.anchors.has(anchor))
        report(id, n, `link to a missing heading: ${m[1]}`);
    }
  });

  if (!free) {
    const last = h2.at(-1);
    const ending = ['Related Topics', 'Next Steps'];
    if (!last || !ending.includes(last[0])) {
      report(
        id,
        lines.length,
        'end the page with "## Related Topics" (or "## Next Steps" in Getting Started)',
      );
    }
  }
}

// Every page is listed in its folder's meta.json, and every listed page exists.
const metas = readdirSync(ROOT, { recursive: true }).filter((f) =>
  /(^|[\\/])meta\.json$/.test(f),
);
for (const metaPath of metas) {
  const dir = join(ROOT, metaPath, '..');
  const listed =
    JSON.parse(readFileSync(join(ROOT, metaPath), 'utf8')).pages ?? [];
  for (const entry of listed) {
    if (entry.startsWith('---') || entry.startsWith('[') || entry === '...')
      continue;
    const base = join(dir, entry);
    if (!['.md', '.mdx', ''].some((ext) => existsSync(base + ext))) {
      problems.push(
        `${join(ROOT, metaPath)}: lists "${entry}", which does not exist`,
      );
    }
  }
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const name = e.isDirectory() ? e.name : e.name.replace(/\.mdx?$/, '');
    if ((e.isDirectory() || /\.mdx?$/.test(e.name)) && !listed.includes(name)) {
      problems.push(`${join(ROOT, metaPath)}: "${name}" is missing from pages`);
    }
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(
    `\n${problems.length} problem(s). The rules are in WRITING.md.`,
  );
  process.exit(1);
}
console.log(`check-docs: ${pages.size} pages ok`);
