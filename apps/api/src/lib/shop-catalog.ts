import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { concernFacets, ingredientFacets, skinTypeFacets } from "./shop-facets"

// Slim product list for the storefront's category pages (/shop/all, /shop/serums...).
//
// Those pages used to call /store/products?limit=1000 with images, variants, prices and categories:
// 17 to 45 seconds and 4.7 MB per refresh, and without product metadata, so the skin-type / concern /
// ingredient filters had nothing to match on. This builds only what the grid needs (about 250 KB), keeps
// it in memory, and serves it instantly: stale data is returned right away while a refresh runs in the
// background, so nobody waits for the build except the very first request after a restart.

export type ShopCatalogItem = {
  id: string
  title: string
  handle: string | null
  thumbnail: string | null
  brand: string
  brand_id: string | null
  categories: { id: string; name: string; handle: string }[]
  price: number
  variant_id: string
  concern_tags: string[] // raw tags, shown as chips on the product card
  skin_types: string[] // canonical labels (see shop-facets.ts)
  concerns: string[]
  ingredients: string[]
}

const TTL_MS = 60_000

let cache: { items: ShopCatalogItem[]; at: number } | null = null
let inflight: Promise<ShopCatalogItem[]> | null = null

const FIELDS = [
  "id",
  "title",
  "handle",
  "thumbnail",
  "metadata",
  "collection.id",
  "collection.title",
  "categories.id",
  "categories.name",
  "categories.handle",
  "variants.id",
  "variants.prices.amount",
  "variants.prices.currency_code",
]

async function build(container: MedusaContainer): Promise<ShopCatalogItem[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: FIELDS,
    filters: { status: "published" },
    pagination: { take: 5000 },
  })

  return (data as any[]).map((p) => {
    const variant = p.variants?.[0]
    const prices: any[] = variant?.prices || []
    // XAF is the only currency in use; fall back to whatever the first price is
    const price = prices.find((x) => x.currency_code === "xaf") ?? prices[0]
    const m = p.metadata || {}
    const tags = (Array.isArray(m.skin_concerns) ? m.skin_concerns : m.skin_concerns ? [m.skin_concerns] : []).map(String)
    return {
      id: p.id,
      title: p.title,
      handle: p.handle ?? null,
      thumbnail: p.thumbnail ?? null,
      brand: p.collection?.title || "",
      brand_id: p.collection?.id ?? null,
      categories: (p.categories || []).map((c: any) => ({ id: c.id, name: c.name || "", handle: c.handle || "" })),
      price: Number(price?.amount) || 0,
      variant_id: variant?.id || "",
      concern_tags: tags,
      skin_types: skinTypeFacets(m.skin_types),
      concerns: concernFacets(tags),
      ingredients: ingredientFacets(m.raw_inci),
    }
  })
}

function refresh(container: MedusaContainer): Promise<ShopCatalogItem[]> {
  if (!inflight) {
    inflight = build(container)
      .then((items) => {
        cache = { items, at: Date.now() }
        return items
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

export async function getShopCatalog(container: MedusaContainer): Promise<ShopCatalogItem[]> {
  if (cache) {
    if (Date.now() - cache.at >= TTL_MS) {
      // stale: answer now, refresh in the background
      refresh(container).catch((e) => console.error("[shop-catalog] background refresh failed:", e?.message))
    }
    return cache.items
  }
  return refresh(container)
}

/** Called when a product changes: the next request still answers instantly but triggers a rebuild. */
export function invalidateShopCatalog() {
  if (cache) cache.at = 0
}
