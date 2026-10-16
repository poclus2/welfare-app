// Server-side product search for the results page (/shop/all?q=...): the same Meilisearch index and
// ranking as the search bar (synonyms, typos, needs, skin types, actives, in-stock first), instead of a
// plain "title contains the text" match that found nothing for "serum vitamine c" or "écran solaire".
// Uses the search-only key (MEILISEARCH_SEARCH_KEY), never the master key.

const LIMIT = 300;

async function search(q: string, matchingStrategy: "all" | "last"): Promise<string[]> {
  const res = await fetch(`${process.env.MEILISEARCH_HOST}/indexes/products/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.MEILISEARCH_SEARCH_KEY}` },
    body: JSON.stringify({ q, limit: LIMIT, attributesToRetrieve: ["id"], matchingStrategy }),
    signal: AbortSignal.timeout(4000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Meilisearch search answered ${res.status}`);
  const data = await res.json();
  return (data.hits || []).map((h: any) => String(h.id));
}

/**
 * Product ids for a query, best match first. Products must match every word of the query; when none
 * does, the last words are dropped one by one ("crème solaire visage mat" -> "crème solaire visage"...).
 * null when Meilisearch is not configured or unreachable: the caller falls back to its own matching.
 */
export async function searchProductIds(q: string): Promise<string[] | null> {
  if (!process.env.MEILISEARCH_HOST || !process.env.MEILISEARCH_SEARCH_KEY) return null;
  try {
    const all = await search(q, "all");
    return all.length ? all : await search(q, "last");
  } catch (e: any) {
    console.error("[search] Meilisearch unavailable, plain matching used:", e?.message);
    return null;
  }
}
