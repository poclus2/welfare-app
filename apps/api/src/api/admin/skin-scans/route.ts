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

  // the list doesn't need the photos nor the audit trail (heavy): the detail route returns them
  res.status(200).json({ 
    // review_flags: why the Skin Coach flagged the routine for an advisor (analysis_log.review, since 2026-10-18)
    skin_scans: data.map(({ images, analysis_log, ...rest }: any) => ({
      ...rest,
      has_images: !!images && Object.keys(images).length > 0,
      review_flags: Array.isArray(analysis_log?.review?.reasons) ? analysis_log.review.reasons : [],
    })),
    count: total,
    limit,
    offset
  })
}
