import { MedusaContainer } from "@medusajs/framework/types"
import { resyncSearchIndex } from "../lib/meili-products"

// Full resync of the storefront search index: indexes every published product and removes the
// documents of anything that is no longer published (drafts, deleted products).
//   npx medusa exec ./src/scripts/reindex.ts
export default async function reindex({ container }: { container: MedusaContainer }) {
  const result = await resyncSearchIndex(container)
  console.log(`Meilisearch resync: ${result.indexed} indexed, ${result.removed} removed`, result.removed_ids)
}
