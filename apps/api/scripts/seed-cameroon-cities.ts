// @ts-nocheck
import { ExecArgs } from "@medusajs/framework/types"

export default async function seedCameroonCities({ container }: ExecArgs) {
  const welfareDeliveryModuleService = container.resolve("welfare_delivery")

  console.log("Seeding Cameroon cities...")

  // Define cities
  const cities = [
    { name: "Yaoundé", has_neighborhoods: true, fixed_price: null },
    { name: "Douala", has_neighborhoods: true, fixed_price: null },
    { name: "Bafoussam", has_neighborhoods: false, fixed_price: 3000 },
    { name: "Garoua", has_neighborhoods: false, fixed_price: 3000 },
    { name: "Bamenda", has_neighborhoods: false, fixed_price: 3000 },
    { name: "Maroua", has_neighborhoods: false, fixed_price: 3000 },
    { name: "Ngaoundéré", has_neighborhoods: false, fixed_price: 3000 },
    { name: "Kribi", has_neighborhoods: false, fixed_price: 3000 },
    { name: "Limbe", has_neighborhoods: false, fixed_price: 3000 },
    { name: "Edéa", has_neighborhoods: false, fixed_price: 3000 },
    { name: "Foumban", has_neighborhoods: false, fixed_price: 3000 },
    { name: "Ebolowa", has_neighborhoods: false, fixed_price: 3000 },
    { name: "Buea", has_neighborhoods: false, fixed_price: 3000 },
    { name: "Dschang", has_neighborhoods: false, fixed_price: 3000 },
    { name: "Kumba", has_neighborhoods: false, fixed_price: 3000 },
    { name: "Bertoua", has_neighborhoods: false, fixed_price: 3000 },
    { name: "Autre ville", has_neighborhoods: false, fixed_price: 3000 },
  ]

  for (const city of cities) {
    const existing = await welfareDeliveryModuleService.listDeliveryCities({
      name: city.name,
    })
    
    if (existing.length === 0) {
      await welfareDeliveryModuleService.createDeliveryCities(city)
      console.log(`Created city: ${city.name}`)
    }
  }

  // Create default setting for free shipping (e.g. 100,000 FCFA)
  const settings = await welfareDeliveryModuleService.listDeliverySettings()
  if (settings.length === 0) {
    await welfareDeliveryModuleService.createDeliverySettings({
      free_shipping_threshold: 100000
    })
    console.log(`Created default delivery setting`)
  }

  console.log("Seeding complete.")
}
