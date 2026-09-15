import { MedusaService } from "@medusajs/framework/utils"
import { AmbassadorApplication } from "./models/ambassador-application"

class AmbassadorApplicationService extends MedusaService({
  AmbassadorApplication,
}) {}

export default AmbassadorApplicationService

