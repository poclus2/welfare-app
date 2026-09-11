import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SKIN_SCAN_MODULE } from "../../../modules/skin_scan"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const skinScanService: any = req.scope.resolve(SKIN_SCAN_MODULE)
  
  const {
    customer_id,
    final_skin_type,
    estimated_skin_age,
    melanin_phototype,
    concerns,
    metrics,
    routine,
    images,
    qwen_raw_summary,
    claude_raw_summary,
  } = req.body as any

  if (!final_skin_type || !estimated_skin_age) {
    return res.status(400).json({ message: "Missing required fields" })
  }

  const scan = await skinScanService.createSkinScans({
    customer_id,
    final_skin_type,
    estimated_skin_age,
    melanin_phototype,
    concerns,
    metrics,
    routine,
    images,
    qwen_raw_summary,
    claude_raw_summary,
  })

  res.status(200).json({ scan })
}


export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const skinScanService: any = req.scope.resolve(SKIN_SCAN_MODULE)
  const customerId = (req as any).auth_context?.actor_id

  if (!customerId) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  // Assuming skinScanService uses DML and has listSkinScans
  const scans = await skinScanService.listSkinScans({
    customer_id: customerId
  }, {
    order: { created_at: "DESC" }
  })

  res.status(200).json({ scans })
}
