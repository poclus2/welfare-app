import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { describeTaraFailure, getTaraPaymentStatus, isValidTaraPaymentId } from "../../../../../modules/tara/client"

/**
 * GET /store/tara/mobilepay/:id
 * Polled by the checkout page while the customer confirms the push on their phone.
 * Returns { status: "PENDING" | "SUCCESS" | "FAILURE", message? }
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  if (!isValidTaraPaymentId(id)) {
    return res.status(400).json({ message: "Identifiant de paiement invalide." })
  }

  try {
    const { status, message } = await getTaraPaymentStatus(id)
    return res.json({ status, message: status === "FAILURE" ? describeTaraFailure(message) : undefined })
  } catch (e: any) {
    console.error("[Tara] Status check failed:", e.message)
    return res.status(502).json({ message: "Impossible de vérifier le paiement." })
  }
}
