import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CREATOR_PARTNER_MODULE } from "../../../../modules/creator_partner"
import { createPromotionsWorkflow } from "@medusajs/medusa/core-flows"
import { Resend } from "resend"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(CREATOR_PARTNER_MODULE) as any
  const creator = await service.retrieveCreatorPartner(req.params.id)
  
  // Fetch monthly summary for current month
  const now = new Date()
  const summaries = await service.listCreatorMonthlySummaries(
    { creator_id: creator.id, year: now.getFullYear(), month: now.getMonth() + 1 },
    {}
  )
  const currentMonth = summaries[0] || null
  
  // Fetch recent orders
  const orders = await service.listCreatorOrders(
    { creator_id: creator.id },
    { order: { created_at: "DESC" }, take: 20 }
  )
  
  res.json({ creator_partner: creator, current_month: currentMonth, recent_orders: orders })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(CREATOR_PARTNER_MODULE) as any
  const body = req.body as any
  
  const creator = await service.updateCreatorPartners({ id: req.params.id, ...body })
  res.json({ creator_partner: creator })
}
