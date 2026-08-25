# Turning on the Memory Wall form

The site is static and hosted on Netlify, which cannot run server code on a page request.
A submission form therefore needs a third-party relay that accepts the POST and
emails it on.

Until one is configured, `/memory` renders a clearly-labelled fallback pointing
readers at the contact email. That is intentional — a form that silently drops
submissions is worse than no form.

## Setup

1. Create a form at a relay service. [Formspree](https://formspree.io) has a
   free tier that suits this volume; [Basin](https://usebasin.com) and
   [Web3Forms](https://web3forms.com) work the same way.
2. Copy the endpoint URL it gives you (it looks like
   `https://formspree.io/f/xxxxxxxx`).
3. Put it in `src/lib/site.ts`:

   ```ts
   formEndpoint: 'https://formspree.io/f/xxxxxxxx',
   ```

4. Commit and push. The form replaces the fallback on the next deploy.

## What the form already handles

- **Spam** — a hidden `_gotcha` honeypot field. Bots fill it in; people never
  see it. Formspree drops any submission where it is non-empty.
- **Consent** — the form states that a submission may be displayed with
  attribution, and links to the Terms.
- **Validation** — required fields and `type="email"` are enforced by the
  browser before anything is sent.

## What happens to a submission

A submission is an email, not a database row. Nothing reaches the site
automatically:

1. The relay emails you the contribution.
2. You read it and decide.
3. If you are publishing it, add a file to `src/content/memory/` and, for
   artwork, an image to `src/assets/memory/`. See
   [CONTENT.md](./CONTENT.md#reader-contributions).
4. Commit. It appears on the next deploy.

This is slower than a live comment system, and that is the point: there is no
moderation queue to keep on top of, no way for a stranger to publish to the
site, and no user data stored anywhere but your inbox.

## A note on privacy

`privacy.astro` describes what happens to a contributor's name and email. If you
switch to a relay that behaves differently — one that stores submissions, or
sets a cookie — update that page to match. It currently states that submissions
are kept only to reply and to display the contribution with attribution.
