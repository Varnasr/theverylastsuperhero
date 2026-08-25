#!/usr/bin/env bash
#
# Deploy to Netlify, refusing to ship a stale build.
#
# This exists because a broken YAML frontmatter made `astro build` fail while a
# previous dist/ sat on disk; zipping and uploading that shipped an old site
# that looked fine. The build now has to succeed in this run, and the link
# checker has to pass, before anything is uploaded.
#
# Usage: NETLIFY_PAT=... scripts/deploy-netlify.sh

set -euo pipefail

SITE_ID="${NETLIFY_SITE_ID:-cd0553bf-2d5e-4d00-9882-0596afeeb5e6}"
: "${NETLIFY_PAT:?NETLIFY_PAT is not set}"

echo "Building..."
rm -rf dist
npm run build

[ -d dist ] || { echo "No dist/ after build."; exit 1; }

echo "Verifying internal links..."
node scripts/check-links.mjs

ZIP="$(mktemp -d)/deploy.zip"
(cd dist && zip -qr "$ZIP" .)

echo "Uploading..."
DEPLOY=$(curl -sf -X POST "https://api.netlify.com/api/v1/sites/$SITE_ID/deploys" \
  -H "Authorization: Bearer $NETLIFY_PAT" \
  -H "Content-Type: application/zip" \
  --data-binary "@$ZIP" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')

echo "Deploy $DEPLOY — waiting..."
until [ "$(curl -sf -H "Authorization: Bearer $NETLIFY_PAT" \
  "https://api.netlify.com/api/v1/sites/$SITE_ID/deploys/$DEPLOY" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["state"])')" = "ready" ]; do
  sleep 5
done

echo "Live: https://www.postheroic.world"
