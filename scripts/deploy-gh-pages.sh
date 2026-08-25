#!/usr/bin/env bash
#
# Publishes the built site to a `gh-pages` branch, for when GitHub Actions is
# unavailable.
#
# The normal deployment path is .github/workflows/deploy.yml, which builds and
# publishes on every push to main. This script does the same job from a laptop:
# it builds, copies dist/ onto an orphan `gh-pages` branch, and pushes. Nothing
# from the build ever lands on main.
#
# Point Settings > Pages > Source at "Deploy from a branch", branch `gh-pages`,
# folder `/ (root)`. Switch back to "GitHub Actions" once Actions work again —
# the workflow is already in place and needs no changes.
#
# Usage: npm run deploy:manual

set -euo pipefail

BRANCH="gh-pages"
WORKTREE=".gh-pages-worktree"

cleanup() {
  git worktree remove --force "$WORKTREE" 2>/dev/null || true
  rm -rf "$WORKTREE"
}
trap cleanup EXIT

if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is dirty. Commit or stash first, so it is obvious what is being published."
  exit 1
fi

SOURCE_REF="$(git rev-parse --short HEAD)"
SOURCE_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

echo "Building..."
npm run build

echo "Verifying internal links..."
node scripts/check-links.mjs

cleanup

# Reuse the branch if it exists, otherwise start it with no history — the built
# site has no meaningful diffs, so an accumulating history is just weight.
if git show-ref --verify --quiet "refs/remotes/origin/$BRANCH"; then
  git worktree add "$WORKTREE" -B "$BRANCH" "origin/$BRANCH"
else
  git worktree add --detach "$WORKTREE"
  git -C "$WORKTREE" checkout --orphan "$BRANCH"
fi

# Clear the worktree without touching .git, then lay down the new build.
find "$WORKTREE" -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
cp -r dist/. "$WORKTREE"/

# GitHub Pages serves this branch directly, so it must not be run through Jekyll
# and it must keep the custom domain.
touch "$WORKTREE/.nojekyll"

git -C "$WORKTREE" add -A

if git -C "$WORKTREE" diff --cached --quiet; then
  echo "No change since the last publish."
  exit 0
fi

git -C "$WORKTREE" commit -q -m "Deploy $SOURCE_BRANCH@$SOURCE_REF"
git -C "$WORKTREE" push -u origin "$BRANCH"

echo
echo "Published to $BRANCH."
echo "Set Settings > Pages > Source to 'Deploy from a branch', branch '$BRANCH', folder '/ (root)'."
