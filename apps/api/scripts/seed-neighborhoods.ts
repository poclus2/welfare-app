// @ts-nocheck
import { ExecArgs } from "@medusajs/framework/types"

export default async function seedNeighborhoods({ container }: ExecArgs) {
  const welfareDeliveryModuleService = container.resolve("welfare_delivery")

  console.log("Fetching cities...")
  const cities = await welfareDeliveryModuleService.listDeliveryCities({})
  
  const yaounde = cities.find((c: any) => c.name === "Yaoundé")
  const douala = cities.find((c: any) => c.name === "Douala")

  if (!yaounde || !douala) {
    console.error("Yaoundé or Douala not found in database!")
    return
  }

  const yaoundeNeighborhoods = [
    "Bastos", "Biyem-Assi", "Mvog-Mbi", "Essos", "Mokolo", "Nlongkak", "Tsinga", 
    "Omnisports", "Ngousso", "Melen", "Obili", "Mendong", "Nsam", "Odza", 
    "Ekounou", "Mvan", "Ngoa-Ekélé", "Etoudi", "Emana", "Messassi", "Nkoabang", "Tropicana"
  ]

  const doualaNeighborhoods = [
    "Akwa", "Bonanjo", "Bonapriso", "Deido", "Bali", "Bepanda", "Makepe", 
    "Bonamoussadi", "Kotto", "Logpom", "Ndokoti", "Nyalla", "Yassa", "PK8", 
    "PK10", "PK14", "Ndobo", "Bonabéri", "Ndogpassi", "Cité des Palmiers", "Logbessou"
  ]

  console.log("Seeding Yaoundé neighborhoods...")
  for (const name of yaoundeNeighborhoods) {
    const existing = await welfareDeliveryModuleService.listDeliveryNeighborhoods({ name, city_id: yaounde.id })
    if (existing.length === 0) {
      await welfareDeliveryModuleService.createDeliveryNeighborhoods({
        name,
        city_id: yaounde.id,
        price: 1500 // Default price
      })
      console.log(`Created: ${name} (Yaoundé)`)
    }
  }

  console.log("Seeding Douala neighborhoods...")
  for (const name of doualaNeighborhoods) {
    const existing = await welfareDeliveryModuleService.listDeliveryNeighborhoods({ name, city_id: douala.id })
    if (existing.length === 0) {
      await welfareDeliveryModuleService.createDeliveryNeighborhoods({
        name,
        city_id: douala.id,
        price: 1500 // Default price
      })
      console.log(`Created: ${name} (Douala)`)
    }
  }

  console.log("Neighborhoods seeding complete.")
}
