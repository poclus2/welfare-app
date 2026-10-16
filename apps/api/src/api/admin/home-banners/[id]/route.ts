import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SITE_CONTENT_MODULE } from "../../../../modules/site_content"
import { pickBannerFields } from "../fields"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SITE_CONTENT_MODULE) as any
  const fields = pickBannerFields(req.body)
  for (const k of ["title", "cta_label", "cta_href"]) {
    if (k in fields && !fields[k]) {
      res.status(400).json({ message: "Titre, texte du bouton et lien sont obligatoires." })
      return
    }
  }
  const current = await service.retrieveHomeBanner(req.params.id)
  const active = fields.is_active ?? current.is_active
  const image = "image_url" in fields ? fields.image_url : current.image_url
  if (active && !image) {
    res.status(400).json({ message: "Ajoutez un visuel avant d'activer cette bannière." })
    return
  }
  const banner = await service.updateHomeBanners({ id: req.params.id, ...fields })
  res.json({ home_banner: banner })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SITE_CONTENT_MODULE) as any
  await service.deleteHomeBanners(req.params.id)
  res.json({ id: req.params.id, deleted: true })
}
