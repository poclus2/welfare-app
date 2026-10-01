import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CREATOR_PARTNER_MODULE } from "../../../../../modules/creator_partner"
import { syncCreatorOfMonthPromotions } from "../../../../../modules/creator_partner/creator-of-month-sync"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(CREATOR_PARTNER_MODULE) as any
  const body = req.body as any

  const creator = await service.updateCreatorPartners({
    id: req.params.id,
    is_creator_of_month: body.active,
    creator_of_month_until: body.until || null,
    creator_of_month_bonus_pct: body.bonus_pct || null,
    creator_of_month_free_shipping: body.free_shipping || false,
  })

  try { await syncCreatorOfMonthPromotions(req.scope, req.params.id) } catch (e) { console.error("Creator-of-month promo sync error:", e) }

  res.json({ creator_partner: creator })
}
