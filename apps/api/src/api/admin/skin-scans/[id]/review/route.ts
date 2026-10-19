import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { SKIN_SCAN_MODULE } from "../../../../../modules/skin_scan"
import { saveScanReview } from "../../../../../lib/skin-scan-review"

// POST /admin/skin-scans/:id/review — pilot phase: the routine validated or corrected from the admin
// (see lib/skin-scan-review.ts; the advisors do the same from their own space)
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service: any = req.scope.resolve(SKIN_SCAN_MODULE)

  let scan: any
  try {
    scan = await service.retrieveSkinScan(req.params.id)
  } catch {
    return res.status(404).json({ message: "Diagnostic introuvable" })
  }

  // who reviewed: the logged-in admin user
  let reviewer = "admin"
  const actorId = (req as any).auth_context?.actor_id
  if (actorId) {
    try {
      const user = await (req.scope.resolve(Modules.USER) as any).retrieveUser(actorId)
      reviewer = user?.email || actorId
    } catch {
      reviewer = actorId
    }
  }

  const result = await saveScanReview(service, scan.id, req.body, reviewer)
  if ("error" in result) return res.status(result.error.status).json({ message: result.error.message })
  res.status(200).json({ review_status: result.review_status })
}
