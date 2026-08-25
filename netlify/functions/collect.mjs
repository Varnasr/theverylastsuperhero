/**
 * First-party analytics collector.
 *
 * The page posts here; this function writes to Supabase. Two reasons it is a
 * function rather than a direct call from the browser:
 *
 *   1. The database key stays server-side. Nothing sensitive reaches the page.
 *   2. Netlify hands us the country in a header, so we never see or store an IP.
 *
 * No cookies are set and no identifier is persisted on the device. The
 * visitor_day hash is derived here from a salt plus coarse request data and the
 * date, so two views by the same person on the same day collapse into one
 * visitor and the value is meaningless the next day.
 */

import { createHash } from 'node:crypto';

const SUPABASE_URL = process.env.ANALYTICS_SUPABASE_URL;
const SUPABASE_KEY = process.env.ANALYTICS_SUPABASE_KEY;
const SALT = process.env.ANALYTICS_SALT ?? 'postheroic';

const KINDS = new Set(['pageview', 'buy_click', 'form_submit']);

/** Keep only the origin of a referrer: which site sent them, not which page. */
const sourceOf = (referrer, host) => {
  if (!referrer) return '';
  try {
    const u = new URL(referrer);
    return u.hostname === host ? '' : u.hostname;
  } catch {
    return '';
  }
};

export default async (request, context) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    // Unconfigured is not an error worth surfacing to a reader.
    return new Response(null, { status: 204 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const kind = KINDS.has(body.kind) ? body.kind : 'pageview';
  const path = typeof body.path === 'string' ? body.path.slice(0, 512) : '/';
  const host = request.headers.get('host') ?? '';
  const country = context?.geo?.country?.code ?? null;

  const day = new Date().toISOString().slice(0, 10);
  const visitorDay = createHash('sha256')
    .update(
      [
        SALT,
        day,
        country ?? '',
        request.headers.get('user-agent') ?? '',
        request.headers.get('accept-language') ?? '',
      ].join('|')
    )
    .digest('hex')
    .slice(0, 32);

  const row = {
    kind,
    path,
    referrer: sourceOf(body.referrer, host),
    country,
    form_factor: body.formFactor === 'phone' ? 'phone' : 'desktop',
    visitor_day: visitorDay,
    meta: body.meta && typeof body.meta === 'object' ? body.meta : null,
  };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/postheroic_events`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) console.error('collect: supabase', res.status, await res.text());
  } catch (err) {
    console.error('collect: failed', err);
  }

  // Always 204 — a reader's page should never wait on, or learn about, this.
  return new Response(null, { status: 204 });
};

export const config = { path: '/api/collect' };
