import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SITE_CONTENT_MODULE } from "../../../modules/site_content"
import { toE164 } from "../../../lib/whatsapp-client"

const CAMPAIGNS = ["sekoria"]

// "Être informé du lancement": a WhatsApp number (and optionally a first name and an email), with the
// consent sentence the person ticked. Signing up twice with the same number only refreshes the consent.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SITE_CONTENT_MODULE) as any
  const body = (req.body || {}) as Record<string, any>

  // honeypot: a field people never see, bots fill it
  if (body.website) {
    res.json({ ok: true })
    return
  }

  const campaign = CAMPAIGNS.includes(body.campaign) ? body.campaign : "sekoria"
  const digits = String(body.phone || "").replace(/\D/g, "")
  if (digits.length < 9 || digits.length > 15) {
    res.status(400).json({ message: "Indiquez un numéro WhatsApp valide." })
    return
  }
  const consentText = typeof body.consent_text === "string" ? body.consent_text.trim().slice(0, 500) : ""
  if (body.consent !== true || !consentText) {
    res.status(400).json({ message: "Merci d'accepter d'être contacté(e) pour le lancement." })
    return
  }
  const email =
    typeof body.email === "string" && /^\S+@\S+\.\S+$/.test(body.email.trim()) ? body.email.trim().toLowerCase() : null
  const firstName =
    typeof body.first_name === "string" && body.first_name.trim() ? body.first_name.trim().slice(0, 80) : null
  const phone = toE164(String(body.phone))

  const data = {
    campaign,
    phone,
    email,
    first_name: firstName,
    consent_text: consentText,
    consented_at: new Date(),
    source: typeof body.source === "string" ? body.source.slice(0, 80) : null,
  }

  const [existing] = await service.listLaunchSubscribers({ campaign, phone }, { take: 1 })
  if (existing) {
    await service.updateLaunchSubscribers({
      id: existing.id,
      ...data,
      email: email ?? existing.email,
      first_name: firstName ?? existing.first_name,
      source: data.source ?? existing.source,
    })
  } else {
    await service.createLaunchSubscribers(data)
  }
  res.json({ ok: true })
}
