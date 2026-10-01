import { MedusaService } from "@medusajs/framework/utils"
import { OtpCode } from "./models/otp-code"

class OtpService extends MedusaService({
  OtpCode,
}) {}

export default OtpService
