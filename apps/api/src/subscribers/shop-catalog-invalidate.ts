import type { SubscriberConfig } from "@medusajs/framework"
import { invalidateShopCatalog } from "../lib/shop-catalog"

// A product was created, edited (status, price, title, category...) or deleted: refresh the cached
// storefront catalogue on the next request.
export default async function shopCatalogInvalidateHandler() {
  invalidateShopCatalog()
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated", "product.deleted"],
}
