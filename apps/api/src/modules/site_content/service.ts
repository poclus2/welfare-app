import { MedusaService } from "@medusajs/framework/utils"
import { HomeBanner } from "./models/home-banner"
import { LaunchSubscriber } from "./models/launch-subscriber"

class SiteContentService extends MedusaService({
  HomeBanner,
  LaunchSubscriber,
}) {}

export default SiteContentService
