import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

// Stores each collection's product count in metadata.product_count instead of
// the admin dashboard expanding *products (full product objects) on every
// page load just to read .length — expensive once a brand has dozens of
// products. Called by the backfill script and kept fresh by the
// collection-product-count-sync subscriber.
export async function syncCollectionProductCounts(container: any) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModuleService = container.resolve(Modules.PRODUCT)

  const { data: collections } = await query.graph({
    entity: "collection",
    fields: ["id", "metadata", "products.id"],
  })

  let updated = 0
  for (const collection of collections as any[]) {
    const count = collection.products?.length || 0
    if (collection.metadata?.product_count === count) continue

    await productModuleService.updateProductCollections(collection.id, {
      metadata: { ...(collection.metadata || {}), product_count: count },
    })
    updated++
  }

  return { total: collections.length, updated }
}
