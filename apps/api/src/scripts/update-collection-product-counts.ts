import { MedusaContainer } from "@medusajs/framework/types"
import { syncCollectionProductCounts } from "../lib/collection-product-count"

// One-off backfill: stamps metadata.product_count on every collection so the
// admin Marques page can read a stored count instead of expanding *products.
// Safe to re-run — a no-op once counts are already up to date. From then on,
// the collection-product-count-sync subscriber keeps it fresh automatically.
//
// Run: npx medusa exec ./src/scripts/update-collection-product-counts.ts
export default async function updateCollectionProductCounts({
  container,
}: {
  container: MedusaContainer
}) {
  const { total, updated } = await syncCollectionProductCounts(container)
  console.log(`[update-collection-product-counts] ${updated}/${total} collection(s) updated.`)
}
