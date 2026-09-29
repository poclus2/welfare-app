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
  
  const creator = creators[0]
  const history = await service.listCreatorMonthlySummaries(
    { creator_id: creator.id },
    { order: { year: "DESC", month: "DESC" }, take: 24 }
  )
  
  res.json({ history })
}
