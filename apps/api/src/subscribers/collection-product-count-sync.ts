import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { syncCollectionProductCounts } from "../lib/collection-product-count"

// Keeps metadata.product_count fresh on every collection whenever a product
// is created, updated (including moved between collections) or deleted —
// so the admin Marques page never has to recompute it live. Recomputes all
// collections rather than diffing old/new collection_id (events don't carry
// the previous value); cheap since it only reads product ids, and catalog
// edits are low-frequency.
export default async function collectionProductCountSyncHandler({
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    await syncCollectionProductCounts(container)
  } catch (e) {
    console.error("[collection-product-count-sync] Failed to sync product counts:", e)
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated", "product.deleted"],
}
