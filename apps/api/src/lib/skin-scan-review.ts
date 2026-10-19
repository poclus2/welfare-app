// Pilot phase: a skin advisor validates the routine of a scan, or corrects it (one reason per change). The
// customer then sees the reviewed routine in her account; the corrections are kept to study recurring
// mistakes, they are not taken as truth by the Skin Coach. Shared by the admin (POST /admin/skin-scans/:id/review)
// and the advisors' space (POST /advisor/skin-scans/:id/review).
//
// body: { status: "validated" }
//    or { status: "corrected", routine: RoutineStep[], corrections: [{ step_name, from, to, reason }] }

const MAX_STEPS = 8

export async function saveScanReview(
  service: any,
  scanId: string,
  body: any,
  reviewer: string
): Promise<{ review_status: "validated" | "corrected" } | { error: { status: number; message: string } }> {
  const status = body?.status
  if (status !== "validated" && status !== "corrected") {
    return { error: { status: 400, message: "status doit être « validated » ou « corrected »" } }
  }

  if (status === "validated") {
    await service.updateSkinScans({
      id: scanId,
      review_status: "validated",
      reviewed_routine: null,
      review_corrections: null,
      reviewed_by: reviewer,
      reviewed_at: new Date(),
    })
    return { review_status: "validated" }
  }

  const routine = Array.isArray(body.routine) ? body.routine.slice(0, MAX_STEPS) : null
  const corrections = Array.isArray(body.corrections) ? body.corrections.slice(0, MAX_STEPS) : []
  if (!routine || routine.length === 0) {
    return { error: { status: 400, message: "La routine corrigée est vide" } }
  }
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "")
  const cleanCorrections = corrections.map((c: any) => ({
    step_name: str(c?.step_name, 120),
    from: str(c?.from, 200),
    to: str(c?.to, 200),
    reason: str(c?.reason, 500),
  }))
  if (!cleanCorrections.length || cleanCorrections.some((c: any) => !c.reason)) {
    return { error: { status: 400, message: "Chaque correction doit avoir un motif" } }
  }
  const cleanRoutine = routine.map((s: any, i: number) => ({
    step_number: i + 1,
    step_name: str(s?.step_name, 120),
    explanation_for_client: str(s?.explanation_for_client, 2000),
    medusa_product_id: typeof s?.medusa_product_id === "string" ? s.medusa_product_id : null,
    product_name: str(s?.product_name, 200),
    // kept as the Skin Coach set them: a product she already has, the evening make-up remover
    ...(s?.already_owned === true ? { already_owned: true } : {}),
    ...(s?.evening_only === true ? { evening_only: true } : {}),
  }))

  await service.updateSkinScans({
    id: scanId,
    review_status: "corrected",
    reviewed_routine: cleanRoutine,
    review_corrections: cleanCorrections,
    reviewed_by: reviewer,
    reviewed_at: new Date(),
  })
  return { review_status: "corrected" }
}
