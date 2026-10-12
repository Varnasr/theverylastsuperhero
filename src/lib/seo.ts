import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import { site } from './site';

/** Size of every share card, generated or committed. */
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export interface ShareImage {
  image: string;
  imageWidth?: number;
  imageHeight?: number;
  imageAlt: string;
}

/**
 * The committed card for the book itself (scripts/make-og-book.mjs), used by
 * the pages that sell it: /, /about and /excerpts.
 */
export const bookCard: ShareImage = {
  image: '/og-book.jpg',
  imageWidth: OG_WIDTH,
  imageHeight: OG_HEIGHT,
  imageAlt:
    'The Very Last Superhero, an illustrated novel by Varna Sri Raman: the cover, with the tagline "No one flies. But someone stays."',
};

/**
 * A 1200x630 JPEG cut from a page's own illustration at build time.
 *
 * Without this every page shared the one default card, so a link to a lore
 * entry with its own artwork previewed as the homepage. The tags only claim a
 * size when the file is certain to have it.
 */
export async function ogCard(src: ImageMetadata, alt: string): Promise<ShareImage> {
  const img = await getImage({
    src,
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fit: 'cover',
    position: 'attention',
    format: 'jpg',
    quality: 80,
  });
  // img.attributes echoes the *requested* size, but sharp never enlarges: a
  // 1024px-wide source yields a 1024px-wide card. Only a source that already
  // covers 1200x630 is guaranteed to come out at exactly that, so the size is
  // reported for those and left out (unknown) for the rest.
  const exact = src.width >= OG_WIDTH && src.height >= OG_HEIGHT;
  return {
    image: img.src,
    imageWidth: exact ? OG_WIDTH : undefined,
    imageHeight: exact ? OG_HEIGHT : undefined,
    imageAlt: alt,
  };
}

interface BookLdInput {
  price: number;
  inStock: boolean;
  /** Absolute URL of the cover image. */
  imageUrl: string;
}

/** The Book object shared by /, /about and /excerpts. Nothing here is invented: no ratings, reviews or release date. */
export function bookJsonLd({ price, inStock, imageUrl }: BookLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: site.title,
    author: { '@type': 'Person', name: site.author },
    publisher: { '@type': 'Organization', name: site.publisher },
    genre: ['Speculative fiction', 'Climate fiction', 'Young adult'],
    inLanguage: 'en',
    abstract: site.description,
    url: site.url,
    image: imageUrl,
    isbn: site.isbn,
    bookEdition: site.edition,
    bookFormat: 'https://schema.org/Paperback',
    illustrator: { '@type': 'Person', name: site.author },
    offers: [
      {
        '@type': 'Offer',
        price,
        priceCurrency: 'INR',
        availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: site.buy.publisher,
        seller: { '@type': 'Organization', name: 'StoryWell Books Foundation' },
      },
    ],
    about: ['Climate change', 'Memory and oral history', 'Artificial intelligence ethics', 'India'],
  };
}

/** A short Book reference for pages that belong to the book (lore entries). */
export const bookRef = { '@type': 'Book', name: site.title, url: site.url, isbn: site.isbn } as const;
