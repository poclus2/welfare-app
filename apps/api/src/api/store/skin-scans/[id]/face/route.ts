import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SKIN_SCAN_MODULE } from "../../../../../modules/skin_scan"

// GET /store/skin-scans/:id/face — the front photo and its face map, for the analysis filter shown on
// the result page when the customer reopens one of HER diagnostics. Nothing for anyone else, and nothing
// once the photos are purged (the map is stored with them).
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id
  if (!customerId) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const skinScanService: any = req.scope.resolve(SKIN_SCAN_MODULE)
  let scan: any
  try {
    scan = await skinScanService.retrieveSkinScan(req.params.id)
  } catch {
    return res.status(404).json({ message: "Diagnostic introuvable" })
  }
  if (scan.customer_id !== customerId) {
    return res.status(404).json({ message: "Diagnostic introuvable" })
  }

  const photo = scan.images?.front
  const map = scan.images?.front_map
  if (typeof photo !== "string" || !map) {
    return res.status(404).json({ message: "Photo non disponible" })
  }
  res.setHeader("Cache-Control", "private, no-store")
  res.status(200).json({ photo, map })
}
