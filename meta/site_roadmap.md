# 🚧 Postheroic.World – Site Roadmap

## ✅ Done
- Machine voices: four synthetic broadcasts (P.A.I., the intercepted fork, the
  2061 Curriculum notice, an emissions bulletin) generated offline with Piper,
  bilingual Hindi + English. Human testimony is deliberately *not* synthesised —
  see docs/CONTENT.md. **The Hindi needs a native-speaker check.**
- `/lamplighter` — a memory game: the archive plays a sequence of lamps, you
  repeat it back. The book's argument about memory, as a rule
- `/sigil` — Firebird wallpaper generator (was "Firebird badge generator"),
  drawn in canvas at real device resolution, with a line from the archive
- `/constellation` — character relationship graph (was an idea), built from the
  `related` fields the content files already carry
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
- **Check the in-book / not-in-book flags on /illustrations.** 34 pieces were
  imported and 14 are currently marked as appearing in the published book — those
  are guesses from subject matter, not knowledge. Correct `CAPTIONS` in
  `src/pages/illustrations.astro`; `inBook: true` shows it as published, omitting
  it marks the piece "not in the book"
- Paste the real Amazon product URL into `buy.amazon` in `src/lib/site.ts`. Until
  then every buy button falls back to an Amazon search on the ISBN
- Check the Hindi in `scripts/generate-broadcasts.py` — written without a native
  speaker, and it is the state's voice, so the register matters
- Optional: regenerate with Sarvam AI for true Indian-English voices (API is
  reachable; needs a key)
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
- Human Salt Lamp testimony — the player and the empty slots are waiting. Even
  two or three real voices would carry it against the machine broadcasts

## 📌 Canon reconciliation

**The site is not a transcript of the novel.** It is a companion archive, and it
is meant to hold more than the book does — material that extends the world
rather than restating it. The manuscript settles questions of fact where the two
overlap; it is not a ceiling on what the archive may contain.

That distinction was got wrong once already: "hysterons" were removed on the
grounds that they did not appear in the available manuscript extract. They do
appear in the text, and in any case the extract covered only chapters 1–2, so
absence from it was never evidence of anything. Hysterons are restored and now
have an entry of their own.

**Corrected from the manuscript's own words:**

- 2055 was **the Great Storms**, not "the Great Bangladesh Flood"
- The 2060 **Disclosures** were Captain Indra's corporate payments and the
  superhero tribunals — not Yamuna Monitoring Division whistleblowers
- Rohan Kapoor is a **climate adaptation researcher of twenty years working on
  waste-to-energy systems**, not a generic "climate scientist and activist"
- Momo is **Nandini's** ginger cat; Myaknju is **Nandini's silent companion**
- Cooling suits are survival equipment — without one, extended exposure means
  heat stroke and death

**Drawn from the prologue and opening chapters:** the Age of Heroes, Captain
Indra, the Delhi Climate Brigade, the Quantum Corps, waste-to-energy systems,
Buddy, Meera, Nandini Sharma, Rani, Mr Joshi, Dr Gupta, Chandra's crow
behaviour, Serenity Junction, Kishanganj, the Hyper Express, Vikram Malhotra.

**Extended beyond the text** — written for the archive, consistent with the book
but not lifted from it. Correct or cut any of it freely; it is the site's voice,
not the novel's:

- **Hysterons** — the entry builds on hysteresis, a real property where a
  material's state depends on its own history. If the novel defines them
  otherwise, this entry should follow the novel.
- **Salt Lamps** — the argument that a record needing re-speaking is a record
  with people attached to it
- **The Resistance map** — the zone network and lamp routes are a schematic
  invented for the site; the novel never draws one

**Available manuscript:** the supplied Google Doc holds 10,771 words and stops
mid-sentence in chapter 2 — Google's PDF-to-Docs OCR captured roughly the first
40 pages, and both the Drive connector and Google's own txt/html exports return
the same truncated text. A .docx export from the original manuscript source
would carry all 17 chapters. Entries resting on later chapters (P.A.I., Moti,
Memory Tablets, Virtual Layer Flooring, Obj-V078) were left as they stood.
