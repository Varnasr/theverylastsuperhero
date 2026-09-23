/* ==========================================================================
   Accessibility audit over every page in this repository.

       node scripts/axe.mjs            # audit, fail on serious or critical
       node scripts/axe.mjs --all      # print moderate and minor too
       node scripts/axe.mjs --page wage-gap/index.html
       node scripts/axe.mjs --json      # every node, for working through
       node scripts/axe.mjs --allow-degraded   # accept a run with no network

   Why this exists, and why it walks the tree rather than a list.

   scripts/check.py is static. It reads the Content-Security-Policy against
   what the pages reference and it cannot tell you whether a control has a
   name, whether a label points at anything, or what a colour measures
   against its background. Those are the failures that reach a reader, and
   none of them throws.

   The list is the tree. Every .html file found under the repository root is
   audited, so a tool added tomorrow is covered by existing. A hardcoded list
   is the mistake the ImpactMojo repository is still living with, where the
   axe job tests ten pages and pa11y nineteen and a page joins neither by
   being created.

   Two viewports, because a layout failure at 390px is invisible at 1280px
   and the phone is where most of these tools are opened. The horizontal
   overflow check rides along for the same reason: it is one measurement,
   it costs nothing once a browser is open, and a page that scrolls sideways
   on a phone looks perfect on the machine it was built on.

   WHAT A LOCAL RUN DOES NOT REPRODUCE

   The server here sends no headers, so the Content-Security-Policy in
   netlify.toml is absent and nothing is blocked by it. A page that would
   fail in production for a CSP reason passes here. scripts/check.py is what
   covers that, and the two are not substitutes for each other.

   External subresources are also a hazard rather than a detail. In a sandbox
   the browser usually cannot reach a CDN, so a chart library or a font may
   never arrive and the page under audit is not the page a reader sees. A
   clean result on a page that failed to load most of itself is worse than no
   result, so every failed request is counted and printed, and a page that
   lost a script says so beside its own score.
   ========================================================================== */

import { createServer } from 'node:http';
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');

const args = process.argv.slice(2);
const showAll = args.includes('--all');
const asJson = args.includes('--json');
const allowDegraded = args.includes('--allow-degraded');
const onlyPage = flag('--page');

function flag(name) {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1];
}

/* Serious and critical fail. Moderate and minor are printed on --all and are
   deliberately not a gate: a repository that has never run axe would go red
   on its first run for things nobody can triage in one sitting, and a gate
   nobody can get green is a gate that gets deleted. */
const FAILING = new Set(['serious', 'critical']);

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'phone', width: 390, height: 844 },
];

const SKIP_DIRS = new Set(['_astro']);

async function pages(dir = ROOT, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) { continue; }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { await pages(full, out); }
    else if (entry.name.endsWith('.html')) { out.push(path.relative(ROOT, full)); }
  }
  return out.sort();
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.csv': 'text/csv', '.pdf': 'application/pdf',
};

function serve() {
  const server = createServer(async (req, res) => {
    let rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
    let file = path.join(ROOT, rel);
    /* Resolve against the root so a traversal cannot read outside it; this
       server is local and short-lived but it still reads the filesystem. */
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    try {
      if ((await stat(file)).isDirectory()) { file = path.join(file, 'index.html'); }
    } catch { /* fall through to the read, which reports it */ }
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
    }
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

/* In CI `npx playwright install chromium` puts the browser where
   playwright-core expects it and no path is needed. In the agent sandbox a
   Chromium is pre-installed under a versioned directory that does not match
   the version playwright-core asks for, so it has to be found. */
function chromiumPath() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!base || !existsSync(base)) { return undefined; }
  for (const name of require('node:fs').readdirSync(base)) {
    const candidate = path.join(base, name, 'chrome-linux', 'chrome');
    if (name.startsWith('chromium-') && existsSync(candidate)) { return candidate; }
  }
  return undefined;
}

