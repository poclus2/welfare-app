import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AMBASSADOR_APPLICATION_MODULE } from "../../../modules/ambassador_application"
import { toE164 } from "../../../lib/whatsapp-client"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(AMBASSADOR_APPLICATION_MODULE) as any
  const body = (req.body || {}) as Record<string, any>

  // The WhatsApp number is what ties the future creator space to her customer account
  // (lib/creator-account.ts), so it is required and stored in one format.
  const phoneDigits = String(body.phone || "").replace(/\D/g, "")
  if (phoneDigits.length < 9) {
    res.status(400).json({ message: "Indiquez votre numéro WhatsApp : il servira à accéder à votre espace créatrice." })
    return
  }

  const app = await service.createAmbassadorApplications({
    ...body,
    phone: toE164(String(body.phone)),
    email: typeof body.email === "string" ? body.email.trim().toLowerCase() : body.email,
  })
  res.json({ application: app })
}
