import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import crypto from "crypto"
import {
  computeMobileMoneyAmount,
  describePawapayFailure,
  getEnabledCameroonCorrespondents,
  normalizeCameroonMsisdn,
  operatorMismatchMessage,
  requestDeposit,
  signDepositForCart,
} from "../../../../modules/pawapay/client"

/**
 * POST /store/pawapay/deposit
 * Body: { cart_id: string, phone: string, correspondent: string }
 *
 * Sends the Mobile Money push to the customer's phone. The amount is computed
 * server-side from the cart total (+3% Mobile Money fee) so it cannot be tampered with.
 * The order is only created later, once the deposit is COMPLETED (see provider.authorizePayment).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as { cart_id?: string; phone?: string; correspondent?: string }

  if (!body.cart_id) {
    return res.status(400).json({ message: "Panier introuvable." })
  }

  const msisdn = normalizeCameroonMsisdn(body.phone)
  if (!msisdn) {
    return res.status(400).json({
      message: "Numéro Mobile Money invalide. Utilisez un numéro camerounais (ex : 6XXXXXXXX).",
    })
  }

  const correspondent = body.correspondent || "MTN_MOMO_CMR"
  const mismatch = operatorMismatchMessage(msisdn, correspondent)
  if (mismatch) {
    return res.status(400).json({ message: mismatch })
  }
  try {
    const enabled = await getEnabledCameroonCorrespondents()
    if (!enabled.includes(correspondent)) {
      return res.status(400).json({
        message:
          correspondent.startsWith("ORANGE")
            ? "Le paiement Orange Money n'est pas encore disponible. Veuillez utiliser MTN MoMo ou le paiement manuel."
            : "Ce réseau Mobile Money n'est pas disponible.",
      })
    }
  } catch (e: any) {
    console.error("[PawaPay] active-conf check failed:", e.message)
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "total", "currency_code", "completed_at"],
    filters: { id: body.cart_id },
  })
  const cart: any = carts?.[0]
  if (!cart) {
    return res.status(404).json({ message: "Panier introuvable." })
  }
  if (cart.completed_at) {
    return res.status(400).json({ message: "Ce panier a déjà été validé." })
  }

  const amount = computeMobileMoneyAmount(Number(cart.total))
  if (amount <= 0) {
    return res.status(400).json({ message: "Le montant du panier est invalide." })
  }

  const depositId = crypto.randomUUID()
  try {
    const result = await requestDeposit({
      depositId,
      amount: String(amount),
      currency: (cart.currency_code || "XAF").toUpperCase(),
      correspondent,
      msisdn,
      statementDescription: "The Welfare Shop",
    })

    if (result.status === "REJECTED") {
      console.error("[PawaPay] Deposit rejected:", JSON.stringify(result))
      return res.status(400).json({
        message: describePawapayFailure(
          result.rejectionReason?.rejectionCode,
          `Paiement refusé : ${result.rejectionReason?.rejectionMessage || result.rejectionReason?.rejectionCode || "raison inconnue"}`
        ),
      })
    }

    // deposit_token goes back into the payment session: it ties this deposit to this cart only
    return res.json({ depositId, deposit_token: signDepositForCart(depositId, cart.id), status: result.status, amount })
  } catch (e: any) {
    console.error("[PawaPay] Deposit request failed:", e.message)
    return res.status(502).json({ message: "Impossible de contacter PawaPay. Veuillez réessayer." })
  }
}
