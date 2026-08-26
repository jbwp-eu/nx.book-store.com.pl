#!/usr/bin/env bash
# Run on the server as deploy user after rsync (GitHub Actions).
set -euo pipefail

APP_ROOT=/var/www/nx-book-store
RELEASE_SHA="${1:?Usage: activate-release.sh <git-sha>}"
PORT="${APP_PORT:-3000}"

RELEASE="$APP_ROOT/releases/$RELEASE_SHA"
[[ -d "$RELEASE" ]] || { echo "Missing release: $RELEASE"; exit 1; }
[[ -f "$RELEASE/package.json" ]] || { echo "Missing $RELEASE/package.json"; exit 1; }
[[ -d "$RELEASE/.next" ]] || { echo "Missing $RELEASE/.next (build artifact)"; exit 1; }
[[ -f "$APP_ROOT/shared/.env.production" ]] || {
  echo "Missing $APP_ROOT/shared/.env.production"
  exit 1
}

cd "$RELEASE"
ln -sfn ../../shared/.env.production .env
npm ci --omit=dev
npx prisma generate
npx prisma migrate deploy
ln -sfn "$RELEASE" "$APP_ROOT/current"
sudo systemctl restart nx-book-store
sleep 5
curl -sf "http://127.0.0.1:${PORT}/" >/dev/null
echo "Activated $RELEASE_SHA"
