import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SKIN_SCAN_MODULE } from "../../../../../modules/skin_scan"
import { assignScan } from "../../../../../lib/skin-advisors"

// POST /admin/skin-scans/:id/advisor { advisor_id } — gives the scan to this advisor (or again to the same
// one, to tell her once more) and tells her on WhatsApp
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service: any = req.scope.resolve(SKIN_SCAN_MODULE)
  const scan = await service.retrieveSkinScan(req.params.id).catch(() => null)
  if (!scan) return res.status(404).json({ message: "Diagnostic introuvable" })

  const advisorId = (req.body as any)?.advisor_id
  const advisor = typeof advisorId === "string" ? await service.retrieveSkinAdvisor(advisorId).catch(() => null) : null
  if (!advisor) return res.status(400).json({ message: "Conseillère introuvable" })
  if (!advisor.active) return res.status(400).json({ message: "Cette conseillère est désactivée" })

  await assignScan(service, scan.id, advisor)
  res.status(200).json({ advisor_id: advisor.id })
}
