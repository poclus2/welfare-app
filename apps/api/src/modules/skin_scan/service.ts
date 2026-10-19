import { MedusaService } from "@medusajs/framework/utils"
import { SkinScan } from "./models/skin-scan"
import { SkinAdvisor } from "./models/skin-advisor"

class SkinScanService extends MedusaService({
  SkinScan,
  SkinAdvisor,
}) {}

export default SkinScanService
