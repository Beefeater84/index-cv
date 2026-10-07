// Enforces docs/constraints.md on the built site in dist/.
// Tokens are counted the way an agent reads a page: HTML → Markdown (turndown) → o200k_base.
import fs from 'node:fs';
import path from 'node:path';
import TurndownService from 'turndown';
import { getEncoding } from 'js-tiktoken';

const DIST = path.resolve('dist');
const KB = 1024;

// Limits from docs/constraints.md.
const LIMITS = {
  'index.html': { kind: 'html', maxBytes: 40 * KB, minTextRatio: 0.5, maxTokens: 4000 },
  'project.html': { kind: 'html', maxBytes: 30 * KB, minTextRatio: 0.6, maxTokens: 6000 },
  'index.md': { kind: 'text', maxTokens: 4000 },
  'project.md': { kind: 'text', maxTokens: 6000 },
  'llms.txt': { kind: 'text', maxTokens: 4000 },
  'llms-full.txt': { kind: 'text', warnTokens: 40000 },
};
// Below this size the <head> dominates and the text ratio says nothing.
const RATIO_MIN_HTML_BYTES = 10 * KB;

const FORBIDDEN = [
  [/<script(?![^>]*type="application\/ld\+json")/i, '<script> (only JSON-LD is allowed)'],
  [/<style[\s>]/i, '<style>'],
  [/\sstyle=/i, 'style="..." attribute'],
  [/<img[\s>]/i, '<img>'],
  [/<svg[\s>]/i, '<svg>'],
  [/<iframe[\s>]/i, '<iframe>'],
  [/<div[\s>]/i, '<div>'],
];

const enc = getEncoding('o200k_base');
const turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' });

function classify(rel) {
  if (rel === 'index.html') return 'index.html';
  if (/^projects\/[^/]+\/index\.html$/.test(rel)) return 'project.html';
  if (rel === 'index.md') return 'index.md';
  if (/^projects\/[^/]+\.md$/.test(rel)) return 'project.md';
  if (rel === 'llms.txt' || rel === 'llms-full.txt') return rel;
  return null;
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
}

const bodyOf = (html) => (html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html);
const visibleText = (html) =>
  bodyOf(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

if (!fs.existsSync(DIST)) {
  console.error('dist/ not found — run `astro build` first.');
  process.exit(1);
}

const rows = [];
const failures = [];
const warnings = [];

for (const file of walk(DIST)) {
  const rel = path.relative(DIST, file).split(path.sep).join('/');
  const type = classify(rel);
  if (!type) continue;
  const limit = LIMITS[type];
  const raw = fs.readFileSync(file, 'utf8');
  const bytes = Buffer.byteLength(raw);
  const problems = [];
  let ratio = null;
  let readable = raw;

  if (limit.kind === 'html') {
    for (const [re, what] of FORBIDDEN) if (re.test(raw)) problems.push(`forbidden ${what}`);
    if (bytes > limit.maxBytes) problems.push(`HTML ${(bytes / KB).toFixed(1)} KB > ${limit.maxBytes / KB} KB`);
    ratio = Buffer.byteLength(visibleText(raw)) / bytes;
    if (bytes >= RATIO_MIN_HTML_BYTES && ratio < limit.minTextRatio) {
      problems.push(`text ratio ${(ratio * 100).toFixed(0)}% < ${limit.minTextRatio * 100}%`);
    }
    readable = turndown.turndown(bodyOf(raw));
  }

  const tokens = enc.encode(readable).length;
  if (limit.maxTokens && tokens > limit.maxTokens) problems.push(`${tokens} tokens > ${limit.maxTokens}`);
  if (limit.warnTokens && tokens > limit.warnTokens) warnings.push(`${rel}: ${tokens} tokens > ${limit.warnTokens}`);

  rows.push({
    file: rel,
    size: `${(bytes / KB).toFixed(1)} KB`,
    text: ratio === null ? '' : `${(ratio * 100).toFixed(0)}%${bytes < RATIO_MIN_HTML_BYTES ? ' (n/a)' : ''}`,
    tokens,
    status: problems.length ? 'FAIL' : 'ok',
  });
  for (const p of problems) failures.push(`${rel}: ${p}`);
}

rows.sort((a, b) => a.file.localeCompare(b.file));
console.table(rows);
for (const w of warnings) console.warn(`WARN  ${w}`);
for (const f of failures) console.error(`FAIL  ${f}`);
if (failures.length) process.exit(1);
console.log('All constraints passed.');
