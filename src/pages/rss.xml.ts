import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../lib/site';

/**
 * The archive as a feed. Lore entries carry no publication date of their own, so
 * items are ordered by their archive order and dated from the build — readers
 * following along get new entries as they are recovered.
 */
export const GET: APIRoute = async (context) => {
  const lore = (await getCollection('lore', ({ data }) => !data.draft)).sort(
    (a, b) => a.data.order - b.data.order
  );

  return rss({
    title: `${site.title} — Lore Archive`,
    description: site.description,
    site: context.site ?? site.url,
    items: lore.map((entry) => ({
      title: entry.data.title,
      description: `${entry.data.category} · ${entry.data.designation} — ${entry.data.summary}`,
      link: `/lore/${entry.id}`,
      categories: [entry.data.category],
    })),
    customData: `<language>en-in</language>`,
  });
};
