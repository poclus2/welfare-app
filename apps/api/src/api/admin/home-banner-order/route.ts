import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SITE_CONTENT_MODULE } from "../../../modules/site_content"

// New order of the home page slides. Body: { ids: [...] }
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SITE_CONTENT_MODULE) as any
  const ids = (req.body as any)?.ids
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
    res.status(400).json({ message: "Ordre invalide" })
    return
  }
  await service.updateHomeBanners(ids.map((id: string, position: number) => ({ id, position })))
  res.json({ ok: true })
}
