import { site } from './site';

const CATALOGUE = 'https://storywell.in/content/books/books.json';
const BOOK_ID = 'the-very-last-superhero';

export interface BookPrice {
  price: number;
  inStock: boolean;
}

/**
 * Reads the cover price from the publisher's live catalogue at build time.
 * Never throws: on any failure it falls back to the pinned `site.price` and
 * warns, so a network error cannot fail the build.
 */
export async function getBookPrice(): Promise<BookPrice> {
  const fallback: BookPrice = { price: site.price, inStock: true };
  try {
    const res = await fetch(CATALOGUE, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const list: any[] = Array.isArray(data) ? data : (data.books ?? []);
    const entry = list.find((b) => b?.id === BOOK_ID);
    const price = Number(entry?.price);
    if (!entry || !Number.isFinite(price) || price <= 0) throw new Error('entry or price missing');
    if (price !== site.price) {
      console.warn(`[price] live price ${price} differs from pinned site.price ${site.price}; update site.ts`);
    }
    return { price, inStock: entry.enabled !== false };
  } catch (err) {
    console.warn(`[price] could not read live price (${(err as Error).message}); using pinned ${site.price}`);
    return fallback;
  }
}

/** Indian digit grouping, e.g. 1,25,000. */
export function formatRupees(n: number): string {
  return '\u20b9' + n.toLocaleString('en-IN');
}
