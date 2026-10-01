import { Module } from "@medusajs/framework/utils"
import OtpService from "./service"

export const OTP_MODULE = "otp"

export default Module(OTP_MODULE, {
  service: OtpService,
})
