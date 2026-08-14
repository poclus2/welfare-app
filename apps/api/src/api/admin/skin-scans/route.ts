import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SKIN_SCAN_MODULE } from "../../../modules/skin_scan"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const skinScanService: any = req.scope.resolve(SKIN_SCAN_MODULE)
  
  const limit = parseInt(req.query.limit as string) || 20
  const offset = parseInt(req.query.offset as string) || 0

  const [data, total] = await skinScanService.listAndCountSkinScans(
    {},
    {
      take: limit,
      skip: offset,
      order: { created_at: "DESC" }
    }
  )

  res.status(200).json({ 
    skin_scans: data,
    count: total,
    limit,
    offset
  })
}
