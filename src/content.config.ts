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
       * Oral testimony held in this entry's Salt Lamp, if any. Path is relative to
       * /public/audio. See docs/CONTENT.md for the recording conventions.
       */
      testimony: z
        .object({
          src: z.string(),
          title: z.string(),
          speaker: z.string(),
          recorded: z.string(),
          duration: z.string().optional(),
          transcript: z.string().optional(),
        })
        .optional(),
      related: z.array(reference('lore')).default([]),
      /** Links this entry to a hotspot on the Resistance map. */
      mapZone: z.string().optional(),
      draft: z.boolean().default(false),
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
const memory = defineCollection({
  loader: glob({ base: './src/content/memory', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      contributor: z.string(),
      location: z.string().optional(),
      kind: z.enum(['artwork', 'testimony']),
      image: image().optional(),
      imageAlt: z.string().optional(),
      added: z.coerce.date(),
    }),
});

export const collections = { lore, timeline, archive, wallpapers, memory };
