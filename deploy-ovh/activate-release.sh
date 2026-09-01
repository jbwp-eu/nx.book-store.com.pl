#!/usr/bin/env bash
# Run on the server as deploy user after rsync (GitHub Actions).
set -euo pipefail

APP_ROOT=/var/www/nx-book-store
RELEASE_SHA="${1:?Usage: activate-release.sh <git-sha>}"

RELEASE="$APP_ROOT/releases/$RELEASE_SHA"
[[ -d "$RELEASE" ]] || { echo "Missing release: $RELEASE"; exit 1; }
[[ -f "$RELEASE/package.json" ]] || { echo "Missing $RELEASE/package.json"; exit 1; }
[[ -d "$RELEASE/.next" ]] || { echo "Missing $RELEASE/.next (build artifact)"; exit 1; }
[[ -f "$APP_ROOT/shared/.env.production" ]] || {
  echo "Missing $APP_ROOT/shared/.env.production"
  exit 1
}

set -a
# shellcheck disable=SC1091
source "$APP_ROOT/shared/.env.production"
set +a
PORT="${PORT:-3001}"

cd "$RELEASE"
ln -sfn ../../shared/.env.production .env
npm ci --omit=dev
npx prisma generate
npx prisma migrate deploy
ln -sfn "$RELEASE" "$APP_ROOT/current"
sudo systemctl restart nx-book-store

echo "Waiting for nx-book-store (127.0.0.1:${PORT})..."
for i in $(seq 1 30); do
  if systemctl is-active --quiet nx-book-store && curl -sf "http://127.0.0.1:${PORT}/" >/dev/null; then
    echo "Activated $RELEASE_SHA"
    exit 0
  fi
  sleep 2
done

echo "Service did not become healthy within 60s"
sudo systemctl status nx-book-store --no-pager || true
sudo journalctl -u nx-book-store -n 40 --no-pager || true
exit 1
