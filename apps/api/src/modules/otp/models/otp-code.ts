import { model } from "@medusajs/framework/utils"

export const OtpCode = model.define("otp_code", {
  id: model.id().primaryKey(),
  phone: model.text(),
  code_hash: model.text(), // never store the plaintext code
  purpose: model.enum(["signup", "login"]),
  expires_at: model.dateTime(),
  attempts: model.number().default(0),
  consumed_at: model.dateTime().nullable(),
})
