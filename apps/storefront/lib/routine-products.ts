"use client";

import { useEffect, useState } from "react";

// Products of a Skin Coach routine (result page). One request for all of them (id[] filter) instead of
// one per step, kept in memory per set of ids: the result page starts it while it checks the account,
// so the products are often there when the routine is shown.

export type ProductInfo = { title: string; brand?: string; thumbnail?: string; handle?: string; variantId?: string; amount?: number; currency: string };

type Products = Record<string, ProductInfo | null>;

const cache = new Map<string, Promise<Products>>();

function toInfo(p: any): ProductInfo {
  const variant = p.variants?.[0];
  const amount = variant?.calculated_price?.calculated_amount ?? variant?.prices?.[0]?.amount;
  return {
    title: p.title,
    brand: p.collection?.title,
    thumbnail: p.thumbnail || p.images?.[0]?.url,
    handle: p.handle,
    variantId: variant?.id,
    amount: amount != null ? Number(amount) : undefined,
    currency: variant?.calculated_price?.currency_code || variant?.prices?.[0]?.currency_code || "XAF",
  };
}

export function fetchRoutineProducts(ids: string[]): Promise<Products> {
  const unique = Array.from(new Set(ids)).sort();
  const key = unique.join(",");
  if (!unique.length) return Promise.resolve({});
  const cached = cache.get(key);
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://api.thewelfarecm.com";
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";
  const qs = new URLSearchParams();
  unique.forEach((id) => qs.append("id[]", id));
  // prices and collection are not in the default store fields: without them no price was shown
  qs.set("fields", "*variants,*variants.prices,*collection");
  qs.set("limit", String(unique.length));
  const promise = fetch(`${url}/store/products?${qs}`, { headers: { "x-publishable-api-key": pk } })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then((data) => {
      const found = new Map<string, any>((data?.products || []).map((p: any) => [p.id, p]));
      // a product that is gone or unpublished comes back missing: shown without product, as before
      return Object.fromEntries(unique.map((id) => [id, found.has(id) ? toInfo(found.get(id)) : null]));
    })
    .catch((): Products => {
      cache.delete(key); // network failure: tried again on the next visit instead of staying empty
      return Object.fromEntries(unique.map((id) => [id, null]));
    });
  cache.set(key, promise);
  return promise;
}

export function useRoutineProducts(ids: string[]): Products {
  const [products, setProducts] = useState<Products>({});
  const key = ids.join(",");
  useEffect(() => {
    let cancelled = false;
    fetchRoutineProducts(ids).then((p) => {
      if (cancelled) return;
      setProducts(p);
      // the other steps' pictures, fetched while she reads the first one, so switching steps is instant
      const urls = Object.values(p).map((x) => x?.thumbnail).filter((u): u is string => !!u);
      const warm = () => urls.forEach((u) => { const img = new Image(); img.decoding = "async"; img.src = u; });
      if ("requestIdleCallback" in window) (window as any).requestIdleCallback(warm, { timeout: 2000 });
      else setTimeout(warm, 500);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return products;
}
