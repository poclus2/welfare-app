import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { linkProductsToSalesChannelWorkflow } from "@medusajs/medusa/core-flows"

// The storefront only sees products linked to the sales channel(s) of its publishable API key:
// /store/products answers 404 for a published product that is in no such channel. Products created
// from our own admin carried no sales channel, so they were searchable (Meilisearch) but their page
// said "Produit introuvable". These helpers find the storefront channel(s) and attach products to them.

/** Sales channels the storefront can read: those of the active publishable keys, else the store default. */
export async function getStorefrontSalesChannelIds(container: MedusaContainer): Promise<string[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: keys } = await query.graph({
    entity: "api_key",
    fields: ["id", "type", "revoked_at", "sales_channels.id"],
    filters: { type: "publishable" },
  })
  const ids = new Set<string>()
  for (const k of keys as any[]) {
    if (k.revoked_at) continue
    for (const sc of k.sales_channels || []) if (sc?.id) ids.add(sc.id)
  }
  if (ids.size) return [...ids]

  const { data: stores } = await query.graph({ entity: "store", fields: ["default_sales_channel_id"] })
  const fallback = (stores as any[])[0]?.default_sales_channel_id
  return fallback ? [fallback] : []
}

/** Products (among `productIds`, or the whole catalogue) linked to none of the storefront channels. */
export async function findProductsOutsideStorefront(
  container: MedusaContainer,
  channelIds: string[],
  productIds?: string[]
): Promise<string[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "sales_channels.id"],
    filters: productIds ? { id: productIds } : {},
    pagination: { take: 10000 },
  })
  const wanted = new Set(channelIds)
  return (data as any[])
    .filter((p) => !(p.sales_channels || []).some((sc: any) => sc && wanted.has(sc.id)))
    .map((p) => p.id)
}

/** Links the given products (or every product) missing from the storefront channel. Returns their ids. */
export async function ensureProductsInStorefront(
  container: MedusaContainer,
  productIds?: string[]
): Promise<string[]> {
  const channelIds = await getStorefrontSalesChannelIds(container)
  if (!channelIds.length) throw new Error("No storefront sales channel found (no publishable key channel, no store default)")

  const missing = await findProductsOutsideStorefront(container, channelIds, productIds)
  if (!missing.length) return []

  // Linking to the first storefront channel is enough for the storefront to see them
  await linkProductsToSalesChannelWorkflow(container).run({ input: { id: channelIds[0], add: missing } })
  return missing
}

// Checkout needs every product in the shipping profile of the chosen shipping option (all of ours
// use the default profile): otherwise completing the cart fails with "The cart items require
// shipping profiles that are not satisfied by the current shipping methods" — after the Mobile
// Money payment went through. Products created from our admin had no shipping profile.

/** Links the given products (or every product) that have no shipping profile to the default one. */
export async function ensureProductsShippable(
  container: MedusaContainer,
  productIds?: string[]
): Promise<string[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "type"],
    filters: { type: "default" },
  })
  const profileId = (profiles as any[])[0]?.id
  if (!profileId) throw new Error("No default shipping profile found")

  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "shipping_profile.id"],
    filters: productIds ? { id: productIds } : {},
    pagination: { take: 10000 },
  })
  const missing = (data as any[]).filter((p) => !p.shipping_profile?.id).map((p) => p.id)
  if (!missing.length) return []

  const link = container.resolve(ContainerRegistrationKeys.LINK)
  await link.create(
    missing.map((product_id) => ({
      [Modules.PRODUCT]: { product_id },
      [Modules.FULFILLMENT]: { shipping_profile_id: profileId },
    }))
  )
  return missing
}
