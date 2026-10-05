import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Keeps the Meilisearch "products" index (the storefront search bar) in step with the catalogue.
//
// The @rokmohar plugin is declared under `modules` in medusa-config.ts, so its own subscribers are never
// loaded and nothing updated the index when a product changed. The index has always been filled by
// scripts/reindex.ts, so this keeps that exact document shape (brand-prefixed title, price, variant_sku).
// Only PUBLISHED products belong in the index: draft/proposed/rejected ones are removed.

const INDEX = "products"

const FIELDS = [
  "id",
  "title",
  "description",
  "thumbnail",
  "handle",
  "status",
  "metadata",
  "collection.title",
  "variants.sku",
  "variants.prices.amount",
]

function meili(path: string, init: RequestInit = {}) {
  const host = process.env.MEILISEARCH_HOST || "http://localhost:7700"
  const key = process.env.MEILISEARCH_API_KEY || "meilisearch_super_secret"
  return fetch(`${host}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, ...(init.headers || {}) },
  })
}

export function toSearchDocument(p: any) {
  const brand = p.collection?.title
  return {
    id: p.id,
    title: brand ? `${brand} - ${p.title}` : p.title,
    description: p.metadata?.search_tagline || p.description || "",
    thumbnail: p.thumbnail,
    handle: p.handle,
    variant_sku: p.variants?.[0]?.sku ?? null,
    price: p.variants?.[0]?.prices?.[0]?.amount || 0,
  }
}

async function expectOk(res: Response, what: string) {
  if (!res.ok) throw new Error(`Meilisearch ${what} failed (${res.status}): ${(await res.text().catch(() => "")).slice(0, 200)}`)
}

export async function removeProductFromSearch(id: string) {
  // 404 just means "was not indexed", which is fine
  const res = await meili(`/indexes/${INDEX}/documents/${encodeURIComponent(id)}`, { method: "DELETE" })
  if (!res.ok && res.status !== 404) await expectOk(res, "delete")
}

/** Indexes the product if it is published, removes it from the index otherwise. */
export async function syncProductToSearch(container: MedusaContainer, id: string) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "product", fields: FIELDS, filters: { id } })
  const product: any = data[0]

  if (!product || product.status !== "published") {
    await removeProductFromSearch(id)
    return "removed" as const
  }
  await expectOk(
    await meili(`/indexes/${INDEX}/documents`, { method: "POST", body: JSON.stringify([toSearchDocument(product)]) }),
    "upsert"
  )
  return "indexed" as const
}

/** Full resync: index every published product, remove every indexed document that is not one. */
export async function resyncSearchIndex(container: MedusaContainer) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: FIELDS,
    filters: { status: "published" },
    pagination: { take: 10000 },
  })
  const docs = (data as any[]).map(toSearchDocument)
  const published = new Set(docs.map((d) => d.id))

  // ids currently in the index
  const indexed: string[] = []
  for (let offset = 0; ; offset += 1000) {
    const res = await meili(`/indexes/${INDEX}/documents?limit=1000&offset=${offset}&fields=id`)
    if (res.status === 404) break // index does not exist yet
    await expectOk(res, "list")
    const body: any = await res.json()
    indexed.push(...body.results.map((r: any) => r.id))
    if (body.results.length < 1000) break
  }
  const stale = indexed.filter((id) => !published.has(id))

  if (docs.length) {
    await expectOk(await meili(`/indexes/${INDEX}/documents`, { method: "POST", body: JSON.stringify(docs) }), "upsert")
  }
  if (stale.length) {
    await expectOk(
      await meili(`/indexes/${INDEX}/documents/delete-batch`, { method: "POST", body: JSON.stringify(stale) }),
      "delete-batch"
    )
  }
  return { indexed: docs.length, removed: stale.length, removed_ids: stale }
}
