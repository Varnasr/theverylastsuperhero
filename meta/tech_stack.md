# 🛠️ Site Tech Stack

- **Astro 5** — static site generator, zero client JS by default
- **TypeScript** (strict) — `astro check` gates every build
- **Content collections** — lore, timeline, objects and wallpapers are typed
  markdown validated against Zod schemas in `src/content.config.ts`
- **Modern CSS** — `@layer`, custom properties, fluid `clamp()` type scale,
  `color-mix()`. No CSS framework
- Fonts: Merriweather (display) + IBM Plex Sans (body) + IBM Plex Mono (labels),
  via Google Fonts
- Images: Astro's sharp-backed pipeline, WebP at multiple widths
- Deployment: GitHub Actions → GitHub Pages
- Image generation: DALL·E 3 (prompt-based)

No UI framework, no client router. The interactive pieces — search, filters,
the map, the Salt Lamp player, the theme toggle — are vanilla TypeScript and all
degrade gracefully without JS.

See `docs/CONTENT.md` for how to add content.
