// Copy standards check. Run after a build: node scripts/check-copy.mjs
//
// Reads dist/**/*.html and fails if the visible text, or the content of the
// meta description, og:description and alt attributes, contains an em dash or
// one of a short list of banned words. Scripts, styles and anything inside an
// element carrying data-verbatim (the printed book's text, quotations from the
// book, reader submissions) are skipped. So is every <blockquote>, because on
// this site a blockquote is always a quotation and markdown cannot carry the
// attribute. See "Writing standards" in CLAUDE.md.
//
// --report also counts the patterns a regex can only suggest (negative
// parallelism and a wider word list). Those are printed, never failed on.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const report = process.argv.includes('--report');

const BANNED = [
  'delve', 'robust', 'leverage', 'harness', 'foster', 'underscore', 'tapestry',
  'testament', 'pivotal', 'crucial', 'transformative', 'vibrant', 'seamless',
  'multifaceted', 'nuanced', 'holistic', 'invaluable', 'unparalleled',
  'captivating', 'evocative', 'poignant', 'embark', 'unlock', 'empower',
  'elevate', 'resonate', 'genuinely', 'truly', 'notably',
];
const WIDE = [
  ...BANNED, 'certainly', 'utilise', 'streamline', 'enhance', 'intricate',
  'paradigm', 'synergy', 'liminal', 'palpable', 'ineffable', 'visceral',
  'showcase', 'meticulous', 'meticulously', 'notable', 'noteworthy',
  'commendable', 'versatile', 'seamlessly', 'garner', 'bolster', 'elucidate',
  'interplay', 'underpin', 'solidify', 'bustling', 'nestled', 'picturesque',
  'breathtaking', 'stunning', 'boasts', 'renowned', 'indelible', 'embark',
  'navigate', 'unleash', 'amplify', 'evoke', 'captivate', 'facilitate',
  'spearhead', 'realm', 'myriad', 'plethora', 'genuine', 'honestly', 'arguably',
  'landscape', 'journey', 'tapestry',
];
const wordRe = (list) => new RegExp(`\\b(${[...new Set(list)].join('|')})\\b`, 'gi');
const bannedRe = wordRe(BANNED);
const wideRe = wordRe(WIDE);
const NOT_RE = /\b(?:not (?:just |only |merely )?[^.;:!?]{1,60}?,? but\b|(?:is|are|was|were|it's|it is|that's|isn't|aren't) not [^.;:!?]{1,50}?, (?:it's|it is|but|they're|they are)|[a-z]+, not (?:a |an |the )?[a-z]+)/gi;

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ', '&mdash;': '—', '&#8212;': '—', '&#x2014;': '—' };
const decode = (s) => s.replace(/&(?:amp|lt|gt|quot|apos|nbsp|mdash|#39|#8212|#x2014);/g, (m) => ENT[m]);

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
  });
}

/** Returns the prose the reader (or a search snippet) sees, minus verbatim blocks. */
function extract(html) {
  const out = [];
  const stack = []; // {name, verbatim}
  let skipUntil = null;
  let i = 0;
  const tagRe = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g;
  let m;
  const verbatim = () => stack.some((e) => e.verbatim);
  while ((m = tagRe.exec(html))) {
    if (!verbatim() && !skipUntil) out.push(html.slice(i, m.index));
    i = tagRe.lastIndex;
    if (m[0].startsWith('<!--')) continue;
    const closing = m[1] === '/';
    const name = m[2].toLowerCase();
    const attrs = m[3] || '';
    if (skipUntil) {
      if (closing && name === skipUntil) skipUntil = null;
      continue;
    }
    if (closing) {
      for (let k = stack.length - 1; k >= 0; k--) {
        if (stack[k].name === name) { stack.length = k; break; }
      }
      continue;
    }
    if (name === 'script' || name === 'style') { skipUntil = name; continue; }
    const attr = (a) => {
      const r = attrs.match(new RegExp(`(?:^|\\s)${a}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
      return r ? (r[1] ?? r[2]) : null;
    };
    const isVerbatim = name === 'blockquote' || /(?:^|\s)data-verbatim(?=[\s=]|$)/.test(attrs);
    if (!verbatim() && !isVerbatim) {
      if (name === 'meta') {
        const key = attr('name') || attr('property');
        if (key && /^(description|og:description|twitter:description)$/i.test(key)) out.push(' ' + (attr('content') || '') + ' ');
      }
      const alt = attr('alt');
      if (alt) out.push(' ' + alt + ' ');
    }
    if (!VOID.has(name) && !/\/\s*$/.test(attrs)) stack.push({ name, verbatim: isVerbatim });
  }
  if (!verbatim() && !skipUntil) out.push(html.slice(i));
  return decode(out.join('\n').replace(/<[^>]+>/g, ' ')).replace(/[ \t]+/g, ' ');
}

const snippet = (text, idx, len) => text.slice(Math.max(0, idx - 40), idx + len + 40).replace(/\s+/g, ' ').trim();

let failures = 0;
let dashes = 0, words = 0, nots = 0, wide = 0;
for (const file of walk(DIST).sort()) {
  const text = extract(readFileSync(file, 'utf8'));
  const rel = relative(DIST, file);
  for (let k = text.indexOf('—'); k !== -1; k = text.indexOf('—', k + 1)) {
    failures++; dashes++;
    console.log(`${rel}: em dash: ...${snippet(text, k, 1)}...`);
  }
  for (const w of text.matchAll(bannedRe)) {
    failures++; words++;
    console.log(`${rel}: banned word "${w[0]}": ...${snippet(text, w.index, w[0].length)}...`);
  }
  if (report) {
    for (const w of text.matchAll(wideRe)) { wide++; console.log(`${rel}: [wide] ${w[0]}: ...${snippet(text, w.index, w[0].length)}...`); }
    for (const w of text.matchAll(NOT_RE)) { nots++; console.log(`${rel}: [not-X] ...${snippet(text, w.index, w[0].length)}...`); }
  }
}
if (report) console.log(`\nreport: em dashes ${dashes}, banned words ${words}, wide-list words ${wide}, not-X candidates ${nots}`);
if (failures) {
  console.error(`\ncheck-copy: ${failures} problem(s). Rewrite the sentence, or mark book text with data-verbatim.`);
  process.exit(1);
}
console.log('check-copy: ok');
