import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { removeProductFromSearch, syncProductToSearch } from "../lib/meili-products"

// Storefront search bar: a product that is created/edited is (re)indexed if published and removed from
// the index otherwise (e.g. when it is switched to draft); a deleted product is removed.
export default async function meilisearchProductSyncHandler({
  event: { name, data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    if (name === "product.deleted") {
      await removeProductFromSearch(data.id)
    } else {
      await syncProductToSearch(container, data.id)
    }
  } catch (e) {
    // Search being briefly out of date must never break saving a product
    console.error(`[meilisearch-product-sync] ${name} ${data.id} failed:`, e)
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated", "product.deleted"],
}
