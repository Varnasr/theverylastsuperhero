/**
 * Single source of truth for site-wide metadata. Anything that appears in more
 * than one place — the nav, the footer, OG tags, JSON-LD — comes from here.
 */

export const site = {
  name: 'Postheroic.World',
  title: 'The Very Last Superhero',
  tagline: 'A novel of memory, collapse, and the girl who lit the last lamp.',
  description:
    'The Very Last Superhero is an illustrated speculative fiction novel set in a climate-collapsed India, following 14-year-old Sumati through surveillance, floodwater, and the rebirth of memory.',
  url: 'https://www.postheroic.world',
  author: 'Varna Sri Raman',
  publisher: 'StoryWell Books Foundation',
  email: 'info@storywell.in',
  isbn: '978-93-95373-08-1',
  edition: 'First Edition 2026',
  chapters: 17,
  /** Real-world campaign the book is dedicated to. */
  campaign: {
    label: "The battle against Delhi's waste-to-energy plants",
    url: 'https://bit.ly/DelhiWTE',
  },
  epigraph: {
    text: 'Every empire that forgets its own data will be remembered by its wreckage.',
    attribution: 'Resistance slogan, spray-painted near Okhla, 2061',
  },
  locale: 'en_IN',
  themeColor: '#131211',
  /**
   * Endpoint for the reader-submission form. GitHub Pages cannot run server
   * code, so submissions are posted to a third-party form relay. Set this to
   * your own Formspree (or equivalent) endpoint to switch the form on; while it
   * is empty the form renders in a clearly-labelled disabled state instead of
   * silently failing.
   *
   * See docs/SUBMISSIONS.md for setup.
   */
  formEndpoint: '' as string,
} as const;

export const nav = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/lore', label: 'Lore Archive' },
  { href: '/constellation', label: 'Constellation' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/map', label: 'Map' },
  { href: '/archive', label: 'Objects' },
  { href: '/memory', label: 'Memory Wall' },
  { href: '/wallpapers', label: 'Wallpapers' },
  { href: '/lamplighter', label: 'Lamplighter' },
] as const;

export const footerLinks = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/rss.xml', label: 'RSS' },
  { href: 'https://github.com/Varnasr/theverylastsuperhero', label: 'Source' },
] as const;
