import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { SKIN_SCAN_MODULE } from "../../../../modules/skin_scan"
import { requireAdvisor } from "../../../../lib/skin-advisors"

// GET /advisor/skin-scans/:id — one of HER scans: photos, answers, diagnostic, routine, notices and review.
// Another advisor's scan answers 404, as if it didn't exist. The audit trail stays for the team, except why
// the Skin Coach flagged the routine for a human review.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const advisor = await requireAdvisor(req, res)
  if (!advisor) return

  const service: any = req.scope.resolve(SKIN_SCAN_MODULE)
  const scan = await service.retrieveSkinScan(req.params.id).catch(() => null)
  if (!scan || scan.advisor_id !== advisor.id) {
    return res.status(404).json({ message: "Diagnostic introuvable" })
  }

  let customer: any = null
  if (scan.customer_id) {
    const c = await (req.scope.resolve(Modules.CUSTOMER) as any).retrieveCustomer(scan.customer_id).catch(() => null)
    if (c) customer = { first_name: c.first_name || null, last_name: c.last_name || null }
  }

  const { analysis_log, customer_id, ...rest } = scan
  res.setHeader("Cache-Control", "private, no-store")
  const review_flags = Array.isArray(analysis_log?.review?.reasons) ? analysis_log.review.reasons : []
  res.status(200).json({ skin_scan: { ...rest, has_account: !!customer_id, customer, review_flags } })
}
