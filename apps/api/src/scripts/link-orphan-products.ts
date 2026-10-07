import { MedusaContainer } from "@medusajs/framework/types"
import { ensureProductsInStorefront, ensureProductsShippable } from "../lib/storefront-channel"
import { resyncSearchIndex } from "../lib/meili-products"

// Links every product that is in no storefront sales channel (created before the product.created
// subscriber existed) so its page stops answering "Produit introuvable", links every product without a
// shipping profile to the default one (otherwise checkout fails), then resyncs the search index.
// Idempotent: products already linked are left alone.
//   npx medusa exec ./src/scripts/link-orphan-products.ts
export default async function linkOrphanProducts({ container }: { container: MedusaContainer }) {
  const linked = await ensureProductsInStorefront(container)
  console.log(`Linked ${linked.length} product(s) to the storefront sales channel`, linked)
  const shippable = await ensureProductsShippable(container)
  console.log(`Linked ${shippable.length} product(s) to the default shipping profile`, shippable)
  const result = await resyncSearchIndex(container)
  console.log(`Meilisearch resync: ${result.indexed} indexed, ${result.removed} removed`, result.removed_ids)
}
