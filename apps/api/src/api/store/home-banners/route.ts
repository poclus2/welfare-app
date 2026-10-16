import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SITE_CONTENT_MODULE } from "../../../modules/site_content"

// Home page hero: the slides switched on, in the admin's order. A slide without a visual is never shown.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SITE_CONTENT_MODULE) as any
  const banners = await service.listHomeBanners({ is_active: true }, { order: { position: "ASC", created_at: "ASC" } })
  res.json({
    home_banners: banners
      .filter((b: any) => !!b.image_url)
      .map((b: any) => ({
        id: b.id,
        title: b.title,
        description: b.description,
        cta_label: b.cta_label,
        cta_href: b.cta_href,
        image_url: b.image_url,
        image_desktop_url: b.image_desktop_url,
        image_alt: b.image_alt,
        bg_color: b.bg_color,
      })),
  })
}
