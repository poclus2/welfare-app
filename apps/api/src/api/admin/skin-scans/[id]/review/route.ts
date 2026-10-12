import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { SKIN_SCAN_MODULE } from "../../../../../modules/skin_scan"

// POST /admin/skin-scans/:id/review — pilot phase: a skin advisor validates the routine, or corrects it
// (one reason per change). The customer then sees the reviewed routine in her account; the corrections are
// kept to study recurring mistakes, they are not taken as truth by the Skin Coach.
//
// body: { status: "validated" }
//    or { status: "corrected", routine: RoutineStep[], corrections: [{ step_name, from, to, reason }] }

const MAX_STEPS = 8

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service: any = req.scope.resolve(SKIN_SCAN_MODULE)
  const body = (req.body || {}) as any
  const status = body.status

  if (status !== "validated" && status !== "corrected") {
    return res.status(400).json({ message: "status doit être « validated » ou « corrected »" })
  }

  let scan: any
  try {
    scan = await service.retrieveSkinScan(req.params.id)
  } catch {
    return res.status(404).json({ message: "Diagnostic introuvable" })
  }

  // who reviewed: the logged-in admin user
  let reviewer = "admin"
  const actorId = (req as any).auth_context?.actor_id
  if (actorId) {
    try {
      const user = await (req.scope.resolve(Modules.USER) as any).retrieveUser(actorId)
      reviewer = user?.email || actorId
    } catch {
      reviewer = actorId
    }
  }

  if (status === "validated") {
    await service.updateSkinScans({
      id: scan.id,
      review_status: "validated",
      reviewed_routine: null,
      review_corrections: null,
      reviewed_by: reviewer,
      reviewed_at: new Date(),
    })
    return res.status(200).json({ review_status: "validated" })
  }

  const routine = Array.isArray(body.routine) ? body.routine.slice(0, MAX_STEPS) : null
  const corrections = Array.isArray(body.corrections) ? body.corrections.slice(0, MAX_STEPS) : []
  if (!routine || routine.length === 0) {
    return res.status(400).json({ message: "La routine corrigée est vide" })
  }
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "")
  const cleanCorrections = corrections.map((c: any) => ({
    step_name: str(c?.step_name, 120),
    from: str(c?.from, 200),
    to: str(c?.to, 200),
    reason: str(c?.reason, 500),
  }))
  if (!cleanCorrections.length || cleanCorrections.some((c: any) => !c.reason)) {
    return res.status(400).json({ message: "Chaque correction doit avoir un motif" })
  }
  const cleanRoutine = routine.map((s: any, i: number) => ({
    step_number: i + 1,
    step_name: str(s?.step_name, 120),
    explanation_for_client: str(s?.explanation_for_client, 2000),
    medusa_product_id: typeof s?.medusa_product_id === "string" ? s.medusa_product_id : null,
    product_name: str(s?.product_name, 200),
  }))

  await service.updateSkinScans({
    id: scan.id,
    review_status: "corrected",
    reviewed_routine: cleanRoutine,
    review_corrections: cleanCorrections,
    reviewed_by: reviewer,
    reviewed_at: new Date(),
  })
  res.status(200).json({ review_status: "corrected" })
}
