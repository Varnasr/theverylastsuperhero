/**
 * Generates the 1200×630 social-share card.
 *
 * Sourced from the "On Rooftop" artwork rather than hero.png, because that file
 * has the title and tagline baked into the pixels — overlaying live text on it
 * produces two overlapping headlines. If a text-free hero plate is added later
 * (meta/image_log.md records one as `corrected_hero`), point SOURCE at it.
 *
 * Run with `node scripts/make-og-image.mjs` after changing the source art.
 */
import { stat } from 'node:fs/promises';
import sharp from 'sharp';

const SOURCE = 'src/assets/wallpapers/on-rooftop.jpg';
const W = 1200;
const H = 630;

const src = sharp(SOURCE);
const { width = 0, height = 0 } = await src.metadata();

// Take a landscape band across the full width, positioned on the horizon and the
// figure rather than the empty foreground.
const bandHeight = Math.round((width * H) / W);
const top = Math.max(0, Math.min(Math.round(height * 0.17), height - bandHeight));

const overlay = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="scrim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"  stop-color="#131211" stop-opacity="0.94"/>
      <stop offset="52%" stop-color="#131211" stop-opacity="0.80"/>
      <stop offset="100%" stop-color="#131211" stop-opacity="0.08"/>
    </linearGradient>
    <linearGradient id="foot" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%"  stop-color="#131211" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#131211" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <rect width="${W}" height="${H}" fill="url(#foot)"/>
  <text x="72" y="238" font-family="Georgia, 'Times New Roman', serif"
        font-size="23" fill="#ffcb6b" letter-spacing="4.5">AN ILLUSTRATED SPECULATIVE NOVEL</text>
  <text x="70" y="316" font-family="Georgia, 'Times New Roman', serif"
        font-size="66" font-weight="bold" fill="#f2efe9">The Very Last Superhero</text>
  <text x="72" y="372" font-family="Georgia, 'Times New Roman', serif"
        font-size="28" font-style="italic" fill="#c9c2b8">Memory, collapse, and the girl</text>
  <text x="72" y="410" font-family="Georgia, 'Times New Roman', serif"
        font-size="28" font-style="italic" fill="#c9c2b8">who lit the last lamp.</text>
  <text x="72" y="470" font-family="monospace" font-size="21" fill="#8d857c">postheroic.world</text>
</svg>`);

await src
  .extract({ left: 0, top, width, height: Math.min(bandHeight, height) })
  .resize(W, H, { fit: 'cover' })
  .modulate({ brightness: 1.18 })
  .composite([{ input: overlay, top: 0, left: 0 }])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile('public/og-default.jpg');

const { size } = await stat('public/og-default.jpg');
console.log(`public/og-default.jpg written — ${W}×${H}, ${Math.round(size / 1024)} KB`);
