# The Very Last Superhero | Postheroic.World

[![Website](https://img.shields.io/badge/site-postheroic.world-blue)](https://www.postheroic.world)
[![License: CC BY-NC-ND 4.0](https://img.shields.io/badge/Content-CC%20BY--NC--ND%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-nd/4.0/)
[![Code: MIT](https://img.shields.io/badge/Code-MIT-green.svg)](./LICENSE)
[![GitHub Last Commit](https://img.shields.io/github/last-commit/Varnasr/theverylastsuperhero)](https://github.com/Varnasr/theverylastsuperhero/commits/main)

**A fully illustrated speculative fiction novel set in a climate-collapsed India — blending AI, memory, and resistance through the eyes of a 14-year-old girl.**

The companion website for *The Very Last Superhero*, at [postheroic.world](https://www.postheroic.world).

---

## About the story

*The Very Last Superhero* is set in a near-future India where climate collapse has shattered centralised systems of power. In this world, heroism is not superpowers or spectacle — it is memory, care, and the courage to hold a community together when everything else has fallen apart.

The story follows **Sumati**, a 14-year-old girl navigating a post-collapse landscape where oral history, memory technology, and everyday acts of resistance shape what comes next. It is a story about what we choose to remember, and why it matters.

**Themes:** Climate collapse, memory and oral history, AI and technology ethics, youth agency, resistance, care economies, post-heroic politics.

---

## The world

The novel is built around the **Resistance Archive** — 33 lore entries, 12 timeline events and a catalogue of recovered objects, all authored as data rather than as pages.

| Element | Description |
|---------|-------------|
| **The Age of Heroes** | Two decades of plasma suits and corporate sponsorship, ended by the 2060 Disclosures |
| **Salt Lamps** | Memory-storage technology central to the Resistance's oral archive |
| **Waste-to-energy** | The pilot plants Rohan reviews — the novel's link to a real, ongoing Delhi campaign |
| **The Firebird** | The symbol that signals the return of belief, risk, and memory |
| **Sumati** | The protagonist — a teenager who becomes an unexpected keeper of collective memory |
| **P.A.I. / p.ai** | The state surveillance network, and the Resistance's sabotaged fork of it |
| **The Collapse** | The environmental and political catastrophe that restructured Indian society |

---

## What the site does

| | |
|---|---|
| **Lore Archive** | Every entry, filterable by kind, with automatic two-way cross-links to the timeline |
| **Timeline** | The chronology from the Heroic Period to the lighting of the last lamp |
| **Constellation** | All 33 entries and the 70 links between them as one graph, laid out at build time so it ships as static SVG |
| **Resistance Map** | An interactive SVG schematic of lamp routes between zones, keyboard-navigable and linked to the archive |
| **Search** | Client-side search across everything, no server and no search library. Press <kbd>/</kbd> anywhere |
| **Salt Lamp testimony** | An audio archive with two voices: human testimony held in a lamp, and synthetic state broadcasts on a relay mast. Built on a real `<audio>` element, with transcripts |
| **Memory Wall** | Reader artwork and testimony, human-reviewed before anything appears |
| **Wallpapers** | The Sumati Series, free for personal use |
| **Firebird Sigil** | A wallpaper generator — sigil, palette and a line from the archive, drawn in canvas at real device resolution |
| **Lamplighter** | A memory game. The archive plays a sequence of Salt Lamps; you repeat it back |
| **Reading mode** | A persistent dark/light toggle, reading-progress bar, and a print stylesheet |

---

## Tech stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | [Astro 5](https://astro.build) | Static output, zero client JS by default. The site is HTML by the time it reaches a reader |
| Content | Astro content collections + Zod | Lore, timeline, objects and wallpapers are typed markdown. A mistyped cross-reference fails the build |
| Language | TypeScript (strict) | `astro check` runs before every build and deploy |
| Styling | Modern CSS — `@layer`, custom properties, `clamp()`, `color-mix()` | No CSS framework, no runtime |
| Images | Astro's built-in pipeline (sharp) | Automatic WebP at multiple widths with correct `srcset` and intrinsic sizing |
| Hosting | GitHub Pages via GitHub Actions | Same host, same domain, now with a real build step |

No UI framework. No client-side router. The interactive pieces — search, filters, the map, the audio player, the theme toggle — are a few kilobytes of vanilla TypeScript, and every one of them degrades to something usable without JavaScript.

---

## Project structure

```
src/
├── content/            # The world, as data
│   ├── lore/           #   33 archive entries
│   ├── timeline/       #   12 chronology events
│   ├── archive/        #   catalogued objects
│   ├── wallpapers/     #   the Sumati Series
│   └── memory/         #   approved reader contributions
├── content.config.ts   # Schemas — the contract every content file is checked against
├── assets/             # Artwork, processed by the image pipeline
├── components/         # Nav, Footer, LoreCard, SaltLampPlayer, ThemeToggle
├── layouts/            # BaseLayout — head, SEO, theme, reading progress
├── lib/                # site.ts (config), map-zones.ts, constellation.ts (graph layout)
├── pages/              # Routes, including rss.xml, robots.txt, search-index.json
└── styles/global.css   # Design tokens and the whole design system
public/                 # Served as-is: favicon, CNAME, OG card
scripts/                # Image optimisation, OG card generation, link checking
docs/                   # CONTENT.md, SUBMISSIONS.md
```

---

## Local development

```bash
git clone https://github.com/Varnasr/theverylastsuperhero.git
cd theverylastsuperhero
npm install

npm run dev        # http://localhost:4321, with hot reload
npm run build      # type-check, then build to dist/
npm run preview    # serve the built site
```

Useful extras:

```bash
npm run check                   # type-check only
npm run optimise:images         # re-encode new artwork out of PNG
node scripts/make-og-image.mjs  # regenerate the social share card
node scripts/check-links.mjs    # verify every internal link in dist/
```

Node 20 or newer.

---

## Adding content

You do not edit HTML. Adding a lore entry means adding one markdown file, and the archive index, search index, RSS feed, sitemap and cross-links all update themselves.

See **[docs/CONTENT.md](./docs/CONTENT.md)** for the frontmatter of every collection, how to attach audio testimony to an entry, and the pre-commit checks.

See **[docs/SUBMISSIONS.md](./docs/SUBMISSIONS.md)** to switch on the Memory Wall form.

---

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which type-checks, builds, and publishes `dist/` to GitHub Pages. `CNAME` and `.nojekyll` live in `public/` so they survive the build.

The repository's Pages setting must be **Source: GitHub Actions** rather than *Deploy from a branch*.

Every pull request additionally runs a build, a type-check, an internal link check across the built site, and an external link check.

### If GitHub Actions is unavailable

```bash
npm run deploy:manual
```

This builds, verifies every internal link, and publishes `dist/` to a `gh-pages` branch. Set **Pages → Source** to *Deploy from a branch*, branch `gh-pages`, folder `/ (root)`.

Nothing from the build lands on `main`. When Actions is working again, switch **Pages → Source** back to *GitHub Actions* — the workflow is already in place and needs no changes.

---

## Contributing

This is a creative project. Contributions are welcome in the spirit of the story — thoughtful, careful, and oriented toward the long-term.

See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## License

- **Story, lore, and artwork:** [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/) — share freely with credit, but not commercially and not modified. Fan art and translations are welcome; ask first and permission is usually a formality.
- **Site code:** [MIT](./LICENSE)

---

## Contact

- **Website:** [postheroic.world](https://www.postheroic.world)
- **Email:** info@storywell.in
- **The book:** ISBN 978-93-95373-08-1, StoryWell Books Foundation, First Edition 2026
- **GitHub:** [github.com/Varnasr](https://github.com/Varnasr)
