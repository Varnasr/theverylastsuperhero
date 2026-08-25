import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

/**
 * A flat index of everything searchable, generated at build time.
 *
 * Deliberately small — titles, labels and summaries only, not full bodies. The
 * whole archive fits in a few kilobytes, so search needs no server and no
 * search library: the page fetches this once and filters it in memory.
 */

interface Doc {
  t: string; // title
  u: string; // url
  k: string; // kind (shown as the result's category label)
  d: string; // description
}

export const GET: APIRoute = async () => {
  const [lore, timeline, archive, wallpapers] = await Promise.all([
    getCollection('lore', ({ data }) => !data.draft),
    getCollection('timeline'),
    getCollection('archive'),
    getCollection('wallpapers'),
  ]);

  const docs: Doc[] = [
    ...lore.map((e) => ({
      t: e.data.title,
      u: `/lore/${e.id}`,
      k: e.data.category,
      d: `${e.data.designation} — ${e.data.summary}`,
    })),
    ...timeline.map((e) => ({
      t: `${e.data.yearLabel}: ${e.data.title}`,
      u: `/timeline#${e.id}`,
      k: 'Timeline',
      d: e.data.summary,
    })),
    ...archive.map((e) => ({
      t: e.data.title,
      u: '/archive',
      k: 'Object',
      d: e.data.summary,
    })),
    ...wallpapers.map((e) => ({
      t: e.data.title,
      u: '/wallpapers',
      k: 'Wallpaper',
      d: e.data.summary,
    })),
    // Static pages worth finding by name.
    { t: 'About the book', u: '/about', k: 'Page', d: 'The story, its themes, and its making.' },
    {
      t: 'Memory Wall',
      u: '/memory',
      k: 'Page',
      d: 'Reader artwork and testimony contributed to the archive.',
    },
    {
      t: 'Resistance Map',
      u: '/map',
      k: 'Page',
      d: 'Schematic of the lamp routes between Resistance zones.',
    },
  ];

  return new Response(JSON.stringify(docs), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
