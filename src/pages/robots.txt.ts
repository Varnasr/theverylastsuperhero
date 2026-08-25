import type { APIRoute } from 'astro';
import { site } from '../lib/site';

export const GET: APIRoute = ({ site: astroSite }) => {
  const base = (astroSite ?? new URL(site.url)).href.replace(/\/$/, '');

  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    '# The search page is a client-side view over the index below; there is',
    '# nothing there for a crawler that is not already in the sitemap.',
    'Disallow: /search',
    '',
    `Sitemap: ${base}/sitemap-index.xml`,
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
