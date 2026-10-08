import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { verifyOtp, OtpPurpose } from "../../../../lib/otp"
import { OTP_MODULE } from "../../../../modules/otp"
import { issueLoginTicket, issueSignupTicket } from "../../../../lib/login-ticket"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { phone, code, purpose } = (req.body || {}) as { phone?: string; code?: string; purpose?: OtpPurpose }

  if (!phone || !code || !purpose || !["signup", "login"].includes(purpose)) {
    res.status(400).json({ message: "phone, code et purpose ('signup' | 'login') sont requis" })
    return
  }

  const otpService = req.scope.resolve(OTP_MODULE)
  const verified = await verifyOtp(otpService, phone, code, purpose)

  if (!verified) {
    res.status(400).json({ message: "Code invalide ou expiré.", verified: false })
    return
  }

  if (purpose === "login") {
    const authModuleService = req.scope.resolve(Modules.AUTH)
    const identities = await authModuleService.listAuthIdentities(
      { provider_identities: { entity_id: phone, provider: "phonepass" } },
      { relations: ["provider_identities"] }
    )

    if (!identities.length) {
      res.status(400).json({ message: "Aucun compte associé à ce numéro.", verified: true })
      return
    }

    res.json({ verified: true, login_ticket: issueLoginTicket(identities[0]) })
    return
  }

  // phonepass registration requires this ticket: it proves the number was verified
  res.json({ verified: true, signup_ticket: issueSignupTicket(phone) })
}
