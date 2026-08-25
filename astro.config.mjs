// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.postheroic.world',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  build: {
    // Directory format emits /lore/salt-lamps/index.html, which every static host
    // resolves without relying on extensionless-HTML fallback behaviour.
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  image: {
    // Ship modern formats; Astro generates the srcset variants at build time.
    responsiveStyles: true,
    layout: 'constrained',
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  vite: {
    build: {
      assetsInlineLimit: 2048,
    },
  },
});
