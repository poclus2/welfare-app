import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { name, price, isPickup } = req.body as { name: string; price: number; isPickup: boolean }

  try {
    const fulfillmentModule = req.scope.resolve(Modules.FULFILLMENT) as any
    const pricingModule = req.scope.resolve(Modules.PRICING) as any

    // 1. Get or Create Fulfillment Set
    let fSets = await fulfillmentModule.listFulfillmentSets({ name: "Default Delivery" })
    let fSet = fSets[0]
    if (!fSet) {
      fSet = await fulfillmentModule.createFulfillmentSets({
        name: "Default Delivery",
        type: "delivery"
      })
    }

    // Link Fulfillment Set to Stock Location so that shipping options are available at checkout
    const stockLocationModule = req.scope.resolve(Modules.STOCK_LOCATION) as any
    const remoteLink = req.scope.resolve("remoteLink")
    const stockLocations = await stockLocationModule.listStockLocations()
    if (stockLocations.length > 0) {
      try {
        await remoteLink.create({
          [Modules.STOCK_LOCATION]: { stock_location_id: stockLocations[0].id },
          [Modules.FULFILLMENT]: { fulfillment_set_id: fSet.id }
        })
      } catch (e) {
        // Ignore if already linked
      }
    }

    // 2. Get or Create Service Zone - Cameroun
    let serviceZones = await fulfillmentModule.listServiceZones({ name: "Cameroun" })
    let serviceZone = serviceZones[0]
    if (!serviceZone) {
      serviceZone = await fulfillmentModule.createServiceZones({
        fulfillment_set_id: fSet.id,
        name: "Cameroun",
        geo_zones: [
          { type: "country", country_code: "cm" }
        ]
      })
    }

    // 3. Get or Create Shipping Profile
    let profiles = await fulfillmentModule.listShippingProfiles({ type: "default" })
    let profile = profiles[0]
    if (!profile) {
      profile = await fulfillmentModule.createShippingProfiles({ name: "Default", type: "default" })
    }

    // 4. Create shipping option directly (no workflow, no provider validation)
    const shippingOption = await fulfillmentModule.createShippingOptions({
      name,
      price_type: "flat",
      provider_id: "manual_manual",
      service_zone_id: serviceZone.id,
      shipping_profile_id: profile.id,
      type: {
        label: isPickup ? "Pickup" : "Delivery",
        description: isPickup ? "Retrait sur place" : "Livraison standard",
        code: isPickup ? "pickup" : "delivery"
      },
      rules: [],
      prices: [{ currency_code: "xaf", amount: price }]
    })

    res.status(200).json({ shipping_option: shippingOption })
  } catch (error: any) {
    console.error("Error creating shipping option:", error)
    res.status(500).json({ message: error.message })
  }
}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const fulfillmentModule = req.scope.resolve(Modules.FULFILLMENT) as any
    const options = await fulfillmentModule.listShippingOptions({}, {
      relations: ["prices", "type"]
    })
    res.status(200).json({ shipping_options: options })
  } catch (error: any) {
    console.error("Error fetching shipping options:", error)
    res.status(500).json({ message: error.message })
  }
}
