import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { clientIp, tooManyRequests } from "../../../../lib/rate-limit"
import { generateAndSendOtp, OtpRateLimitError, OtpPurpose } from "../../../../lib/otp"
import { isWhatsappSimulated } from "../../../../lib/whatsapp-client"
import { OTP_MODULE } from "../../../../modules/otp"
import { findPhonepassIdentity } from "../../../../lib/phone-identity"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { phone, purpose, email } = (req.body || {}) as { phone?: string; purpose?: OtpPurpose; email?: string }

  if (!phone || !purpose || !["signup", "login"].includes(purpose)) {
    res.status(400).json({ message: "phone et purpose ('signup' | 'login') sont requis" })
    return
  }

  // Each code is a paid WhatsApp message: cap what one IP can trigger (generous, since many customers can
  // share one mobile-network address).
  if (tooManyRequests(`otp-send:${clientIp(req as any)}`, 30, 15 * 60 * 1000)) {
    res.status(429).json({ message: "Trop de tentatives récentes. Réessayez dans quelques minutes." })
    return
  }

  // Simulated mode (WhatsApp not connected yet): the code goes back to the browser for signup, which
  // means it proves nothing about who owns the phone. A passwordless LOGIN on that basis would let
  // anyone sign in to any account knowing only the number, so it stays off in production until the
  // real WhatsApp send is wired. (Dev can still test it: the code is in the API log.)
  const simulated = isWhatsappSimulated()
  if (simulated && purpose === "login" && process.env.NODE_ENV === "production") {
    res.status(503).json({ message: "La connexion par code WhatsApp n'est pas encore disponible. Utilisez votre mot de passe." })
    return
  }

  // Login: don't spend a WhatsApp message on a number that has no account (nor reveal whether it has one).
  if (purpose === "login") {
    const authModuleService = req.scope.resolve(Modules.AUTH)
    if (!(await findPhonepassIdentity(authModuleService, phone))) {
      res.json({ sent: true })
      return
    }
  }

  // Signup: refuse an e-mail that already has an account BEFORE spending a code (and a paid message) —
  // otherwise the customer only finds out after verifying, when Medusa rejects the profile creation.
  if (purpose === "signup" && email?.trim()) {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "customer",
      fields: ["id"],
      filters: { email: email.trim().toLowerCase(), has_account: true },
    })
    if (data.length) {
      res.status(409).json({ message: "Cette adresse e-mail est déjà utilisée par un compte. Connectez-vous ou utilisez une autre adresse." })
      return
    }
  }

  const otpService = req.scope.resolve(OTP_MODULE)

  let code: string
  try {
    ;({ code } = await generateAndSendOtp(otpService, phone, purpose))
  } catch (e: any) {
    if (e instanceof OtpRateLimitError) {
      res.status(429).json({ message: e.message })
      return
    }
    console.error("[store/otp/send] Error:", e)
    // Generic message — never leak whether the WhatsApp send itself failed
    // vs. some other internal detail, to avoid becoming a probing oracle.
    res.status(500).json({ message: "Impossible d'envoyer le code pour le moment. Réessayez." })
    return
  }

  res.json({ sent: true, ...(simulated && purpose === "signup" ? { debug_code: code } : {}) })
}
