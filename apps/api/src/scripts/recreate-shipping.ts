import { Modules } from "@medusajs/framework/utils"
import { createShippingOptionsWorkflow, deleteShippingOptionsWorkflow } from "@medusajs/medusa/core-flows"

export default async function recreateShippingOptions({ container }) {
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  
  // 1. Get existing options and delete them
  const existingOptions = await fulfillmentModule.listShippingOptions()
  console.log(`Found ${existingOptions.length} existing shipping options to delete...`)
  
  if (existingOptions.length > 0) {
    await deleteShippingOptionsWorkflow(container).run({
      input: { ids: existingOptions.map(o => o.id) }
    })
    console.log("Deleted all existing shipping options.")
  }

  // 2. Get the service zone
  const serviceZones = await fulfillmentModule.listServiceZones({ name: "Cameroun" })
  const serviceZone = serviceZones[0]
  if (!serviceZone) {
    throw new Error("Service zone 'Cameroun' not found. Please create a shipping option via admin first to initialize the zone.")
  }

  // 3. Get the shipping profile
  const profiles = await fulfillmentModule.listShippingProfiles({ type: "default" })
  const profile = profiles[0]
  if (!profile) {
    throw new Error("No shipping profile found.")
  }

  // 4. Recreate with proper workflow
  const optionsToCreate = [
    {
      name: "Livraison à domicile",
      price_type: "flat" as const,
      provider_id: "manual_manual",
      service_zone_id: serviceZone.id,
      shipping_profile_id: profile.id,
      type: { label: "Delivery", description: "Livraison standard", code: "delivery" },
      rules: [],
      prices: [{ currency_code: "xaf", amount: 1500 }]
    },
    {
      name: "Retrait Magasin - Hippodrome",
      price_type: "flat" as const,
      provider_id: "manual_manual",
      service_zone_id: serviceZone.id,
      shipping_profile_id: profile.id,
      type: { label: "Pickup", description: "Retrait sur place", code: "pickup" },
      rules: [],
      prices: [{ currency_code: "xaf", amount: 0 }]
    },
    {
      name: "Retrait Magasin - Playce",
      price_type: "flat" as const,
      provider_id: "manual_manual",
      service_zone_id: serviceZone.id,
      shipping_profile_id: profile.id,
      type: { label: "Pickup", description: "Retrait sur place", code: "pickup" },
      rules: [],
      prices: [{ currency_code: "xaf", amount: 0 }]
    }
  ]

  const { result } = await createShippingOptionsWorkflow(container).run({
    input: optionsToCreate
  })

  for (const opt of result) {
    console.log(`Created shipping option: ${opt.name} (${opt.id})`)
  }
  console.log("Done! All shipping options recreated with proper pricing.")
}
