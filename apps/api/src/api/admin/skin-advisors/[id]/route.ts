import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SKIN_SCAN_MODULE } from "../../../../modules/skin_scan"
import { adminAdvisor, hashPassword, isValidWhatsapp, normalizeWhatsapp } from "../../../../lib/skin-advisors"

// POST /admin/skin-advisors/:id { name?, whatsapp?, active?, password? } — a new password or a deactivation
// ends her open sessions. An advisor is deactivated rather than deleted: her scans keep her name.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service: any = req.scope.resolve(SKIN_SCAN_MODULE)
  const advisor = await service.retrieveSkinAdvisor(req.params.id).catch(() => null)
  if (!advisor) return res.status(404).json({ message: "Conseillère introuvable" })

  const body = (req.body || {}) as any
  const update: Record<string, unknown> = { id: advisor.id }
  let endSessions = false

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : ""
    if (!name) return res.status(400).json({ message: "Le nom est obligatoire" })
    update.name = name
  }
  if (body.whatsapp !== undefined) {
    const whatsapp = normalizeWhatsapp(typeof body.whatsapp === "string" ? body.whatsapp : "")
    if (!isValidWhatsapp(whatsapp)) return res.status(400).json({ message: "Numéro WhatsApp invalide" })
    const [taken] = await service.listSkinAdvisors({ whatsapp, id: { $ne: advisor.id } }, { take: 1 })
    if (taken) return res.status(409).json({ message: "Une conseillère a déjà ce numéro" })
    if (whatsapp !== advisor.whatsapp) endSessions = true // her login changes
    update.whatsapp = whatsapp
  }
  if (body.active !== undefined) {
    update.active = !!body.active
    if (!body.active) endSessions = true
  }
  if (body.password) {
    if (typeof body.password !== "string" || body.password.length < 8) {
      return res.status(400).json({ message: "Mot de passe : 8 caractères au moins" })
    }
    update.password_hash = hashPassword(body.password)
    endSessions = true
  }
  if (endSessions) update.session_version = (advisor.session_version || 0) + 1

  const saved = await service.updateSkinAdvisors(update)
  res.status(200).json({ advisor: adminAdvisor(saved) })
}