async function main() {
  const { chromium } = await import('playwright-core');
  const axeSource = await readFile(require.resolve('axe-core/axe.min.js'), 'utf8');

  const all = await pages();
  const list = onlyPage ? all.filter(p => p === onlyPage || p.startsWith(onlyPage)) : all;
  if (!list.length) {
    console.error(onlyPage ? `No page matches ${onlyPage}` : 'No pages found.');
    process.exit(1);
  }

  const server = await serve();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: chromiumPath() });

  const failures = [];
  const advisory = [];
  const overflow = [];
  const degraded = [];
  let audited = 0;

  for (const page of list) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const tab = await context.newPage();

      const lost = new Set();
      tab.on('requestfailed', r => {
        const url = r.url();
        if (!url.startsWith(origin)) { lost.add(new URL(url).host); }
      });
      const errors = [];
      tab.on('pageerror', e => errors.push(String(e).split('\n')[0]));

      try {
        await tab.goto(`${origin}/${page}`, { waitUntil: 'load', timeout: 30000 });
      } catch (e) {
        failures.push({ page, vp: vp.name, id: 'navigation', impact: 'critical',
                        help: `page did not load: ${String(e).split('\n')[0]}`, nodes: [] });
        await context.close();
        continue;
      }
      /* axe reads computed style, so it needs the page to have painted. A
         fixed wait is crude and reliable; networkidle never settles on a page
         holding a websocket or a poll, and several of these do. */
      await tab.waitForTimeout(600);

      await tab.addScriptTag({ content: axeSource });
      const result = await tab.evaluate(async () => {
        /* eslint-disable no-undef */
        return await axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
          resultTypes: ['violations'],
        });
      });

      for (const v of result.violations) {
        const row = { page, vp: vp.name, id: v.id, impact: v.impact, help: v.help,
                      nodes: (asJson ? v.nodes : v.nodes.slice(0, 3)).map(n => n.target.join(' ')),
                      why: asJson ? v.nodes.slice(0, 2).map(n => n.failureSummary) : undefined };
        (FAILING.has(v.impact) ? failures : advisory).push(row);
      }

      if (vp.name === 'phone') {
        const wide = await tab.evaluate(() =>
          document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (wide > 0) { overflow.push({ page, px: wide }); }
      }

      if (lost.size || errors.length) {
        degraded.push({ page, vp: vp.name, hosts: [...lost], errors: errors.slice(0, 2) });
      }
      audited += 1;
      await context.close();
    }
  }

  await browser.close();
  server.close();

  if (asJson) {
    /* Every node, not the first three, because fixing is done against the
       whole list and the human report is deliberately abridged. */
    process.stdout.write(JSON.stringify({ failures, advisory, overflow, degraded }, null, 2) + '\n');
    process.exit(failures.length || overflow.length ? 1 : 0);
  }

  const byPage = new Set(list).size;
  console.log(`axe-core over ${byPage} page(s) x ${VIEWPORTS.length} viewport(s) = ${audited} audits.`);

  if (degraded.length) {
    /* Printed before the result, not after, because a clean score on a page
       that lost half its scripts is not a clean score. */
    const hosts = new Set(degraded.flatMap(d => d.hosts));
    console.log(`\nIncomplete loads: ${degraded.length} audit(s) had a failed request or a page error.`);
    if (hosts.size) { console.log(`  unreachable: ${[...hosts].sort().join(', ')}`); }
    for (const d of degraded.slice(0, 8)) {
      const why = d.errors.length ? d.errors[0] : d.hosts.join(', ');
      console.log(`  ${d.page} @${d.vp}  ${why}`);
    }
    if (degraded.length > 8) { console.log(`  … and ${degraded.length - 8} more`); }
  }

  if (overflow.length) {
    console.log(`\nHorizontal overflow at 390px (${overflow.length}):`);
    for (const o of overflow) { console.log(`  ${o.page}  ${o.px}px wider than the viewport`); }
  }

  const show = list => {
    const byId = new Map();
    for (const f of list) {
      const key = `${f.impact} · ${f.id} · ${f.help}`;
      if (!byId.has(key)) { byId.set(key, []); }
      byId.get(key).push(`${f.page}@${f.vp}${f.nodes.length ? ` (${f.nodes[0]})` : ''}`);
    }
    for (const [key, where] of [...byId.entries()].sort()) {
      console.log(`  ${key}`);
      console.log(`    ${where.slice(0, 6).join(', ')}${where.length > 6 ? ` … and ${where.length - 6} more` : ''}`);
    }
  };

  if (advisory.length && showAll) {
    console.log(`\nAdvisory, moderate and minor (${advisory.length}):`);
    show(advisory);
  } else if (advisory.length) {
    console.log(`\n${advisory.length} moderate or minor finding(s). Run with --all to list them.`);
  }

  /* A degraded run is not a result, and printing that as a warning was not
     enough: this script reported sixteen incomplete loads, said OK, and CI
     then found a contrast failure on `hyd-sir` that only exists once Chart.js
     has drawn the list it is in. The warning was right there and I shipped
     anyway, so it is a failure now. CI has a network and sees none of these;
     an offline run passes --allow-degraded and is told, loudly, what that
     result is worth. */
  if (degraded.length && !allowDegraded) {
    console.error(`\nFAIL: ${degraded.length} audit(s) ran against a page that could not load` +
                  ` everything it asks for, so this run does not describe the real page.` +
                  `\nRe-run with a network, or pass --allow-degraded to accept a partial result.`);
    process.exit(1);
  }
  if (degraded.length && allowDegraded) {
    console.log('\nAccepting a degraded run (--allow-degraded). Whatever those pages' +
                ' failed to load was not audited, and a green result here does not cover it.');
  }

  if (failures.length || overflow.length) {
    if (failures.length) {
      console.log(`\nSerious or critical (${failures.length}):`);
      show(failures);
    }
    console.error(`\nFAIL: ${failures.length} serious or critical violation(s)` +
                  `${overflow.length ? ` and ${overflow.length} page(s) overflowing at 390px` : ''}.`);
    process.exit(1);
  }

  console.log('\nOK: no serious or critical violations, and no page overflows at 390px.');
}

main().catch(err => { console.error(err); process.exit(1); });
