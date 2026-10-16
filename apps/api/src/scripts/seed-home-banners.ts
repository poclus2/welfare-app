import { MedusaContainer } from "@medusajs/framework/types"
import { SITE_CONTENT_MODULE } from "../modules/site_content"
import { DEFAULT_HOME_BANNERS } from "../modules/site_content/default-banners"

// Loads the home page slides asked by the shop, once. Does nothing when banners already exist, so the
// ones edited from the admin are never overwritten.
//
// Run after deploying (after db:migrate): npx medusa exec ./src/scripts/seed-home-banners.ts
export default async function seedHomeBanners({ container }: { container: MedusaContainer }) {
  const service = container.resolve(SITE_CONTENT_MODULE) as any
  const [, count] = await service.listAndCountHomeBanners({}, { take: 1 })
  if (count > 0) {
    console.log(`[seed-home-banners] ${count} banner(s) already there, nothing done.`)
    return
  }
  await service.createHomeBanners(
    DEFAULT_HOME_BANNERS.map((b, i) => ({ ...b, position: i, is_active: !!b.image_url }))
  )
  console.log(`[seed-home-banners] ${DEFAULT_HOME_BANNERS.length} banners created.`)
}
