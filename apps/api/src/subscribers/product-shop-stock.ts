import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { syncInventoryFromShopStock } from "../lib/shop-stock"

// Stock typed in the admin product form (variant metadata stock_b1 / stock_b2) must also reach the
// Medusa inventory levels that add-to-cart checks (see lib/shop-stock). Product create/update events
// cover the admin form; the Odoo sync writes the levels itself.
export default async function productShopStockHandler({
  event: { name, data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const changed = await syncInventoryFromShopStock(container, [data.id])
    if (changed) console.log(`[product-shop-stock] ${name} ${data.id}: ${changed} inventory level(s) aligned`)
  } catch (e) {
    console.error(`[product-shop-stock] ${name} ${data.id} failed:`, e)
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
}
