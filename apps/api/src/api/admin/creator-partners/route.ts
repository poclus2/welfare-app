import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CREATOR_PARTNER_MODULE } from "../../../modules/creator_partner"

// GET /admin/creator-partners - list all creators
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(CREATOR_PARTNER_MODULE) as any
  const creators = await service.listCreatorPartners({}, {
    order: { created_at: "DESC" }
  })
  res.json({ creator_partners: creators })
}
