import { timingSafeEqual } from "crypto"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SKIN_SCAN_MODULE } from "../../../modules/skin_scan"

// Skin diagnostics.
//
// POST  is called by the storefront's server action right after the AI analysis. It carries the
//       customer's face photos, so it must not be callable by the public: it needs the shared server
//       token (SKIN_SCAN_TOKEN, known only to the storefront server and this API). It never trusts a
//       customer_id from the body — a scan is created unattached, and the logged-in customer attaches
//       it to herself afterwards with POST /store/skin-scans/:id/claim.
// GET   lists the logged-in customer's own scans (without the photos).

const MAX_IMAGE_CHARS = 8_000_000 // ~6 MB of base64 per photo
const MAX_TEXT_CHARS = 20_000

function tokenOk(header: string | string[] | undefined): boolean {
  const expected = process.env.SKIN_SCAN_TOKEN
  if (!expected) return false // not configured: refuse everything rather than leave the route open
  const given = Array.isArray(header) ? header[0] : header
  if (!given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

if (!process.env.SKIN_SCAN_TOKEN) {
  console.warn("[skin-scans] SKIN_SCAN_TOKEN is not set: saving diagnostics is disabled until it is.")
}

const text = (v: unknown, max = MAX_TEXT_CHARS) => (typeof v === "string" ? v.slice(0, max) : null)

// JSON kept only when it is reasonably small (audit trail, answers, notices)
const MAX_JSON_CHARS = 300_000
const json = (v: unknown) => {
  if (v === null || v === undefined || typeof v !== "object") return null
  try {
    return JSON.stringify(v).length <= MAX_JSON_CHARS ? v : null
  } catch {
    return null
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!tokenOk(req.headers["x-skin-scan-token"])) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const skinScanService: any = req.scope.resolve(SKIN_SCAN_MODULE)
  const body = (req.body || {}) as any

  const final_skin_type = text(body.final_skin_type, 200)
  const estimated_skin_age = Number(body.estimated_skin_age)
  if (!final_skin_type || !Number.isFinite(estimated_skin_age)) {
    return res.status(400).json({ message: "Missing required fields" })
  }

  // photos: { front, left, right } as sent by the storefront (what the admin gallery reads)
  const images: Record<string, string> = {}
  for (const key of ["front", "left", "right"]) {
    const v = body.images?.[key]
    if (typeof v === "string" && v.length <= MAX_IMAGE_CHARS) images[key] = v
  }
  const routine = Array.isArray(body.routine) ? body.routine.slice(0, 12) : []
  const concerns = Array.isArray(body.concerns) ? body.concerns.slice(0, 30).map((c: unknown) => String(c).slice(0, 200)) : []

  const scan = await skinScanService.createSkinScans({
    customer_id: null, // attached later by the customer herself (see claim route)
    final_skin_type,
    estimated_skin_age,
    melanin_phototype: text(body.melanin_phototype, 200),
    concerns,
    metrics: body.metrics && typeof body.metrics === "object" ? body.metrics : null,
    routine,
    images,
    qwen_raw_summary: text(body.qwen_raw_summary),
    claude_raw_summary: text(body.claude_raw_summary),
    responses: json(body.responses),
    analysis_log: json(body.analysis_log),
    notices: Array.isArray(body.notices) ? json(body.notices.slice(0, 10)) : null,
  })

  res.status(200).json({ scan: { id: scan.id } })
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const skinScanService: any = req.scope.resolve(SKIN_SCAN_MODULE)
  const customerId = (req as any).auth_context?.actor_id

  if (!customerId) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const scans = await skinScanService.listSkinScans(
    { customer_id: customerId },
    { order: { created_at: "DESC" } }
  )

  // the photos stay on the server: they are heavy and the customer's history doesn't show them; the audit
  // trail is for the team only
  res.status(200).json({ scans: scans.map(({ images, analysis_log, reviewed_by, ...rest }: any) => rest) })
}
