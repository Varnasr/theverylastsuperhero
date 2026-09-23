/* ==========================================================================
   Every ink token measures against every surface token, in both themes.

       node scripts/check-contrast.mjs
       node scripts/check-contrast.mjs --all   # print the passes too

   Why this rather than running axe over the pages.

   axe reports the combinations a page happens to use, on the pages you
   happen to point it at, in the theme it happens to load. That is three ways
   of being told about somewhere other than where the problem is. On
   2026-09-23 `--text-faint` was 4.00:1 on `--surface` and had been measured
   only against `--bg`, where it passes at 4.67:1. It styles every eyebrow,
   caption and byline on the site, so it was wrong in both themes, on most
   surfaces, everywhere at once, and an audit of one page in one theme would
   have called whichever combination it met.

   A token is a promise that a colour is safe to use. This checks the promise
   directly: parse the two `:root` blocks, resolve `var()` inside them, and
   measure every ink against every surface. It needs no browser, no build and
   no network, so it cannot be skipped for being slow.

   WHAT IT DOES NOT COVER. A colour written as a literal in a component, and a
   colour composited with opacity, are both invisible here. axe over the built
   pages is what catches those, and the two are not substitutes.

   PAIRS THAT ARE NEVER PUT TOGETHER go in EXEMPT with a written reason, and a
   stale exemption fails too: a pair that starts passing, or a token that
   disappears, is reported, so the list cannot rot into a blindfold.
   ========================================================================== */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CSS = path.join(ROOT, 'src/styles/global.css');
const showAll = process.argv.includes('--all');

/* WCAG 2.1 AA for body text. Large text is 3:1, but a token does not know how
   big the text using it will be, so the stricter number is the only honest
   one to hold a token to. */
const AA = 4.5;

/* The accent tokens are ink too, and scoping this to --text and --link missed
   that on the first run. `--amber` is the current nav item and the brand mark,
   `--amber-dim` is the meta line on every lore card, `--ember` is the text of
   the corrupted badge. All three are `color:` somewhere, and in the light
   theme they measured 4.39:1, 2.67:1 and 2.63:1. A token that is ever a text
   colour is checked as one. */
const INK = /^--(text|link|amber|ember)(-|$)/;
const SURFACE = /^--(bg|surface)(-|$)/;

/* The other direction, which no ink-on-surface pass can see: `--amber` is also
   a button fill, with `color: var(--bg)` on it. Darkening the accent to fix it
   as ink makes it worse as a fill, and those pull opposite ways, so both are
   measured. BuyButton wrote a literal #131211 there instead of var(--bg) and
   read at 3.53:1 in the light theme for as long as the theme existed. */
const FILLS = [{ fill: '--amber', ink: '--bg', why: 'the amber buttons' }];

/* Deliberate never-pairs. Empty today: every ink here is used on every
   surface somewhere, which is exactly why the token has to clear all of
   them. */
const EXEMPT = [
  // { ink: '--text-faint', surface: '--bg-sunken', why: '...' },
];

function lum(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map(c => c + c).join('') : h;
  const ch = [0, 2, 4].map(i => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

function ratio(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/* Pull one selector's custom properties. The file also carries a
   forced-colors block and a print block; only the two theme roots are read,
   by exact selector, so a new block cannot silently join the audit or
   silently escape it. */
function tokensFor(css, selector) {
  const at = css.indexOf(selector);
  if (at === -1) { return null; }
  const open = css.indexOf('{', at);
  let depth = 0, end = open;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') { depth++; }
    else if (css[i] === '}') { depth--; if (!depth) { end = i; break; } }
  }
  const body = css.slice(open + 1, end);
  const out = {};
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    out[m[1]] = m[2].trim();
  }
  return out;
}

/* `--link: var(--amber)` has to be followed, or the token that actually
   reaches the page is never measured. */
function resolve(tokens, value, seen = new Set()) {
  const m = /^var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)$/.exec(value);
  if (!m) { return value; }
  if (seen.has(m[1])) { return null; }
  seen.add(m[1]);
  if (tokens[m[1]] !== undefined) { return resolve(tokens, tokens[m[1]], seen); }
  return m[2] ? resolve(tokens, m[2].trim(), seen) : null;
}

