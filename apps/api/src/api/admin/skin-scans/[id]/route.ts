import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SKIN_SCAN_MODULE } from "../../../../modules/skin_scan"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const skinScanService: any = req.scope.resolve(SKIN_SCAN_MODULE)
  
  try {
    const scan = await skinScanService.retrieveSkinScan(req.params.id)
    res.status(200).json({ skin_scan: scan })
  } catch (err) {
    res.status(404).json({ message: "Not found" })
  }
}
