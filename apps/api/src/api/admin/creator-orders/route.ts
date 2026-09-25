import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CREATOR_PARTNER_MODULE } from "../../../modules/creator_partner"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(CREATOR_PARTNER_MODULE) as any
  const { creator_id, year, month } = req.query as any
  
  const filters: Record<string, any> = {}
  if (creator_id) filters.creator_id = creator_id
  if (year) filters.year = parseInt(year)
  if (month) filters.month = parseInt(month)
  
  const orders = await service.listCreatorOrders(filters, {
    order: { created_at: "DESC" },
    take: 50
  })
  
  res.json({ creator_orders: orders })
}
