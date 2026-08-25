/**
 * Single source of truth for site-wide metadata. Anything that appears in more
 * than one place — the nav, the footer, OG tags, JSON-LD — comes from here.
 */

export const site = {
  name: 'Postheroic.World',
  title: 'The Very Last Superhero',
  tagline: 'No one flies. But someone stays.',
  description:
    'The Very Last Superhero is an illustrated speculative fiction novel set in a climate-collapsed India, following 14-year-old Sumati through surveillance, floodwater, and the rebirth of memory.',
  url: 'https://www.postheroic.world',
  author: 'Varna Sri Raman',
  publisher: 'StoryWell Books Foundation',
  email: 'info@storywell.in',
  isbn: '978-93-95373-08-1',
  /**
   * Where to buy. `amazon` is the author's own share link for the listing; if it
   * is ever emptied, every buy button falls back to an Amazon search on the
   * book's ISBN rather than going dead.
   */
  buy: {
    amazon: 'https://amzn.in/d/0dqr7bi1',
    publisher: 'https://storywell.in',
  },
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
  /**
   * Analytics, off by default.
   *
   * Set `plausibleDomain` to the site's domain and every page gets the Plausible
   * script — cookieless, no personal data, no consent banner required, and the
   * outbound-links extension so clicks on the Buy button are counted. Leave it
   * empty and no analytics of any kind are loaded; the privacy page reads
   * correctly either way.
   *
   * Netlify Analytics is the alternative: server-side, nothing in the page at
   * all, but it cannot see Buy clicks — which is the number that matters here.
   */
  analytics: {
    /**
     * First-party analytics: the page posts to our own /api/collect function,
     * which writes to our own Supabase table. No third party, no cookies, no
     * device identifier, and no IP stored — so no consent banner is required
     * and no ad blocker has anything to block.
     *
     * Needs ANALYTICS_SUPABASE_URL and ANALYTICS_SUPABASE_KEY set in Netlify.
     * Read the numbers in the Supabase table editor: postheroic_daily,
     * postheroic_top_pages, postheroic_referrers.
     */
    firstParty: true,
    /**
     * Supabase project and publishable key. The key is meant to be public: the
     * table has RLS on with an insert-only policy for it, so a visitor can add
     * a row and can neither read the table back nor change what is there.
     *
     * A Netlify function (netlify/functions/collect.mjs) would keep even this
     * off the page and add a country from Netlify's geo header, but functions
     * only ship when Netlify builds from Git, and this site is deployed by
     * upload. Link the repo in Netlify and the function takes over.
     */
    supabaseUrl: 'https://bivccpsnzzolxuqdvhfu.supabase.co',
    supabaseKey: 'sb_publishable_s5Pvx9fNo_7_ejmFC8fXPQ_Zj_N-9mN',

    /**
     * Free. Cloudflare Web Analytics — no cookies, no consent banner, works on
     * any host (you do not need to use Cloudflare for anything else). Gives
     * visitors, pages, referrers and countries. Sign up, add the site, paste
     * the token here.
     *
     * It cannot see outbound clicks, so it will not tell you how many people
     * clicked Buy.
     */
    cloudflareToken: '' as string,

    /**
     * Free tier. Umami Cloud — cookieless, and it does track custom events, so
     * Buy clicks are counted (the buttons carry data-umami-event). Paste the
     * website ID here; set umamiSrc too if you self-host.
     */
    umamiWebsiteId: '' as string,
    umamiSrc: 'https://cloud.umami.is/script.js' as string,

    /**
     * Paid (~$9/mo). Plausible — cookieless, and its outbound-links extension
     * counts Buy clicks automatically. Set this to the site's domain.
     */
    plausibleDomain: '' as string,
  },
} as const;

/**
 * Primary navigation. Keep this short — the header also carries the brand,
 * search, a buy button and the theme toggle, and the row ran off the screen at
 * 1024–1440px once it grew past about seven links. Everything else lives in
 * `navMore`, which renders as a disclosure.
 */
export const nav = [
  { href: '/about', label: 'About' },
  { href: '/lore', label: 'Archive' },
  { href: '/glossary', label: 'Glossary' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/map', label: 'Map' },
  { href: '/illustrations', label: 'Illustrations' },
] as const;

/** Secondary destinations, grouped under "More" in the header. */
export const navMore = [
  { href: '/making', label: 'On the Making', note: "The author's afterword" },
  { href: '/audio', label: 'Salt Lamp Archive', note: 'Recordings and broadcasts' },
  { href: '/constellation', label: 'Constellation', note: 'The archive as one graph' },
  { href: '/archive', label: 'Objects', note: 'Catalogued artefacts' },
  { href: '/memory', label: 'Memory Wall', note: 'Reader artwork and testimony' },
  { href: '/fanfic', label: 'Reader Fiction', note: 'Stories written in this world' },
  { href: '/wallpapers', label: 'Wallpapers', note: 'The Sumati Series' },
  { href: '/sigil', label: 'Firebird Sigil', note: 'Make your own wallpaper' },
  { href: '/lamplighter', label: 'Lamplighter', note: 'A memory game' },
] as const;

export const footerLinks = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/rss.xml', label: 'RSS' },
  { href: 'https://github.com/Varnasr/theverylastsuperhero', label: 'Source' },
] as const;
