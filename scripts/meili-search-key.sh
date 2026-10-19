#!/bin/sh
# Creates the Meilisearch key the browser may hold: `search` only, on the `products` index only.
# Run on the VPS (Meilisearch listens on 127.0.0.1:7700), then put the printed key in .env as
# MEILISEARCH_SEARCH_KEY and rebuild the storefront (the key is baked into its bundle).
#
#   MEILI_MASTER_KEY=... sh scripts/meili-search-key.sh
set -eu

: "${MEILI_MASTER_KEY:?set MEILI_MASTER_KEY (the current master key, MEILISEARCH_API_KEY in .env)}"
HOST="${MEILI_HOST:-http://127.0.0.1:7700}"

curl -sf -X POST "$HOST/keys" \
  -H "Authorization: Bearer $MEILI_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"storefront-search","description":"Browser search bar: search on products only","actions":["search"],"indexes":["products"],"expiresAt":null}' \
  | sed -n 's/.*"key":"\([^"]*\)".*/MEILISEARCH_SEARCH_KEY=\1/p'
