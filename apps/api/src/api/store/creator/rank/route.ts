import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CREATOR_PARTNER_MODULE } from "../../../../modules/creator_partner"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(CREATOR_PARTNER_MODULE) as any
  const { code, customer_id, email } = req.query as any
  
  let creators: any[] = []
  if (code) creators = await service.listCreatorPartners({ code }, {})
  else if (customer_id) creators = await service.listCreatorPartners({ customer_id }, {})
  else if (email) creators = await service.listCreatorPartners({ email }, {})
  
  if (!creators.length) return res.status(404).json({ error: "Creator not found" })
  
  const now = new Date()
  const summaries = await service.listCreatorMonthlySummarys(
    { creator_id: creators[0].id, year: now.getFullYear(), month: now.getMonth() + 1 },
    {}
  )
  
  // Total active creators this month
  const allSummaries = await service.listCreatorMonthlySummarys(
    { year: now.getFullYear(), month: now.getMonth() + 1 },
    {}
  )
  
  res.json({
    rank: summaries[0]?.rank || null,
    total_creators: allSummaries.length,
  })
}
