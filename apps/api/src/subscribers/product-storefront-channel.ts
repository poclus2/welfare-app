import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ensureProductsInStorefront, ensureProductsShippable } from "../lib/storefront-channel"
import { syncProductToSearch } from "../lib/meili-products"

// A product created without a sales channel (whatever created it: our admin, an import, a script) is
// invisible to the storefront. Link it to the storefront channel, then re-index it: the Meilisearch
// subscriber runs on the same event and may already have dropped it for having no channel.
// It also needs a shipping profile, or its cart cannot be completed at checkout.
export default async function productStorefrontChannelHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const linked = await ensureProductsInStorefront(container, [data.id])
    if (linked.length) await syncProductToSearch(container, data.id)
  } catch (e) {
    console.error(`[product-storefront-channel] ${data.id} failed:`, e)
  }
  try {
    await ensureProductsShippable(container, [data.id])
  } catch (e) {
    console.error(`[product-storefront-channel] shipping profile for ${data.id} failed:`, e)
  }
}

export const config: SubscriberConfig = {
  event: "product.created",
}
