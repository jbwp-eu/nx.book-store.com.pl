#!/usr/bin/env bash
set -euo pipefail
BASE="${DEPLOY_BASE_URL_AZURE:?Set DEPLOY_BASE_URL_AZURE}"
BASE="${BASE%/}"

echo "Smoke test: $BASE"
for i in $(seq 1 15); do
  if curl -sfS "$BASE/" >/dev/null; then
    curl -sfS "$BASE/pl" >/dev/null || true
    echo "Smoke OK: $BASE"
    exit 0
  fi
  echo "Attempt $i/15: not ready yet — retry in 4s..."
  sleep 4
done

echo "Smoke failed: $BASE returned errors after 15 attempts."
exit 1
