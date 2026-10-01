import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { generateAndSendOtp, OtpRateLimitError, OtpPurpose } from "../../../../lib/otp"
import { OTP_MODULE } from "../../../../modules/otp"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { phone, purpose } = (req.body || {}) as { phone?: string; purpose?: OtpPurpose }

  if (!phone || !purpose || !["signup", "login"].includes(purpose)) {
    res.status(400).json({ message: "phone et purpose ('signup' | 'login') sont requis" })
    return
  }

  const otpService = req.scope.resolve(OTP_MODULE)

  try {
    await generateAndSendOtp(otpService, phone, purpose)
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

  res.json({ sent: true })
}
