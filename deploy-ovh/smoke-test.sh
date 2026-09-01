#!/usr/bin/env bash
set -euo pipefail
BASE="${DEPLOY_BASE_URL_OVH:-https://nx.book-store.com.pl}"
BASE="${BASE%/}"

echo "Smoke test: $BASE"
for i in $(seq 1 15); do
  if curl -sfS "$BASE/" >/dev/null; then
    curl -sfS "$BASE/pl" >/dev/null || true
    echo "Smoke OK: $BASE"
    exit 0
  fi
  echo "Attempt $i/15: not ready yet (502/connection?) — retry in 4s..."
  sleep 4
done

echo "Smoke failed: $BASE returned errors after 15 attempts."
echo "Check: DNS → OVH VPS, Caddy → 127.0.0.1:\$PORT, systemctl status nx-book-store"
exit 1
