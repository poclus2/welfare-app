import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { verifyOtp } from "../../../../lib/otp"
import { OTP_MODULE } from "../../../../modules/otp"

const MIN_PASSWORD_LENGTH = 8

// POST /store/password-reset/confirm { phone, code, password }
// Checks the WhatsApp code sent by /store/password-reset/request, then sets the new password.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { phone, code, password } = (req.body || {}) as { phone?: string; code?: string; password?: string }

  if (!phone || !code || typeof password !== "string") {
    return res.status(400).json({ message: "Numéro, code et nouveau mot de passe sont requis." })
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ message: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` })
  }

  const verified = await verifyOtp(req.scope.resolve(OTP_MODULE), phone, String(code), "login")
  if (!verified) {
    return res.status(400).json({ message: "Code invalide ou expiré." })
  }

  const authModuleService = req.scope.resolve(Modules.AUTH)
  const identities = await authModuleService.listAuthIdentities(
    { provider_identities: { entity_id: phone, provider: "phonepass" } },
    { relations: ["provider_identities"] }
  )
  if (!identities.length) {
    return res.status(400).json({ message: "Code invalide ou expiré." })
  }

  const result: any = await authModuleService.updateProvider("phonepass", { entity_id: phone, password })
  if (!result?.success) {
    console.error("[store/password-reset/confirm] update failed:", result?.error)
    return res.status(500).json({ message: "Impossible de mettre à jour le mot de passe pour le moment." })
  }

  res.json({ success: true })
}
