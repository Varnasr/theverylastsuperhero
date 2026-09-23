# The Memory Wall form

**The form is on, and needs no relay.** Netlify Forms accepts the POST from a
static page: the `data-netlify="true"` attribute is read at deploy time, Netlify
registers the form, and submissions arrive in the site's Forms tab. There is no
server code and no third party in the path.

## What went wrong, so it is not repeated

This page used to open by saying Netlify "cannot run server code on a page
request" and that a third-party relay was therefore required. That is wrong
about Netlify Forms, and it had a cost.

The site moved to Netlify on 25 August 2026 and Netlify registered all four
forms that day — `memory-wall`, `fanfic`, `updates`, `corrigenda`. But
`site.formEndpoint` was empty, `/memory` computed `formLive` from it, and the
inline fallback script therefore called `preventDefault()` on every submit and
redirected to `mailto:`. The form was live at Netlify's end and unreachable at
the reader's, and `memory-wall` sat at **zero submissions for four weeks**.

`formEndpoint` is now an override rather than the switch, and `site.netlifyForms`
says what is actually true. If you ever move off Netlify, set `formEndpoint` and
turn `netlifyForms` off together.

## Setup

None. It is already on. Submissions appear under **Forms** in the Netlify
dashboard for `postheroic-world`, and Netlify can email them on.

If you ever want a third-party relay instead — Formspree, Basin, Web3Forms all
work the same way — set its endpoint as `formEndpoint` in `src/lib/site.ts` and
set `netlifyForms: false`. The endpoint then becomes the form's `action`.

## What the form already handles

- **Spam** — a hidden `_gotcha` honeypot field, declared to Netlify with
  `netlify-honeypot="_gotcha"`. Bots fill it in; people never see it. Netlify
  drops any submission where it is non-empty, and runs its own spam filtering
  on top.
- **Artwork** — the Memory Wall form carries a file input and
  `enctype="multipart/form-data"`, so a photo of a drawing can be attached
  directly. It used to ask contributors to host the image somewhere and paste a
  link, which is a step most people sending a child's crayon drawing will not
  take.
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
