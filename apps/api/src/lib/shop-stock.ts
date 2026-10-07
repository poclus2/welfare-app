import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

// Two stock counters coexist:
//   - variant.metadata.stock_b1 / stock_b2: per-shop stock shown by the storefront and the admin,
//     written by the Odoo sync and by the admin product form;
//   - Medusa inventory levels of the shops' stock locations: what add-to-cart and checkout check.
// The Odoo sync (api/odoo-sync) writes both, but stock typed in the admin only reached the metadata,
// so a product created or restocked from the admin showed "En stock" yet could not be added to the
// cart. This aligns the inventory levels on the metadata for the given products.

// Same mapping as api/odoo-sync/route.ts (Medusa stock location -> metadata key)
const LOCATION_KEYS: Record<string, "stock_b1" | "stock_b2"> = {
  [process.env.ODOO_LOCATION_B1 || "sloc_01M0MHY28WQ38S3YE3XNQ9JPFZ"]: "stock_b1",
  [process.env.ODOO_LOCATION_B2 || "sloc_01M0MHY29NJWHRCEQBRT1KAM8N"]: "stock_b2",
}

const toQty = (v: unknown) => Math.max(0, Math.floor(Number(v) || 0))

/** Sets the shops' inventory levels to the variants' stock_b1 / stock_b2. Returns the levels changed. */
export async function syncInventoryFromShopStock(container: MedusaContainer, productIds: string[]) {
  if (!productIds.length) return 0
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const inventoryService = container.resolve(Modules.INVENTORY) as any

  const { data: variants } = await query.graph({
    entity: "variant",
    fields: ["id", "manage_inventory", "metadata", "inventory_items.inventory_item_id"],
    filters: { product_id: productIds },
    pagination: { take: 1000 },
  })

  // Only variants whose shop stock is known: never invent a quantity
  const wanted: { itemId: string; locationId: string; qty: number }[] = []
  for (const v of variants as any[]) {
    const itemId = v.inventory_items?.[0]?.inventory_item_id
    if (!v.manage_inventory || !itemId) continue
    for (const [locationId, key] of Object.entries(LOCATION_KEYS)) {
      if (v.metadata?.[key] == null) continue
      wanted.push({ itemId, locationId, qty: toQty(v.metadata[key]) })
    }
  }
  if (!wanted.length) return 0

  const levels: any[] = await inventoryService.listInventoryLevels(
    { inventory_item_id: [...new Set(wanted.map((w) => w.itemId))], location_id: Object.keys(LOCATION_KEYS) },
    { take: null }
  )
  const byKey = new Map(levels.map((l) => [`${l.inventory_item_id}|${l.location_id}`, l]))

  const toCreate: any[] = []
  const toUpdate: any[] = []
  for (const w of wanted) {
    const level = byKey.get(`${w.itemId}|${w.locationId}`)
    const row = { inventory_item_id: w.itemId, location_id: w.locationId, stocked_quantity: w.qty }
    if (!level) toCreate.push(row)
    else if (Number(level.stocked_quantity) !== w.qty) toUpdate.push(row)
  }
  if (toCreate.length) await inventoryService.createInventoryLevels(toCreate)
  if (toUpdate.length) await inventoryService.updateInventoryLevels(toUpdate)
  return toCreate.length + toUpdate.length
}
