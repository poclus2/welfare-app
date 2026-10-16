import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SITE_CONTENT_MODULE } from "../../../modules/site_content"
import { pickBannerFields } from "./fields"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SITE_CONTENT_MODULE) as any
  const banners = await service.listHomeBanners({}, { order: { position: "ASC", created_at: "ASC" } })
  res.json({ home_banners: banners })
}

// A new slide goes at the end, switched off until it has been checked
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SITE_CONTENT_MODULE) as any
  const fields = pickBannerFields(req.body)
  if (!fields.title || !fields.cta_label || !fields.cta_href) {
    res.status(400).json({ message: "Titre, texte du bouton et lien sont obligatoires." })
    return
  }
  const all = await service.listHomeBanners({}, { select: ["id", "position"] })
  const position = all.reduce((m: number, b: any) => Math.max(m, b.position ?? 0), -1) + 1
  const banner = await service.createHomeBanners({ ...fields, is_active: false, position })
  res.json({ home_banner: banner })
}
