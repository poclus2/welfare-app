import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * POST /hooks/tara — webHookUrl given to Tara (it requires one).
 * Tara's Mobile Money webhook carries neither our productId nor the amount, and its signature is not
 * documented, so it is only logged: orders are confirmed by polling /transactions/status.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as Record<string, unknown>
  console.log("[Tara webhook]", JSON.stringify({ paymentId: body.paymentId, collectionId: body.collectionId, status: body.status, changeDate: body.changeDate }))
  res.status(200).json({ received: true })
}
