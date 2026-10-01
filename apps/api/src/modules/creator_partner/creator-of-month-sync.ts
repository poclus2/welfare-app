import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updatePromotionsWorkflow } from "@medusajs/medusa/core-flows"
import { CREATOR_PARTNER_MODULE } from "./index"

// Pushes (or reverts) a creator's "creator of month" bonus onto their two real
// Promotions, so the extra discount is actually applied at checkout instead of
// just sitting as a flag on creator_partner. Shared by the admin toggle route
// and the auto-expiry scheduled job so both revert the same way.
export async function syncCreatorOfMonthPromotions(scope: any, creatorId: string) {
  const service = scope.resolve(CREATOR_PARTNER_MODULE) as any
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const creators = await service.listCreatorPartners({ id: creatorId }, {})
  if (!creators.length) return
  const creator = creators[0]

  const configs = await service.listProgramConfigs({}, {})
  const configMap: Record<string, string> = {}
  for (const c of configs) { configMap[c.key] = c.value }
  const readConfig = (key: string, fallback: any) => {
    try { return configMap[key] !== undefined ? JSON.parse(configMap[key]) : fallback } catch { return fallback }
  }
  const newRate = Number(readConfig("new_customer_discount_pct", 5))
  const returningRate = Number(readConfig("returning_customer_discount_pct", 2))

  const stillActive = creator.is_creator_of_month &&
    creator.creator_of_month_until &&
    new Date(creator.creator_of_month_until) > new Date()

  const bonus = stillActive ? Number(creator.creator_of_month_bonus_pct || 0) : 0

  const codes = [creator.code, creator.code_returning].filter(Boolean)
  if (!codes.length) return

  const { data: promos } = await query.graph({
    entity: "promotion",
    fields: ["id", "code"],
    filters: { code: codes },
  })

  const promotionsData = promos.map((p: any) => ({
    id: p.id,
    application_method: {
      value: p.code === creator.code ? newRate + bonus : returningRate + bonus,
    },
  }))

  if (promotionsData.length) {
    await updatePromotionsWorkflow(scope).run({ input: { promotionsData } })
  }

  // If the flag expired naturally (job path), clear it so future reads are consistent
  if (creator.is_creator_of_month && !stillActive) {
    await service.updateCreatorPartners({ id: creator.id, is_creator_of_month: false })
  }
}
