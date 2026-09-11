#!/usr/bin/env bash
# Push the current local work to origin's `staging` branch, then build it
# on the droplet's staging-bicing-2026 clone. See SKILL.md for the full
# explanation of why each step is shaped this way.
set -euo pipefail

DROPLET_HOST="dig-oce"
STAGING_DIR="/home/javi/negre.co-server/apps/staging-bicing-2026"
PM2_APP="negre-co-server"

cd "$(git rev-parse --show-toplevel)"

if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: working tree has uncommitted changes. Commit or stash them first" \
       "so what gets validated is exactly what gets pushed." >&2
  exit 1
fi

echo "==> Validating local checkout (format, lint, check, test)"
npm run validate

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo "==> Force-pushing $CURRENT_BRANCH to origin/staging"
git push --force-with-lease origin "HEAD:staging"

echo "==> Deploying on $DROPLET_HOST"
ssh "$DROPLET_HOST" bash -s <<EOF
set -euo pipefail
export NVM_DIR="\$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"
cd "$STAGING_DIR"

echo "--> git status before reset (should normally be empty on a deploy-only clone):"
git status --short || true

git fetch origin staging
git reset --hard origin/staging
npm ci
APP_ENV=staging BASE_PATH=/staging-bicing-2026/ npm run build

echo "--> Build complete. staging-bicing-2026 has no nginx alias and is served" \
     "by server.ts's plain express.static mount, which stats files per request" \
     "-- the new build is live immediately, no PM2 reload needed."

if pm2 describe "$PM2_APP" 2>/dev/null | grep -q 'status.*online'; then
  echo "--> $PM2_APP is online"
else
  echo "WARNING: $PM2_APP does not appear to be online -- check 'pm2 logs $PM2_APP'" >&2
fi
EOF

echo "==> Done. https://negre.co/staging-bicing-2026/"
