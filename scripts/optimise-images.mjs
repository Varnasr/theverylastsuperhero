/**
 * Re-encodes the source artwork out of PNG.
 *
 * Every image in src/assets is a photographic AI render at 1024–1536px. PNG is
 * lossless, which for this kind of content means ~2–3.6 MB per file to store
 * detail no eye will ever recover. Astro already generates optimised variants
 * for display, but the *sources* are still emitted into the build and still sit
 * in the working tree, so the waste survives the build pipeline.
 *
 *   Wallpapers -> JPEG q92. They are downloaded and set as phone backgrounds,
 *                 and JPEG is the format every phone gallery accepts.
 *   Everything else -> WebP q88. Display-only, so the better codec wins.
 *
 * Idempotent: already-converted files are skipped. The original PNGs remain
 * recoverable from git history.
 *
 * Usage: npm run optimise:images [-- --dry]
 */
import { readdir, stat, unlink } from 'node:fs/promises';
import { join, extname, basename, dirname } from 'node:path';
import sharp from 'sharp';

const ROOT = 'src/assets';
const DRY = process.argv.includes('--dry');

/** Wallpapers are downloaded by readers, so they keep a universally-openable format. */
const isWallpaper = (path) => path.includes(`${ROOT}/wallpapers`);

async function* walk(dir) {
  for (const name of await readdir(dir)) {
    const path = join(dir, name);
    if ((await stat(path)).isDirectory()) yield* walk(path);
    else yield path;
  }
}

let before = 0;
let after = 0;
let converted = 0;

for await (const path of walk(ROOT)) {
  if (extname(path).toLowerCase() !== '.png') continue;

  const target = join(
    dirname(path),
    `${basename(path, extname(path))}${isWallpaper(path) ? '.jpg' : '.webp'}`
  );

  const from = (await stat(path)).size;
  before += from;

  if (DRY) {
    console.log(`would convert ${path} -> ${target} (${(from / 1024).toFixed(0)} KB)`);
    continue;
  }

  const pipeline = sharp(path);
  await (isWallpaper(path)
    ? pipeline.jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: '4:4:4' })
    : pipeline.webp({ quality: 88, effort: 6 })
  ).toFile(target);

  const to = (await stat(target)).size;
  after += to;
  converted++;

  await unlink(path);
  console.log(
    `${path} -> ${target}  ${(from / 1024).toFixed(0)} KB -> ${(to / 1024).toFixed(0)} KB ` +
      `(${Math.round((1 - to / from) * 100)}% smaller)`
  );
}

if (!DRY && converted > 0) {
  console.log(
    `\n${converted} images: ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB ` +
      `(${Math.round((1 - after / before) * 100)}% smaller)`
  );
  console.log('Remember to update the .png references in src/content and src/pages.');
} else if (!DRY) {
  console.log('Nothing to convert — sources are already optimised.');
}
