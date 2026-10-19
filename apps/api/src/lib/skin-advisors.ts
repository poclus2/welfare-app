import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SKIN_SCAN_MODULE } from "../modules/skin_scan"
import { sendWhatsappTemplate, toE164 } from "./whatsapp-client"

// Skin advisors (client request, 2026-10-18; owner's choices the same day):
// - each new scan goes to an active advisor, in turn; a customer already followed by an advisor keeps hers;
// - the advisor is told on WhatsApp (Zindua template, plain text) with a link to the scan in her space;
// - she logs in there with her WhatsApp number and a password set in the admin. Her space is on the shop
//   (/conseillere) and only calls the /advisor routes: she never gets an admin account.

// ─── WhatsApp number ────────────────────────────────────────────────────────
// Stored as wa.me wants it: digits with the country code ("654815887" → "237654815887")
export const normalizeWhatsapp = (raw: string) => toE164(String(raw || "")).slice(1)
export const isValidWhatsapp = (digits: string) => /^\d{9,15}$/.test(digits)

// ─── Password ───────────────────────────────────────────────────────────────
export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  return `scrypt$${salt.toString("base64")}$${scryptSync(password, salt, 32).toString("base64")}`
}

export function passwordMatches(password: string, stored: string | null | undefined): boolean {
  const [kind, salt, hash] = String(stored || "").split("$")
  if (kind !== "scrypt" || !salt || !hash) return false
  const expected = Buffer.from(hash, "base64")
  const given = scryptSync(password, Buffer.from(salt, "base64"), expected.length)
  return timingSafeEqual(given, expected)
}

// ─── Session token ──────────────────────────────────────────────────────────
// payload.signature, HMAC-SHA256 with a key derived from the API's JWT secret (a customer or admin token can
// never pass for an advisor's, and the other way round). 30 days; a new password or a deactivation ends it.
const SESSION_MS = 30 * 24 * 60 * 60 * 1000
const key = () =>
  createHash("sha256").update(`skin-advisor:${process.env.ADVISOR_TOKEN_SECRET || process.env.JWT_SECRET || "welfare_jwt_super_secret_change_in_prod"}`).digest()
const b64url = (b: Buffer) => b.toString("base64url")

export function signAdvisorToken(advisor: { id: string; session_version?: number | null }): string {
  const payload = b64url(Buffer.from(JSON.stringify({ sub: advisor.id, v: advisor.session_version || 0, exp: Date.now() + SESSION_MS })))
  return `${payload}.${b64url(createHmac("sha256", key()).update(payload).digest())}`
}

function readAdvisorToken(token: string): { sub: string; v: number } | null {
  const [payload, sig] = token.split(".")
  if (!payload || !sig) return null
  const expected = createHmac("sha256", key()).update(payload).digest()
  const given = Buffer.from(sig, "base64url")
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString())
    if (typeof data?.sub !== "string" || typeof data?.exp !== "number" || data.exp < Date.now()) return null
    return { sub: data.sub, v: Number(data.v) || 0 }
  } catch {
    return null
  }
}

// The logged-in advisor of an /advisor route, or null after answering 401
export async function requireAdvisor(req: MedusaRequest, res: MedusaResponse): Promise<any | null> {
  const header = req.headers.authorization || ""
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : ""
  const data = token ? readAdvisorToken(token) : null
  let advisor: any = null
  if (data) {
    const service: any = req.scope.resolve(SKIN_SCAN_MODULE)
    advisor = await service.retrieveSkinAdvisor(data.sub).catch(() => null)
    if (advisor && (!advisor.active || (advisor.session_version || 0) !== data.v)) advisor = null
  }
  if (!advisor) {
    res.status(401).json({ message: "Session expirée, reconnectez-vous" })
    return null
  }
  return advisor
}

// what the admin sees of an advisor (never the password hash)
export const adminAdvisor = (a: any) => ({
  id: a.id,
  name: a.name,
  whatsapp: a.whatsapp,
  active: a.active,
  has_password: !!a.password_hash,
  last_assigned_at: a.last_assigned_at,
  created_at: a.created_at,
})

