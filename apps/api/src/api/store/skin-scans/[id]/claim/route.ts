import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SKIN_SCAN_MODULE } from "../../../../../modules/skin_scan"

// POST /store/skin-scans/:id/claim — the logged-in customer attaches the diagnostic she has just
// run to her own history. Only an unattached scan, created in the last 2 hours, can be claimed, so
// this can't be used to take over or overwrite someone else's scan.
const CLAIM_WINDOW_MS = 2 * 60 * 60 * 1000

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id
  if (!customerId) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const skinScanService: any = req.scope.resolve(SKIN_SCAN_MODULE)
  const { id } = req.params

  let scan: any
  try {
    scan = await skinScanService.retrieveSkinScan(id)
  } catch {
    return res.status(404).json({ message: "Diagnostic introuvable" })
  }

  if (scan.customer_id === customerId) {
    return res.status(200).json({ claimed: true }) // already hers: nothing to do
  }
  if (scan.customer_id) {
    return res.status(403).json({ message: "Ce diagnostic est déjà rattaché à un autre compte" })
  }
  if (Date.now() - new Date(scan.created_at).getTime() > CLAIM_WINDOW_MS) {
    return res.status(403).json({ message: "Ce diagnostic est trop ancien pour être rattaché" })
  }

  await skinScanService.updateSkinScans({ id, customer_id: customerId })
  res.status(200).json({ claimed: true })
}
