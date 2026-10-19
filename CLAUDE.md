# theverylastsuperhero

Shared engineering standard: @.claude/engineering-standards.md. It applies to all work in this repository. This file adds what is specific to the project, and wins where the two disagree.

Companion site for *The Very Last Superhero*, at postheroic.world. Astro, static
output, deployed on Netlify. 104 pages, 87 tracked images.

## Commands

```bash
npm ci
node scripts/check-contrast.mjs  # colour tokens, both themes, run by CI
node scripts/check-contrast.mjs --all   # print the passing pairs too
npm run build                    # astro check, then astro build
node scripts/check-links.mjs     # 4,208 internal references
node scripts/check-copy.mjs      # em dashes and banned words in site copy, run by CI
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
viewports, which takes **5m15s** here: too long to put in front of somebody
changing one essay, and a long job in a pull-request gate carries a worse
property than slowness, because a job cancelled by its own timeout cancels the
whole run and takes the checks that did work with it. It is
`accessibility.yml`, daily plus `workflow_dispatch`.

Its first full walk found three things the contrast check cannot see, which is
the argument for keeping both:

- **`wallpapers`**: `.paper__size span` took `opacity: 0.7` on top of
  `--text-faint`. A token that has been measured is not a starting point to
  take a further 30% off, and the compounded value landed under AA. The same
  compounding cost the OpenStacks landing pages their tag contrast.
- **`constellation` and `map`**: both diagrams are `<svg role="img">`, and both
  then run a script giving their nodes `tabindex="0"` and `role="link"`.
  `role="img"` means *one image, contents not exposed*, so a keyboard user
  reached a control a screen reader would not announce. The children were
  already right; the parent role was the error, and it is `role="group"` now.

Note that a comment cannot go between attributes inside an Astro tag. Putting
one there fails the build with `Expected \`>\` but found \`<\``, which is at
least loud.

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

## Writing standards

The author, Varna Sri Raman, states the rule for everything this site says in its
own voice: "I do NOT write with AI Tells. I write plainly and beautifully, full
sentences, no euphemisms, with facts and explanations. No double em dashes,
flourishes, X NOT Y and other stupidities."

In practice that means full plain sentences with facts in them. It rules out em
dashes (rewrite the sentence, do not just swap in a comma), "not X but Y" and
"it is not X, it is Y" turns (state the positive claim), words such as robust,
crucial, vibrant, genuinely and truly, epigram endings tacked onto a paragraph,
Title Case headings (sentence case, with proper nouns and the book title kept
capitalised), emoji and exclamation marks. En dashes stay in number ranges.

**What the rule covers.** The rule is site wide. It covers everything the site
says, including page text, components, `src/lib/site.ts` labels, meta descriptions,
alt text and the markdown in `src/content/` for lore, timeline, action, act-steps,
after, archive and wallpapers. It also covers the glossary (`src/pages/glossary.astro`
and `src/content/glossary`), the further-reading notes and the afterword on `/making`,
which are adapted from the printed book for the site and say so on the page. In the
further-reading list only the bibliographic citation (author, title, publisher, year)
stays exactly as printed, and the annotation prose follows the rule.

**What it does not cover, and what marks it.** Only three things stay exactly as
they were written, and each carries `data-verbatim`:

- the prologue, Chapter 1 and the extras (`src/content/excerpt`), which are
  presented as printed;
- any line quoted directly from the book, including the epigraph, the lines under
  `blockquote`, the sigil quote list and the transcripts of in-world audio
  recordings;
- reader submissions, meaning memory wall entries and reader fiction.

Markdown cannot carry an attribute, so `scripts/check-copy.mjs` treats every
`blockquote` as verbatim as well. A new place that renders a quotation from the
book needs `data-verbatim` on its wrapping element, or the check will hold it to
the site's standards.

**What enforces it.** `scripts/check-copy.mjs` reads `dist/**/*.html` after a
build, skips scripts, styles and verbatim elements, and fails on an em dash or
one of 29 listed words in the visible text or in a meta description, og:description
or alt attribute. It runs in CI after the link check. It cannot see negative
parallelism, epigram endings or Title Case, so those still need a reader. Run
`node scripts/check-copy.mjs --report` to list the wider word list and the
"not X but Y" candidates as well.

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