const css = await readFile(CSS, 'utf8');
const THEMES = [
  { name: 'dark  (default)', tokens: tokensFor(css, ':root {') },
  { name: 'light (opt-in)', tokens: tokensFor(css, ":root[data-theme='light']") },
];

const failures = [];
const passes = [];
let pairs = 0;
const exemptSeen = new Set();

for (const theme of THEMES) {
  if (!theme.tokens) {
    failures.push({ theme: theme.name, why: 'theme block not found in global.css' });
    continue;
  }
  const inks = Object.keys(theme.tokens).filter(k => INK.test(k));
  const surfaces = Object.keys(theme.tokens).filter(k => SURFACE.test(k));
  if (!inks.length || !surfaces.length) {
    failures.push({ theme: theme.name, why: `found ${inks.length} ink and ${surfaces.length} surface tokens` });
    continue;
  }
  for (const ink of inks) {
    const fg = resolve(theme.tokens, theme.tokens[ink]);
    if (!fg || !fg.startsWith('#')) { continue; }
    for (const surface of surfaces) {
      const bg = resolve(theme.tokens, theme.tokens[surface]);
      if (!bg || !bg.startsWith('#')) { continue; }
      pairs += 1;
      const r = ratio(fg, bg);
      const key = `${ink}|${surface}`;
      const exempt = EXEMPT.find(e => e.ink === ink && e.surface === surface);
      if (exempt) { exemptSeen.add(key); if (r >= AA) { failures.push({ theme: theme.name, ink, surface, r, stale: true }); } continue; }
      (r < AA ? failures : passes).push({ theme: theme.name, ink, surface, fg, bg, r });
    }
  }
}

for (const theme of THEMES) {
  if (!theme.tokens) { continue; }
  for (const { fill, ink, why } of FILLS) {
    const bg = resolve(theme.tokens, theme.tokens[fill] || '');
    const fg = resolve(theme.tokens, theme.tokens[ink] || '');
    if (!bg || !fg || !bg.startsWith('#') || !fg.startsWith('#')) {
      failures.push({ theme: theme.name, why: `${ink} on ${fill} could not be resolved` });
      continue;
    }
    pairs += 1;
    const r = ratio(fg, bg);
    (r < AA ? failures : passes).push({ theme: theme.name, ink, surface: `${fill} (${why})`, fg, bg, r });
  }
}

for (const e of EXEMPT) {
  if (!exemptSeen.has(`${e.ink}|${e.surface}`)) {
    failures.push({ theme: 'any', ink: e.ink, surface: e.surface, missing: true });
  }
}

console.log(`Token contrast: ${pairs} ink-on-surface pair(s) across ${THEMES.length} themes, against ${AA}:1.`);

if (showAll) {
  for (const p of passes) {
    console.log(`  ok   ${p.theme}  ${p.ink} on ${p.surface}  ${p.r.toFixed(2)}:1`);
  }
}

if (failures.length) {
  console.log('');
  for (const f of failures) {
    if (f.why) { console.log(`  ${f.theme}: ${f.why}`); }
    else if (f.missing) { console.log(`  stale exemption: ${f.ink} on ${f.surface} is not a pair any more`); }
    else if (f.stale) { console.log(`  stale exemption: ${f.theme} ${f.ink} on ${f.surface} now passes at ${f.r.toFixed(2)}:1, remove it from EXEMPT`); }
    else { console.log(`  ${f.theme}  ${f.ink} (${f.fg}) on ${f.surface} (${f.bg})  ${f.r.toFixed(2)}:1`); }
  }
  console.error(`\nFAIL: ${failures.length} pair(s) under ${AA}:1.`);
  process.exit(1);
}
console.log(`OK: every ink token clears ${AA}:1 on every surface token, in both themes.`);
