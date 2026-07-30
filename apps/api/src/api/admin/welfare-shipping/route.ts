import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createShippingOptionsWorkflow } from "@medusajs/medusa/core-flows"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { name, price, isPickup } = req.body as { name: string; price: number; isPickup: boolean }

  const fulfillmentModule = req.scope.resolve("fulfillment")
  
  // 1. Get Default Service Zone
  let fSets = await fulfillmentModule.listFulfillmentSets({ name: "Default Delivery" })
  let fSet = fSets[0];
  if (!fSet) {
    fSet = await fulfillmentModule.createFulfillmentSets({
      name: "Default Delivery",
      type: "delivery"
    })
  }

  let serviceZones = await fulfillmentModule.listServiceZones({ name: "West Africa" })
  let serviceZone = serviceZones[0];
  if (!serviceZone) {
    serviceZone = await fulfillmentModule.createServiceZones({
      fulfillment_set_id: fSet.id,
      name: "West Africa",
      geo_zones: [
        { type: "country", country_code: "sn" },
        { type: "country", country_code: "cm" },
        { type: "country", country_code: "ci" }
      ]
    })
  }

  // 2. Fetch shipping profile
  const query = req.scope.resolve("query")
  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })
  
  const shippingProfileId = profiles[0]?.id
  if (!shippingProfileId) {
    return res.status(400).json({ message: "No shipping profile found. Please seed the database." })
  }

  const providerId = "manual_manual"

  const optionInput: any = {
    name,
    price_type: "flat",
    provider_id: providerId,
    service_zone_id: serviceZone.id,
    shipping_profile_id: shippingProfileId,
    type: { 
      label: isPickup ? "Pickup" : "Delivery", 
      description: isPickup ? "Retrait sur place" : "Livraison standard", 
      code: isPickup ? "pickup" : "delivery" 
    },
    prices: [{ currency_code: "xof", amount: price }]
  }

  try {
    const { result } = await createShippingOptionsWorkflow(req.scope).run({
      input: [optionInput]
    })

    res.status(200).json({ shipping_option: result[0] })
  } catch (error: any) {
    console.error("Error creating shipping option:", error)
    res.status(400).json({ message: error.message })
  }
}
