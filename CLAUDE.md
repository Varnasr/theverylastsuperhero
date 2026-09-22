# theverylastsuperhero

Companion site for *The Very Last Superhero*, at postheroic.world. Astro, static
output, deployed on Netlify. 104 pages, 87 tracked images.

## Commands

```bash
npm ci
npm run build                   # astro check, then astro build
node scripts/check-links.mjs    # 4,208 internal references
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
