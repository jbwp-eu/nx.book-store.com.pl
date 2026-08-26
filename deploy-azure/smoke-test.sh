#!/usr/bin/env bash
set -euo pipefail
BASE="${DEPLOY_BASE_URL_AZURE:?Set DEPLOY_BASE_URL_AZURE}"
BASE="${BASE%/}"
curl -sfS "$BASE/" >/dev/null
curl -sfS "$BASE/pl" >/dev/null || true
echo "Smoke OK: $BASE"
