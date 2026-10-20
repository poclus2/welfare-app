import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

// Makes the Tara payment provider (Orange Money) usable in every region. Idempotent.
// npx medusa exec ./src/scripts/enable-tara-provider.ts
export default async function enableTaraProvider({ container }) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  const { data: regions } = await query.graph({ entity: "region", fields: ["id", "name", "payment_providers.id"] })
  for (const region of regions as any[]) {
    const ids = (region.payment_providers || []).map((p: any) => p?.id)
    if (ids.includes("pp_tara_tara")) {
      console.log(`${region.name}: pp_tara_tara already enabled`)
      continue
    }
    await link.create({
      [Modules.REGION]: { region_id: region.id },
      [Modules.PAYMENT]: { payment_provider_id: "pp_tara_tara" },
    })
    console.log(`${region.name}: pp_tara_tara enabled (was: ${ids.join(", ") || "none"})`)
  }
}
