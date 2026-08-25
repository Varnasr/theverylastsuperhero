# Adding to the archive

**The archive is meant to hold more than the novel does.** Entries may extend
the world — a material the book names once and never explains, a place mentioned
in passing, a piece of reasoning the story implies but never states. Where the
site and the book overlap, the book decides; everywhere else, the archive is
free to be its own thing. Write accordingly.

Everything on this site — every lore entry, timeline event, archive object,
wallpaper and reader contribution — is a markdown file in `src/content/`.
Adding one file is enough: the index pages, the search index, the RSS feed, the
sitemap and the cross-links between entries all pick it up on the next build.

You never edit HTML to add content.

---

## Lore entries

Create `src/content/lore/<slug>.md`. The filename becomes the URL, so
`salt-lamps.md` is served at `/lore/salt-lamps`.

```markdown
---
title: Salt Lamps
category: Technology
designation: Archive Memory System
summary: Forged from crystalline Himalayan salt, these lamps store and relay living histories.
order: 1
image: ../../assets/lore/salt-lamp.webp
imageAlt: A glowing Himalayan salt lamp, its crystal lit from within
related: [memory-tablets, the-resistance]
mapZone: treasure-room
---

The body text goes here, in markdown. The first paragraph usually restates the
summary; everything after it is the entry proper.
```

| Field | Required | Notes |
|---|---|---|
| `title` | yes | Displayed heading |
| `category` | yes | One of: Technology, Symbol, System, Character, Object, Infrastructure, Creature, Network, Location, Techwear, Event. Drives the filter chips on `/lore` |
| `designation` | yes | The short italic descriptor, e.g. "Archive Memory System" |
| `summary` | yes | One sentence. Used on cards, in search, in the RSS feed and as the page description |
| `order` | no | Lower sorts first. Defaults to 100 |
| `image` | no | Path relative to the markdown file. Astro optimises it — do not put images in `public/` |
| `imageAlt` | no | Required whenever `image` is set, for screen readers |
| `related` | no | Slugs of other lore entries. Validated at build: a typo fails the build rather than producing a dead link |
| `mapZone` | no | Links the entry to a node in `src/lib/map-zones.ts` |
| `testimony` | no | See below |
| `draft` | no | `true` hides the entry from the built site |

Cross-links are one-directional in the file but two-directional on the site:
if a timeline event lists a lore entry in its `related`, that lore entry
automatically grows an "In the chronology" section pointing back. You do not
maintain both sides.

---

## Audio: testimony and broadcasts

Lore entries can carry audio, and there are two kinds. The distinction is the
whole point, not a formatting detail.

**Testimony** is a human voice held in a Salt Lamp. A record survives because a
person re-speaks it — that is the novel's argument — so these are *recorded, never
synthesised*. A synthetic voice reciting a memory is precisely the thing the
Resistance is working against.

**Broadcasts** are institutions talking: P.A.I., the Curriculum Division, an
emissions bulletin. Machines recite rather than remember, so a synthetic voice is
the honest choice there. Four are already generated.

The player shows the difference before a word plays: testimony gets a warm salt
crystal that breathes, a broadcast gets a cold relay mast with pulsing signal
rings. An entry with a broadcast and no human account says so, and links to the
Memory Wall.

### Adding testimony (recorded)

1. Put the file in `public/audio/`. MP3 or M4A, under about 10 MB.
2. Add to the entry's frontmatter:

```yaml
testimony:
  src: /audio/rohan-log-01.mp3
  title: Encrypted log, fragment one
  speaker: Rohan Kapoor
  recorded: "2072"
  duration: "4:12"
  kind: testimony      # the default; may be omitted
  transcript: >
    Collapse doesn't mean the end. It means the truth has outlived its
    suppressors.
```

`src`, `title`, `speaker` and `recorded` are required. Always write the
transcript — it is the only way a deaf reader gets the content, and it is what
search engines index.

