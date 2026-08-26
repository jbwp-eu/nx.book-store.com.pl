#!/usr/bin/env bash
set -euo pipefail
BASE="${DEPLOY_BASE_URL_OVH:-https://nx.book-store.com.pl}"
BASE="${BASE%/}"
curl -sfS "$BASE/" >/dev/null
curl -sfS "$BASE/pl" >/dev/null || true
echo "Smoke OK: $BASE"
