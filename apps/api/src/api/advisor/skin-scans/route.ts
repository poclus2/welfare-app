import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { SKIN_SCAN_MODULE } from "../../../modules/skin_scan"
import { requireAdvisor } from "../../../lib/skin-advisors"

// GET /advisor/skin-scans — the scans given to the logged-in advisor, latest first (without the photos), with
// why the Skin Coach flagged a routine for a human review (analysis_log.review, since 2026-10-18)
const FIELDS = ["id", "created_at", "customer_id", "final_skin_type", "review_status", "reviewed_at", "advisor_notified_at", "analysis_log"]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const advisor = await requireAdvisor(req, res)
  if (!advisor) return

  const service: any = req.scope.resolve(SKIN_SCAN_MODULE)
  const scans = await service.listSkinScans({ advisor_id: advisor.id }, { select: FIELDS, order: { created_at: "DESC" }, take: 200 })
  const withPhotos = new Set(
    (await service.listSkinScans({ advisor_id: advisor.id, images: { $ne: null } }, { select: ["id"], take: 200 })).map((s: any) => s.id)
  )

  // the customer's name, so she recognises who writes to her on WhatsApp
  const customerIds = [...new Set(scans.map((s: any) => s.customer_id).filter(Boolean))]
  const customers = customerIds.length
    ? await (req.scope.resolve(Modules.CUSTOMER) as any).listCustomers({ id: customerIds }, { select: ["id", "first_name", "last_name"] })
    : []
  const nameOf = new Map(customers.map((c: any) => [c.id, [c.first_name, c.last_name].filter(Boolean).join(" ")]))

  res.status(200).json({
    scans: scans.map(({ analysis_log, ...s }: any) => ({
      ...s,
      customer_id: undefined,
      review_flags: Array.isArray(analysis_log?.review?.reasons) ? analysis_log.review.reasons : [],
      customer_name: (s.customer_id && nameOf.get(s.customer_id)) || null,
      has_photos: withPhotos.has(s.id),
    })),
  })
}
