import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ensureProductsInStorefront } from "../lib/storefront-channel"
import { syncProductToSearch } from "../lib/meili-products"

// A product created without a sales channel (whatever created it: our admin, an import, a script) is
// invisible to the storefront. Link it to the storefront channel, then re-index it: the Meilisearch
// subscriber runs on the same event and may already have dropped it for having no channel.
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
}

export const config: SubscriberConfig = {
  event: "product.created",
}
