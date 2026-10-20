import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { generateAndSendOtp, OtpRateLimitError } from "../../../../lib/otp"
import { isWhatsappSimulated } from "../../../../lib/whatsapp-client"
import { OTP_MODULE } from "../../../../modules/otp"
import { findPhonepassIdentity } from "../../../../lib/phone-identity"

// POST /store/password-reset/request { phone }
//
// "Mot de passe oublié": the customer proves she owns the phone with a WhatsApp code, then sets a new
// password (POST /store/password-reset/confirm). Medusa's own reset flow only emits a token event that
// nothing here ever delivered, so the page used to claim "a code was sent" while nothing left the server.
//
// While the WhatsApp send is simulated in production the code can't reach anyone, and handing it back
// to the browser would let anybody reset any account with just its phone number: so the feature says it
// is not available yet instead of pretending. (Dev can test it: the code is in the API log.)
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { phone } = (req.body || {}) as { phone?: string }
  if (!phone || typeof phone !== "string") {
    return res.status(400).json({ message: "Le numéro de téléphone est requis." })
  }

  if (isWhatsappSimulated() && process.env.NODE_ENV === "production") {
    return res.status(503).json({
      message: "La réinitialisation par WhatsApp n'est pas encore disponible. Contactez-nous pour récupérer votre accès.",
    })
  }

  // Same answer whether or not the number has an account, so the form can't be used to find out.
  const authModuleService = req.scope.resolve(Modules.AUTH)
  if (!(await findPhonepassIdentity(authModuleService, phone))) {
    return res.json({ sent: true })
  }

  try {
    // stored under the "login" purpose: it is the same proof of possession of the phone
    await generateAndSendOtp(req.scope.resolve(OTP_MODULE), phone, "login")
  } catch (e: any) {
    if (e instanceof OtpRateLimitError) {
      return res.status(429).json({ message: e.message })
    }
    console.error("[store/password-reset/request] Error:", e)
    return res.status(500).json({ message: "Impossible d'envoyer le code pour le moment. Réessayez." })
  }

  res.json({ sent: true })
}
