#!/usr/bin/env bash
# Fast-forward origin/main to origin/staging (once staging has been manually
# validated at https://negre.co/staging-bicing-2026/), then build the result
# on the droplet's prod bicing-2026 clone. See SKILL.md for the reasoning.
set -euo pipefail

DROPLET_HOST="dig-oce"
PROD_DIR="/home/javi/negre.co-server/apps/bicing-2026"
PM2_APP="negre-co-server"

cd "$(git rev-parse --show-toplevel)"

echo "==> Fetching latest origin/staging and origin/main"
git fetch origin staging main

STAGING_SHA="$(git rev-parse origin/staging)"
MAIN_SHA="$(git rev-parse origin/main)"

if [ "$STAGING_SHA" = "$MAIN_SHA" ]; then
  echo "origin/main already matches origin/staging ($MAIN_SHA) -- nothing to promote."
  exit 0
fi

if ! git merge-base --is-ancestor origin/main origin/staging; then
  echo "ERROR: origin/main is not an ancestor of origin/staging." \
       "staging has diverged from main in a way that isn't a fast-forward --" \
       "resolve this manually (do not force-push main) before promoting." >&2
  exit 1
fi

echo "==> Fast-forwarding origin/main ($MAIN_SHA) to origin/staging ($STAGING_SHA)"
# Pushes the fetched origin/staging ref straight to the remote main branch.
# This never touches your local working branch or checkout.
git push origin origin/staging:refs/heads/main

echo "==> Deploying to production on $DROPLET_HOST"
ssh "$DROPLET_HOST" bash -s <<EOF
set -euo pipefail
export NVM_DIR="\$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"
cd "$PROD_DIR"

echo "--> git status before reset (should normally be empty on a deploy-only clone):"
git status --short || true

git fetch origin main
git reset --hard origin/main
npm ci
BASE_PATH=/bicing-2026/ npm run build

echo "--> Build complete. bicing-2026 has no nginx alias and is served by" \
     "server.ts's plain express.static mount, which stats files per request" \
     "-- the new build is live immediately, no PM2 reload needed."

if pm2 describe "$PM2_APP" 2>/dev/null | grep -q 'status.*online'; then
  echo "--> $PM2_APP is online"
else
  echo "WARNING: $PM2_APP does not appear to be online -- check 'pm2 logs $PM2_APP'" >&2
fi
EOF

echo "==> Done. https://negre.co/bicing-2026/"
