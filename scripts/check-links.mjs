/**
 * Verifies that every internal link and asset reference in the built site
 * resolves to a real file.
 *
 * This is the check that would have caught the bugs this site shipped with for
 * months: a stylesheet pointing at hero.jpg when the file was hero.png, nav
 * links to a lore.html that never existed, and seven <img> tags whose sources
 * were absent or differently-cased. Those are all silent in a browser — you get
 * a blank box, not an error — so they need a build-time check.
 *
 * Runs against dist/ after `astro build`. Exits non-zero if anything is broken.
 *
 * Usage: node scripts/check-links.mjs [dist-dir]
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, dirname, resolve, relative } from 'node:path';

const DIST = process.argv[2] ?? 'dist';

async function* walk(dir) {
  for (const name of await readdir(dir)) {
    const path = join(dir, name);
    if ((await stat(path)).isDirectory()) yield* walk(path);
    else yield path;
  }
}

const exists = async (path) => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};

const pages = [];
for await (const path of walk(DIST)) if (path.endsWith('.html')) pages.push(path);

if (pages.length === 0) {
  console.error(`No HTML found in ${DIST}/ — run \`npm run build\` first.`);
  process.exit(1);
}

const broken = [];
let checked = 0;

for (const page of pages) {
  const html = await readFile(page, 'utf8');

  for (const [, ref] of html.matchAll(/(?:href|src)="([^"]*)"/g)) {
    // Off-site, in-page, and non-navigational schemes are out of scope here;
    // external URLs are covered by the lychee job.
    if (!ref || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ref)) continue;

    // Client-side templates inside inline scripts are markup to the regex but
    // not to the browser. `${...}` never appears in a real emitted URL.
    if (ref.includes('${')) continue;

    checked++;
    const clean = ref.split('#')[0].split('?')[0];
    if (!clean) continue;

    const target = clean.startsWith('/')
      ? resolve(DIST, '.' + clean)
      : resolve(dirname(page), clean);

    const ok =
      (await exists(target)) ||
      (await exists(join(target, 'index.html'))) ||
      (await exists(`${target}.html`));

    if (!ok) broken.push({ page: relative(DIST, page), ref });
  }
}

for (const { page, ref } of broken) console.error(`BROKEN  /${page}  ->  ${ref}`);

console.log(
  `\n${pages.length} pages, ${checked} internal references checked, ${broken.length} broken.`
);

process.exit(broken.length > 0 ? 1 : 0);