The player is built on a real `<audio>` element, so it works with JavaScript
disabled. Only one plays at a time.

### Adding a broadcast (synthetic)

Broadcasts are generated locally, offline, with no account and no per-word cost:

```bash
pip install piper-tts lameenc
python3 -m piper.download_voices en_GB-alan-medium --data-dir .voices
python3 scripts/generate-broadcasts.py
```

Add an entry to `BROADCASTS` in `scripts/generate-broadcasts.py` and re-run.
Set `degrade: True` for an intercepted fragment — a tremolo, a noise floor and
periodic dropouts, applied deterministically so builds stay reproducible.

Then reference it from the entry with `kind: broadcast`. Keep the `transcript`
identical to the script in that file.

The voice model is ~63 MB and is git-ignored; re-download it with the command
above. The generated MP3s *are* committed, so a normal build never needs Piper.

## Timeline events

Create `src/content/timeline/<slug>.md`. Events sort by `year`, so the filename
does not matter.

```markdown
---
year: 2069
yearLabel: "2069"
title: The Yamuna Breach
summary: Four embankments failed. Thousands were displaced. Delhi drowned.
classified: false
related: [the-collapse]
---
```

Use `year` for sorting and `yearLabel` for display — that is how a range such as
`2040s–2050s` sorts correctly while still reading properly. Quote numeric labels
or YAML turns them into integers.

`classified: true` renders the event with the archive's redacted treatment
(dashed border, ember marker).

---

## Archive objects

Create `src/content/archive/<slug>.md`.

```markdown
---
title: Satcomm Relic
designation: Obj-V101
summary: Rusted rooftop antenna used by the Resistance to intercept broadcasts.
status: pending
order: 6
related: [the-resistance]
---
```

`status` is one of:

- `recovered` — artefact and artwork both present
- `corrupted` — artefact known, data partial
- `pending` — catalogued but no artwork yet; renders a hatched placeholder
  rather than a broken image

Set `status: recovered` and add `image`/`imageAlt` once artwork exists.

---

## Wallpapers

Create `src/content/wallpapers/<slug>.md` and put the artwork in
`src/assets/wallpapers/`. Wallpapers are stored as JPEG rather than WebP
because readers download them and set them as phone backgrounds, and every
phone gallery opens a JPEG.

---

## Reader contributions

Approved Memory Wall submissions become files in `src/content/memory/`:

```markdown
---
title: Sumati on the roof
contributor: Asha R.
location: Bengaluru
kind: artwork
image: ../../assets/memory/asha-rooftop.jpg
imageAlt: Ink drawing of a girl seated on a rooftop above floodwater
added: 2026-09-14
---
```

Nothing publishes itself. A submission arrives by email, a person reads it, and
someone commits a file. That is deliberate: it keeps the site static and means
no stranger can put anything on the wall.

`src/content/memory/template.md` is a ready-made copy of the above with
`draft: true`. Copy it, rename it, fill it in, set `draft: false`. Leave the
template in place — it keeps the collection valid while the wall is still
empty.

---

## Images

Put images in `src/assets/`, never in `public/`. Assets under `src/` go through
Astro's image pipeline: it generates WebP at several widths, writes the
`srcset`, and sets width/height so the page does not shift as images load.
Anything in `public/` is served raw.

After adding new artwork, run:

```bash
npm run optimise:images
```

This re-encodes PNGs to WebP (or JPEG for wallpapers). It is idempotent and it
matters: the site's original 13 images were 32.5 MB of PNG, which this reduces
to 4.8 MB with no visible difference.

If you change the hero artwork, regenerate the social card too:

```bash
node scripts/make-og-image.mjs
```

---

## Before committing

```bash
npm run build          # type-checks the content schema, then builds
node scripts/check-links.mjs   # verifies every internal link resolves
```

Both run in CI on every pull request. A mistyped `related` slug or a missing
image is a build failure, not a silently broken page.
