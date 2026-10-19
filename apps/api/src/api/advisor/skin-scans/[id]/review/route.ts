import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SKIN_SCAN_MODULE } from "../../../../../modules/skin_scan"
import { requireAdvisor } from "../../../../../lib/skin-advisors"
import { saveScanReview } from "../../../../../lib/skin-scan-review"

// POST /advisor/skin-scans/:id/review — the advisor validates or corrects the routine of one of HER scans
// (same rules as the admin's, lib/skin-scan-review.ts)
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const advisor = await requireAdvisor(req, res)
  if (!advisor) return

  const service: any = req.scope.resolve(SKIN_SCAN_MODULE)
  const scan = await service.retrieveSkinScan(req.params.id).catch(() => null)
  if (!scan || scan.advisor_id !== advisor.id) {
    return res.status(404).json({ message: "Diagnostic introuvable" })
  }

  const result = await saveScanReview(service, scan.id, req.body, advisor.name)
  if ("error" in result) return res.status(result.error.status).json({ message: result.error.message })
  res.status(200).json({ review_status: result.review_status })
}
