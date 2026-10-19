import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SKIN_SCAN_MODULE } from "../../../../../modules/skin_scan"
import { publicAdvisor } from "../../../../../lib/skin-advisors"

// GET /store/skin-scans/:id/advisor — the advisor of one of HER diagnostics (name and WhatsApp number), for
// the "Demander l'avis d'une conseillère" button. null when the scan has none (the shop's number is used).
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id
  if (!customerId) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const service: any = req.scope.resolve(SKIN_SCAN_MODULE)
  const scan = await service.retrieveSkinScan(req.params.id).catch(() => null)
  if (!scan || scan.customer_id !== customerId) {
    return res.status(404).json({ message: "Diagnostic introuvable" })
  }
  const advisor = scan.advisor_id ? await service.retrieveSkinAdvisor(scan.advisor_id).catch(() => null) : null
  res.status(200).json({ advisor: publicAdvisor(advisor) })
}
