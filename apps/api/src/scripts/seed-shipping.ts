import { MedusaContainer } from "@medusajs/framework/types"

export default async function ({ container }: { container: MedusaContainer }) {
  const fulfillmentModule = container.resolve("fulfillment")
  const regionModule = container.resolve("region")
  const stockLocationModule = container.resolve("stockLocation")

  console.log("Seeding shipping options...")

  // 1. Get Stock Location
  const locations = await stockLocationModule.listStockLocations()
  const location = locations[0]
  if (!location) throw new Error("No stock location found")
  console.log("Using Stock Location:", location.name)

  // 2. Create Fulfillment Set
  let fSet = await fulfillmentModule.createFulfillmentSets({
    name: "Default Delivery",
    type: "delivery"
  })
  console.log("Created Fulfillment Set:", fSet.name)

  // 3. Create Service Zone
  let serviceZone = await fulfillmentModule.createServiceZones({
    fulfillment_set_id: fSet.id,
    name: "West Africa",
    geo_zones: [
      { type: "country", country_code: "sn" },
      { type: "country", country_code: "cm" },
      { type: "country", country_code: "ci" }
    ]
  })
  console.log("Created Service Zone:", serviceZone.name)

  // 4. Create Shipping Options
  const providerId = "manual_manual"
  
  // To avoid complex price sets right now, we can create them without prices, or with rules.
  // Wait, in v2, shipping options MUST have price sets if they are not calculated.
  // The easiest way is to use the createShippingOptions workflow!
  const { createShippingOptionsWorkflow } = require("@medusajs/medusa/core-flows")
  
  // Get region
  const regions = await regionModule.listRegions()
  const region = regions[0]

  const options = [
    {
      name: "Retrait Magasin - Playce",
      price_type: "flat",
      provider_id: providerId,
      service_zone_id: serviceZone.id,
      shipping_profile_id: "sp_01KYA5SNZES3F71JRH49ZZXDCH", // Using default profile ID from earlier
      type: { label: "Pickup", description: "Retrait sur place", code: "pickup_playce" },
      prices: [{ currency_code: "xof", amount: 0 }]
    },
    {
      name: "Retrait Magasin - Hippodrome",
      price_type: "flat",
      provider_id: providerId,
      service_zone_id: serviceZone.id,
      shipping_profile_id: "sp_01KYA5SNZES3F71JRH49ZZXDCH",
      type: { label: "Pickup", description: "Retrait sur place", code: "pickup_hippodrome" },
      prices: [{ currency_code: "xof", amount: 0 }]
    },
    {
      name: "Livraison à domicile",
      price_type: "flat",
      provider_id: providerId,
      service_zone_id: serviceZone.id,
      shipping_profile_id: "sp_01KYA5SNZES3F71JRH49ZZXDCH",
      type: { label: "Delivery", description: "Livraison standard", code: "delivery_home" },
      prices: [{ currency_code: "xof", amount: 1500 }]
    }
  ]

  for (const opt of options) {
    console.log(`Creating option: ${opt.name}`)
    await createShippingOptionsWorkflow(container).run({
      input: [opt]
    }).catch(e => console.error("Error creating option", e.message))
  }

  console.log("Done seeding shipping options!")
}
