import { Modules } from "@medusajs/framework/utils"

export default async function linkStock({ container }) {
  const stockLocationModule = container.resolve(Modules.STOCK_LOCATION)
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  const remoteLink = container.resolve("remoteLink")

  const stockLocations = await stockLocationModule.listStockLocations()
  const fSets = await fulfillmentModule.listFulfillmentSets()

  if (stockLocations.length > 0 && fSets.length > 0) {
    for (const fSet of fSets) {
      try {
        await remoteLink.create({
          [Modules.STOCK_LOCATION]: { stock_location_id: stockLocations[0].id },
          [Modules.FULFILLMENT]: { fulfillment_set_id: fSet.id }
        })
        console.log(`Linked Fulfillment Set ${fSet.id} to Stock Location ${stockLocations[0].id}`)
      } catch (e) {
        console.log(`Already linked or error for ${fSet.id}:`, e.message)
      }
    }
  } else {
    console.log("No stock locations or fulfillment sets found.")
  }
}
