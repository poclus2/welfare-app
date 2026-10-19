import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SKIN_SCAN_MODULE } from "../../../../modules/skin_scan"
import { normalizeWhatsapp, passwordMatches, signAdvisorToken } from "../../../../lib/skin-advisors"

// POST /advisor/auth/login { whatsapp, password } — an advisor logs in to her space (storefront /conseillere,
// which calls this from its server). 5 wrong passwords for a number lock it for 15 minutes.
const MAX_FAILURES = 5
const LOCK_MS = 15 * 60 * 1000
const failures = new Map<string, { count: number; until: number }>()

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as any
  const whatsapp = normalizeWhatsapp(typeof body.whatsapp === "string" ? body.whatsapp : "")
  const password = typeof body.password === "string" ? body.password : ""
  if (!whatsapp || !password) {
    return res.status(400).json({ message: "Numéro et mot de passe requis" })
  }

  const f = failures.get(whatsapp)
  if (f && f.count >= MAX_FAILURES && f.until > Date.now()) {
    return res.status(429).json({ message: "Trop d'essais : réessayez dans 15 minutes" })
  }

  const service: any = req.scope.resolve(SKIN_SCAN_MODULE)
  const [advisor] = await service.listSkinAdvisors({ whatsapp }, { take: 1 })
  if (!advisor || !advisor.active || !passwordMatches(password, advisor.password_hash)) {
    const count = f && f.until > Date.now() ? f.count + 1 : 1
    failures.set(whatsapp, { count, until: Date.now() + LOCK_MS })
    return res.status(401).json({ message: "Numéro ou mot de passe incorrect" })
  }

  failures.delete(whatsapp)
  res.status(200).json({ token: signAdvisorToken(advisor), advisor: { id: advisor.id, name: advisor.name } })
}
