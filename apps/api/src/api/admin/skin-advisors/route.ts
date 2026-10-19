import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SKIN_SCAN_MODULE } from "../../../modules/skin_scan"
import { adminAdvisor, hashPassword, isValidWhatsapp, normalizeWhatsapp } from "../../../lib/skin-advisors"

// Skin advisors (lib/skin-advisors.ts): the list with their workload, and adding one.
const MIN_PASSWORD = 8

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: any = req.scope.resolve(SKIN_SCAN_MODULE)
  const advisors = await service.listSkinAdvisors({}, { order: { created_at: "ASC" } })
  const withCounts = await Promise.all(
    advisors.map(async (a: any) => {
      const [, total] = await service.listAndCountSkinScans({ advisor_id: a.id }, { select: ["id"], take: 1 })
      const [, pending] = await service.listAndCountSkinScans({ advisor_id: a.id, review_status: null }, { select: ["id"], take: 1 })
      return { ...adminAdvisor(a), scans: total, pending }
    })
  )
  res.status(200).json({ advisors: withCounts })
}

// body: { name, whatsapp, password, active? }
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service: any = req.scope.resolve(SKIN_SCAN_MODULE)
  const body = (req.body || {}) as any
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : ""
  const whatsapp = normalizeWhatsapp(typeof body.whatsapp === "string" ? body.whatsapp : "")
  const password = typeof body.password === "string" ? body.password : ""

  if (!name) return res.status(400).json({ message: "Le nom est obligatoire" })
  if (!isValidWhatsapp(whatsapp)) return res.status(400).json({ message: "Numéro WhatsApp invalide" })
  if (password.length < MIN_PASSWORD) return res.status(400).json({ message: `Mot de passe : ${MIN_PASSWORD} caractères au moins` })
  const [taken] = await service.listSkinAdvisors({ whatsapp }, { take: 1 })
  if (taken) return res.status(409).json({ message: "Une conseillère a déjà ce numéro" })

  const advisor = await service.createSkinAdvisors({
    name,
    whatsapp,
    active: body.active !== false,
    password_hash: hashPassword(password),
  })
  res.status(200).json({ advisor: adminAdvisor(advisor) })
}
