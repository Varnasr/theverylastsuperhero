/**
 * Composes public/og-book.jpg, the 1200x630 share card for the book itself,
 * used by /, /about and /excerpts.
 *
 * Rendered by headless Chromium from an HTML template rather than by sharp:
 * librsvg lays text out with whatever fonts the machine happens to have, and a
 * share card that quietly falls back to DejaVu looks nearly right and is not.
 * The two faces the site uses (Merriweather 700, IBM Plex Mono 500, both OFL)
 * are kept in scripts/og-fonts so the card renders the same everywhere.
 *
 *   node scripts/make-og-book.mjs
 *
 * Needs playwright-core and a Chromium (PLAYWRIGHT_BROWSERS_PATH, or CHROME).
 * Run it from the repository root. Committed output, not a build step: change
 * the copy or the cover, run it again, commit the JPEG.
 */
import { readFile, readdir, stat, writeFile, mkdtemp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const W = 1200;
const H = 630;
const OUT = 'public/og-book.jpg';

async function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  for (const d of (await readdir(base)).sort().reverse()) {
    if (!d.startsWith('chromium-')) continue;
    const p = path.join(base, d, 'chrome-linux', 'chrome');
    if (existsSync(p)) return p;
  }
  throw new Error('No Chromium found. Set CHROME.');
}

const b64 = async (f) => (await readFile(f)).toString('base64');
const mer = await b64('scripts/og-fonts/merriweather-700.woff2');
const mono = await b64('scripts/og-fonts/ibm-plex-mono-500.woff2');
const cover = await b64('src/assets/cover.jpg');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Mer;font-weight:700;src:url(data:font/woff2;base64,${mer})}
@font-face{font-family:Mono;font-weight:500;src:url(data:font/woff2;base64,${mono})}
*{box-sizing:border-box;margin:0}
body{width:${W}px;height:${H}px;background:#131211;color:#f2efe9;position:relative;overflow:hidden;
  background-image:radial-gradient(ellipse at 82% 50%,#2b2118 0%,#131211 62%)}
.rule{position:absolute;left:0;top:0;width:12px;height:100%;background:#ffcb6b}
.copy{position:absolute;left:72px;top:0;bottom:0;width:640px;display:flex;flex-direction:column;justify-content:center}
.eyebrow{font:500 22px/1 Mono,'DejaVu Sans Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:#ffcb6b}
h1{font:700 78px/1.08 Mer,Georgia,serif;margin-top:28px;letter-spacing:-.01em}
.tag{font:700 34px/1.3 Mer,Georgia,serif;font-style:normal;color:#ffcb6b;margin-top:30px}
.by{font:500 25px/1.4 Mono,'DejaVu Sans Mono',monospace;color:#d8d1c7;margin-top:30px}
.foot{font:500 26px/1 Mono,'DejaVu Sans',monospace;color:#f2efe9;margin-top:34px;padding-top:26px;border-top:2px solid #4a4441}
.foot b{color:#ffcb6b;font-weight:500}
.cover{position:absolute;right:72px;top:85px;height:460px;width:auto;border-radius:6px;box-shadow:0 18px 50px rgba(0,0,0,.65)}
</style></head><body>
<div class="rule"></div>
<div class="copy">
  <p class="eyebrow">Climate fiction · Delhi, 2075</p>
  <h1>The Very Last Superhero</h1>
  <p class="tag">No one flies. But someone stays.</p>
  <p class="by">An illustrated novel by Varna Sri Raman</p>
  <p class="foot">Paperback <b>₹699</b> · postheroic.world</p>
</div>
<img class="cover" src="data:image/jpeg;base64,${cover}" alt="">
</body></html>`;

const browser = await chromium.launch({ executablePath: await findChrome() });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const png = await page.screenshot({ type: 'png' });
await browser.close();

await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toFile(OUT);
const { size } = await stat(OUT);
console.log(`${OUT}: ${W}x${H}, ${(size / 1024).toFixed(0)} KB`);
