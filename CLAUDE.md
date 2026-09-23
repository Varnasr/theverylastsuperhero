# theverylastsuperhero

Companion site for *The Very Last Superhero*, at postheroic.world. Astro, static
output, deployed on Netlify. 104 pages, 87 tracked images.

## Commands

```bash
npm ci
node scripts/check-contrast.mjs  # colour tokens, both themes, run by CI
node scripts/check-contrast.mjs --all   # print the passing pairs too
npm run build                    # astro check, then astro build
node scripts/check-links.mjs     # 4,208 internal references
node scripts/axe.mjs             # accessibility over the built pages
npm run dev
```

## The build is the test

There is no unit test suite, and it is not obviously missing one: the site is
content plus layouts. What stands in for tests is the combination CI already
runs, and it is stronger than it looks.

- `astro check` type-checks every component and content-collection entry. It
  reports 0 errors and 0 warnings, with 106 hints.
- `astro build` renders all 104 pages. A broken frontmatter reference or a
  missing collection entry fails here rather than in a browser.
- `scripts/check-links.mjs` walks the built output and resolves every internal
  reference, 4,208 of them, against the files actually emitted.

When changing anything structural, run all three. A page count that moves
without a page being added or removed is the signal worth watching.

## The colour tokens were wrong in both themes, and an audit would not have said so

`--text-faint` measured **4.00:1 on `--surface`** and had been checked against
`--bg` alone, where it passes at 4.67:1. It styles every eyebrow, caption and
byline on the site. Chasing that one token turned up four more, all of them in
the light theme, none of them visible to anyone auditing the dark default:

| token | was | on | now |
|---|---|---|---|
| `--text-faint` (dark) | 3.56:1 | `--surface-hover` | 4.70:1 |
| `--text-faint` (light) | 3.71:1 | `--bg-sunken` | 4.84:1 |
| `--amber` (light) | 4.39:1 | `--bg-sunken` | 5.05:1 |
| `--amber-dim` (light) | 2.67:1 | `--bg-sunken` | 5.17:1 |
| `--ember` (light) | 2.63:1 | `--bg-sunken` | 4.60:1 |
| `--ember` (dark) | 4.49:1 | `--surface-hover` | 4.96:1 |

`--amber-dim` is the meta line on every lore card and `--ember` is the text of
the corrupted badge, so neither is decorative. `--ember` had **no light value at
all**: the dark one was inherited onto cream.

**And the Buy button was failing as shipped.** `.buy--primary` wrote
`color: #131211` as a literal on `background: var(--amber)`. In the dark theme
that is 12.48:1 and right; in the light theme the amber is itself dark and it
measured **3.53:1**. Every other amber button on the site already writes
`color: var(--bg)`, which is correct in both. That is the fix.

That last one is the reason `scripts/check-contrast.mjs` measures **both
directions**. `--amber` is ink on a light surface *and* a fill under dark ink,
and those pull opposite ways: darkening it to fix the nav item makes the button
worse. A check that only walked ink-on-surface would have approved the change
that broke the button.

**What it does not cover**, and this is not a small gap: a colour written as a
literal in a component, and a colour composited with opacity, are both invisible
to it. The Buy button above is exactly that case, and it was found by hand.
`scripts/axe.mjs` over the built pages is what catches the class.

The two run in different places on purpose. The contrast check gates pull
requests, because it reads the token blocks and finishes in under a second. The
axe walk builds the site, installs Chromium and audits 104 pages at two
viewports, which took **over ten minutes** here: too long to put in front of
somebody changing one essay, and a long job in a pull-request gate carries a
worse property than slowness, because a job cancelled by its own timeout
cancels the whole run and takes the checks that did work with it. It is
`accessibility.yml`, daily plus `workflow_dispatch`.

`scripts/axe.mjs` **fails on a run that could not load everything the page
asks for**, rather than warning. In a sandbox `fonts.googleapis.com` and the
Supabase origin the memory wall reads are both unreachable, so the audited page
is not the page a reader gets. The sibling script in `Experiments` printed that
as a warning above an `OK`, it was ignored, and CI then found a contrast
failure that only existed once the blocked library had drawn the element. Pass
`--allow-degraded` to accept a partial result and be told what it is worth.

## The September 2026 dependency upgrade

Astro went 5.18.2 to 7.3.3, two majors, because staying put was the larger risk.
`npm audit` reported 4 vulnerabilities including a **critical remote code
execution through AVIF image optimisation** (GHSA-26w7-cxv4-gfx2), a high
host-header SSRF, a high reflected XSS via unescaped slot name, and seven
moderate or low cross-site scripting issues. Every one of them is fixed only
above 7.2.7, so there was no patch-level way out.

Most of those advisories concern server-rendered output, and this site is fully
prerendered, which narrows the exposure. The AVIF one does not: it is a
build-time path, and this build optimises 484 images.

Verified rather than assumed, on the same machine before and after: 104 pages
both times, 4,208 internal references and 0 broken both times, `astro check`
clean, and `npm audit` from 4 vulnerabilities to 0. `sharp` went to 0.35.4 for
its own libvips and libheif advisories, `@astrojs/sitemap` to 3.7.4.

TypeScript is deliberately held at 5.x. Version 7 is the Go rewrite, and
`@astrojs/check` has not been verified against it here.

## Watch out for

- **`npm audit` is load-bearing in this repository**, more than in most, because
  Astro ships the whole rendering path. Run it when you touch dependencies, and
  read the advisory rather than the severity count: a critical that only affects
  SSR matters less here than a high that affects the build.
- **Images are optimised at build time** into `_astro/*.webp`, 484 of them.
  Adding a large source image lengthens every cold build; the cache makes warm
  builds fast, which is why the first build took 20 seconds and the second 2.6.
- **`scripts/check-links.mjs` runs against `dist/`**, so it needs a build first.
  It catches the failure mode this kind of site actually has: a renamed page
  leaving references behind.
