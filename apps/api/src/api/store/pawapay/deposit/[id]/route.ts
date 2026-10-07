import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { describePawapayFailure, getDeposit, isValidDepositId } from "../../../../../modules/pawapay/client"

/**
 * GET /store/pawapay/deposit/:id
 * Polled by the checkout page while the customer confirms the push on their phone.
 * Returns { status: "ACCEPTED" | "SUBMITTED" | "ENQUEUED" | "COMPLETED" | "FAILED" | "UNKNOWN", message? }
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  if (!isValidDepositId(id)) {
    return res.status(400).json({ message: "Identifiant de paiement invalide." })
  }

  try {
    const deposit = await getDeposit(id)
    if (!deposit) {
      return res.json({ status: "UNKNOWN" })
    }
    return res.json({
      status: deposit.status,
      message: deposit.status === "FAILED"
        ? describePawapayFailure(deposit.failureReason?.failureCode, deposit.failureReason?.failureMessage)
        : undefined,
      failureCode: deposit.failureReason?.failureCode || undefined,
    })
  } catch (e: any) {
    console.error("[PawaPay] Status check failed:", e.message)
    return res.status(502).json({ message: "Impossible de vérifier le paiement." })
  }
}
