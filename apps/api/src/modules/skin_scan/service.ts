import { MedusaService } from "@medusajs/framework/utils"
import { SkinScan } from "./models/skin-scan"

class SkinScanService extends MedusaService({
  SkinScan,
}) {}

export default SkinScanService
