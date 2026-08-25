# 🚧 Postheroic.World – Site Roadmap

## ✅ Done
- Astro rebuild; all content moved into typed collections
- Full lore archive (17 entries) with category filtering and cross-links
- `timeline.html` → `/timeline`, now data-driven and linked to lore entries
- `map.html` → `/map` — interactive SVG schematic of the lamp network
- `memory.html` → `/memory` — reader submissions + Memory Wall gallery
- Salt Lamp audio archive: testimony player with transcripts
- Client-side search across everything (press `/`)
- Wallpapers page (previously the files were in the repo but unlinked)
- Dark/light reading mode, reading progress, print stylesheet
- SEO: OG/Twitter cards, JSON-LD, sitemap, RSS, robots.txt
- Fixed 7 broken images, 2 broken nav links, and the mislabelled `.jpg` files

## 🔜 Next
- Record the first Salt Lamp testimony (the player is built and waiting)
- Connect the Memory Wall form — see `docs/SUBMISSIONS.md`
- Commission or recover artwork for the Satcomm Relic (`status: pending`)
- Re-export the "Walking Alone" wallpaper — the committed file was a failed
  download, not an image
- Supply a text-free hero plate (`corrected_hero` in `image_log.md` was never
  committed); the current hero uses "On Rooftop" instead

## 💡 Ideas
- Self-host the fonts to remove the last third-party request
- p.ai whisper interface — an in-world way to query the archive
- Firebird badge generator
- Character relationship graph, built from the `related` fields already in the
  content files

## 📌 Canon reconciliation

The lore was reconciled against the manuscript (CRC Dec 2025), supplied as a
Google Doc conversion of the camera-ready PDF.

**Source limitation:** that Doc contains only 10,771 words and 15 images and
ends mid-sentence in chapter 2 — Google's PDF-to-Docs OCR captured roughly the
first 40 pages. Both the Drive connector and Google's own `?format=txt` and
`?format=html` exports return the same truncated text, so this is the Doc
itself, not a transfer limit. Chapters 3–17 were never available. To finish the
reconciliation, export from the original manuscript source (Word/InDesign)
rather than from the CRC PDF.

**Corrected from the manuscript's own words:**

- 2055 was **the Great Storms**, not "the Great Bangladesh Flood"
- The 2060 **Disclosures** were Captain Indra's corporate payments and the
  superhero tribunals — not Yamuna Monitoring Division whistleblowers
- Rohan Kapoor is a **climate adaptation researcher of twenty years working on
  waste-to-energy systems**, not a generic "climate scientist and activist"
- Momo is **Nandini's** ginger cat; Myaknju is **Nandini's silent companion**
- Cooling suits are survival equipment — without one, extended exposure means
  heat stroke and death

**Added from the prologue and opening chapters:** the Age of Heroes, Captain
Indra, the Delhi Climate Brigade, the Quantum Corps, waste-to-energy systems,
Buddy, Meera, Nandini Sharma, Rani, Mr Joshi, Dr Gupta, Chandra's crow
behaviour, Serenity Junction, Kishanganj, the Hyper Express, Vikram Malhotra.

**Judgement calls made on unavailable chapters:**

- **The Firebird** — absent from chapters 1–2, but it has commissioned artwork
  and a wallpaper of its own, so it is almost certainly established later. Kept.
- **Chandra** — the crow appears unnamed in chapter 2 and chapter 4 is titled
  "The Crow's Message". Kept, and enriched with the canonical description.
- **"Hysterons"** — appeared in the old index.html but not in the newer
  lore1.html and not in the manuscript. Dropped; Salt Lamps are "crystalline
  Himalayan salt".
- **P.A.I. / p.ai, Moti, Memory Tablets, Virtual Layer Flooring, Obj-V078** —
  not reached by the excerpt. Left exactly as they were rather than guessed at.