// what the shop may show of an advisor (the customer's WhatsApp button); nothing once she is deactivated
export const publicAdvisor = (a: any) => (a?.active ? { name: a.name as string, whatsapp: a.whatsapp as string } : null)

// ─── Assignment ─────────────────────────────────────────────────────────────

// The advisor already following this customer (the one of her latest scan that had one), when still active
async function advisorOfCustomer(service: any, customerId: string, exceptScanId?: string): Promise<any | null> {
  const [last] = await service.listSkinScans(
    { customer_id: customerId, advisor_id: { $ne: null }, ...(exceptScanId ? { id: { $ne: exceptScanId } } : {}) },
    { select: ["id", "advisor_id"], order: { created_at: "DESC" }, take: 1 }
  )
  if (!last?.advisor_id) return null
  const advisor = await service.retrieveSkinAdvisor(last.advisor_id).catch(() => null)
  return advisor?.active ? advisor : null
}

// Who gets a new scan: her usual advisor, otherwise the active one who has waited longest since her last scan
export async function pickAdvisor(service: any, customerId?: string | null): Promise<any | null> {
  if (customerId) {
    const usual = await advisorOfCustomer(service, customerId)
    if (usual) return usual
  }
  const active = await service.listSkinAdvisors({ active: true }, { select: ["id", "name", "whatsapp", "active", "last_assigned_at", "created_at"] })
  if (!active.length) return null
  const time = (d: any) => (d ? new Date(d).getTime() : 0)
  active.sort((a: any, b: any) => time(a.last_assigned_at) - time(b.last_assigned_at) || time(a.created_at) - time(b.created_at))
  return active[0]
}

const STORE_URL = (process.env.STORE_URL || process.env.NEXT_PUBLIC_STORE_URL || "https://thewelfarecm.com").replace(/\/+$/, "")
const ADVISOR_TEMPLATE = process.env.ZINDUA_ADVISOR_TEMPLATE || "nouveau-diagnostic"

// Tells the advisor on WhatsApp. Never throws: a scan is saved even when the message can't go out (the
// admin sees "not told" on the scan and can give it again).
export async function notifyAdvisor(service: any, scanId: string, advisor: any): Promise<void> {
  try {
    const sent = await sendWhatsappTemplate(advisor.whatsapp, ADVISOR_TEMPLATE, {
      name: String(advisor.name || "").split(/\s+/)[0] || "",
      ref: scanId,
      link: `${STORE_URL}/conseillere/scans/${scanId}`,
    })
    if (sent) await service.updateSkinScans({ id: scanId, advisor_notified_at: new Date() })
  } catch (e: any) {
    console.error(`[SkinAdvisors] Advisor ${advisor.id} not told about scan ${scanId}:`, e?.message || e)
  }
}

// Gives the scan to this advisor (counts as her turn) and tells her, without making the caller wait for WhatsApp
export async function assignScan(service: any, scanId: string, advisor: any): Promise<void> {
  await service.updateSkinScans({ id: scanId, advisor_id: advisor.id, advisor_notified_at: null })
  await service.updateSkinAdvisors({ id: advisor.id, last_assigned_at: new Date() })
  void notifyAdvisor(service, scanId, advisor)
}

// When she attaches a scan to her account: if she was already followed by another advisor, the scan goes to
// that one (as long as nobody has reviewed it yet). Returns the advisor the scan now has.
export async function keepUsualAdvisor(service: any, scan: any, customerId: string): Promise<any | null> {
  const current = scan.advisor_id ? await service.retrieveSkinAdvisor(scan.advisor_id).catch(() => null) : null
  if (scan.review_status) return current
  const usual = await advisorOfCustomer(service, customerId, scan.id)
  if (usual && usual.id !== scan.advisor_id) {
    await assignScan(service, scan.id, usual)
    return usual
  }
  return current
}
