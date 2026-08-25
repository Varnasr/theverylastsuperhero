import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Every piece of the world is data, not hand-copied markup. Adding a lore entry
 * means adding one markdown file — the archive index, search index, related-entry
 * links, sitemap and RSS feed all pick it up automatically.
 */

const loreCategories = [
  'Technology',
  'Symbol',
  'System',
  'Character',
  'Object',
  'Infrastructure',
  'Creature',
  'Network',
  'Location',
  'Techwear',
  'Event',
] as const;

const lore = defineCollection({
  loader: glob({ base: './src/content/lore', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      category: z.enum(loreCategories),
      /** The short italic descriptor shown under the title, e.g. "Archive Memory System". */
      designation: z.string(),
      summary: z.string(),
      /** Controls ordering within the archive; lower sorts first. */
      order: z.number().default(100),
      image: image().optional(),
      imageAlt: z.string().optional(),
      /**
       * Audio held against this entry. Two kinds, and the distinction is the
       * point of the whole feature:
       *
       *   testimony — a human voice, held in a Salt Lamp. A record survives
       *               because a person re-speaks it, so these are recorded, not
       *               synthesised.
       *   broadcast — an institution talking: P.A.I., the Curriculum Division,
       *               an emissions bulletin. Machines recite rather than
       *               remember, so a synthetic voice is the honest one here.
       *
       * Paths are relative to /public/audio. See docs/CONTENT.md.
       */
      testimony: z
        .object({
          src: z.string(),
          title: z.string(),
          speaker: z.string(),
          recorded: z.string(),
          duration: z.string().optional(),
          /**
           * Either a plain string, or segments for multilingual audio. Segments
           * carry a BCP-47 code so each is marked with `lang` in the markup —
           * without it a screen reader reads Devanagari with English phonetics.
           */
          transcript: z
            .union([
              z.string(),
              z.array(z.object({ lang: z.string(), text: z.string() })).min(1),
            ])
            .optional(),
          kind: z.enum(['testimony', 'broadcast']).default('testimony'),
        })
        .optional(),
      related: z.array(reference('lore')).default([]),
      /** Links this entry to a hotspot on the Resistance map. */
      mapZone: z.string().optional(),
      draft: z.boolean().default(false),
    }),
});

const glossary = defineCollection({
  loader: glob({ base: './src/content/glossary', pattern: '**/*.md' }),
  schema: z.object({
    /** The headword exactly as the book prints it. */
    term: z.string(),
    /** The book groups terms; the page keeps those groupings. */
    section: z.string().optional(),
    /**
     * Real-world starting points for the technology or idea behind a term.
     * Open access only — a reader should not hit a paywall following a
     * reference out of a novel's glossary.
     */
    references: z
      .array(z.object({ label: z.string(), url: z.string().url(), note: z.string().optional() }))
      .default([]),
    order: z.number().default(100),
    /** Lore entries this term explains, for cross-linking back into the archive. */
    related: z.array(reference('lore')).default([]),
  }),
});

const action = defineCollection({
  loader: glob({ base: './src/content/action', pattern: '**/*.md' }),
  schema: z.object({
    name: z.string(),
    url: z.string().url(),
    /** Section heading on the page. */
    group: z.string(),
    order: z.number().default(100),
  }),
});

const reading = defineCollection({
  loader: glob({ base: './src/content/reading', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    /** The bibliography's own grouping, e.g. "Surveillance, AI, and Control Systems". */
    section: z.string(),
    publisher: z.string().optional(),
    year: z.number().optional(),
    /** The book's note on why this work matters to the novel. */
    relevance: z.string().optional(),
    order: z.number().default(100),
  }),
});

const timeline = defineCollection({
  loader: glob({ base: './src/content/timeline', pattern: '**/*.md' }),
  schema: z.object({
    /** Numeric year used for sorting. For ranges, use the first year. */
    year: z.number(),
    /** Displayed label, which may be a range such as "2040s–2050s". */
    yearLabel: z.string(),
    title: z.string(),
    summary: z.string(),
    /** Redacted events render with the archive's corruption treatment. */
    classified: z.boolean().default(false),
    related: z.array(reference('lore')).default([]),
  }),
});

const archive = defineCollection({
  loader: glob({ base: './src/content/archive', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** Catalogue designation, e.g. "Obj-V078". */
      designation: z.string().optional(),
      summary: z.string(),
      image: image().optional(),
      imageAlt: z.string().optional(),
      /**
       * `recovered`  — artefact and image both present
       * `corrupted`  — artefact known, data partial
       * `pending`    — catalogued but no artwork recovered yet
       */
      status: z.enum(['recovered', 'corrupted', 'pending']).default('recovered'),
      order: z.number().default(100),
      related: z.array(reference('lore')).default([]),
    }),
});

const wallpapers = defineCollection({
  loader: glob({ base: './src/content/wallpapers', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      image: image(),
      imageAlt: z.string(),
      orientation: z.enum(['phone', 'desktop']).default('phone'),
      order: z.number().default(100),
    }),
});

/**
 * Approved reader contributions. Nothing here is user-writable at runtime — a
 * submission arrives by email via the form, a human reviews it, and it becomes a
 * markdown file. That keeps the site static and unmoderatable-by-strangers.
 */
const fanfic = defineCollection({
  loader: glob({ base: './src/content/fanfic', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    /** Optional link the writer wants readers to follow — their blog, AO3, wherever. */
    authorUrl: z.string().url().optional(),
    /** One-line hook shown on the index. */
    summary: z.string(),
    /**
     * Where in the world it sits. Free text rather than an enum: readers will
     * find corners the book never named, and the point is to let them.
     */
    setting: z.string().optional(),
    /** Lore entries the piece leans on, so it cross-links into the archive. */
    related: z.array(reference('lore')).default([]),
    added: z.coerce.date(),
    /** Roughly how long a read, e.g. "1,800 words". */
    length: z.string().optional(),
    /** Content notes, shown before the piece. */
    notes: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const memory = defineCollection({
  loader: glob({ base: './src/content/memory', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      contributor: z.string(),
      location: z.string().optional(),
      kind: z.enum(['artwork', 'testimony']),
      /** Contributors often give an age rather than a place; both are optional. */
      age: z.number().int().positive().optional(),
      image: image().optional(),
      imageAlt: z.string().optional(),
      added: z.coerce.date(),
      /**
       * Keeps the shipped template out of the wall. It also keeps the
       * collection non-empty, which stops Astro reporting "the collection
       * does not exist or is empty. Please check your content config file for
       * errors" on every build — accurate but alarming, since an empty wall is
       * the correct state until the first reader writes in.
       */
      draft: z.boolean().default(false),
    }),
});

export const collections = {
  action, glossary, fanfic, reading, lore, timeline, archive, wallpapers, memory };
