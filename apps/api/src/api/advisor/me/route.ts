import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { requireAdvisor } from "../../../lib/skin-advisors"

// GET /advisor/me — the logged-in advisor
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const advisor = await requireAdvisor(req, res)
  if (!advisor) return
  res.status(200).json({ advisor: { id: advisor.id, name: advisor.name, whatsapp: advisor.whatsapp } })
}
