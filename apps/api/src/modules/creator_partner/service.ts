import { MedusaService } from "@medusajs/framework/utils"
import { CreatorPartner } from "./models/creator-partner"
import { CreatorClick } from "./models/creator-click"
import { CreatorOrder } from "./models/creator-order"
import { CreatorMonthlySummary } from "./models/creator-monthly-summary"
import { ProgramConfig } from "./models/program-config"

class CreatorPartnerService extends MedusaService({
  CreatorPartner,
  CreatorClick,
  CreatorOrder,
  CreatorMonthlySummary,
  ProgramConfig,
}) {}

export default CreatorPartnerService
