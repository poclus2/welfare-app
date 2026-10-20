import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import crypto from "crypto"
import {
  computeMobileMoneyAmount,
  detectCameroonOperator,
  normalizeCameroonMsisdn,
} from "../../../../modules/pawapay/client"
import { isTaraConfigured, requestMobilePay, signTaraPaymentForCart } from "../../../../modules/tara/client"

const BACKEND_URL = (process.env.MEDUSA_BACKEND_URL || "https://api.thewelfarecm.com").replace(/\/+$/, "")

/**
 * POST /store/tara/mobilepay
 * Body: { cart_id: string, phone: string }
 *
 * Sends the Orange Money push through Tara. The amount is computed server-side from the cart total
 * (+3 % Mobile Money fee) and signed with the cart: Tara never reports the amount back, so that
 * signature is what lets the provider trust it (see modules/tara/client.ts).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as { cart_id?: string; phone?: string }

  if (!isTaraConfigured()) {
    return res.status(503).json({ message: "Le paiement Orange Money n'est pas encore disponible. Veuillez utiliser MTN MoMo ou le paiement manuel." })
  }
  if (!body.cart_id) {
    return res.status(400).json({ message: "Panier introuvable." })
  }

  const msisdn = normalizeCameroonMsisdn(body.phone)
  if (!msisdn) {
    return res.status(400).json({ message: "Numéro Orange Money invalide. Utilisez un numéro camerounais (ex : 6XXXXXXXX)." })
  }
  const operator = detectCameroonOperator(msisdn)
  if (operator && operator !== "ORANGE") {
    return res.status(400).json({
      message: `Ce numéro est un numéro ${operator === "MTN" ? "MTN" : "Nexttel"} : saisissez un numéro Orange Money${operator === "MTN" ? " ou choisissez MTN MoMo" : ""}.`,
    })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "total", "completed_at"],
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

  const paymentId = crypto.randomUUID()
  try {
    const result = await requestMobilePay({
      paymentId,
      amount,
      msisdn,
      productName: "Commande The Welfare Shop",
      webHookUrl: `${BACKEND_URL}/hooks/tara`,
    })

    if (String(result?.status || "").toUpperCase() !== "SUCCESS") {
      console.error("[Tara] mobilepay refused:", JSON.stringify(result))
      return res.status(400).json({
        message: `Paiement Orange Money refusé${result?.message ? ` : ${result.message}` : ""}. Vérifiez le numéro ou utilisez le paiement manuel.`,
      })
    }

    return res.json({
      paymentId,
      amount,
      tara_token: signTaraPaymentForCart(paymentId, cart.id, amount),
      vendor: result.vendor,
    })
  } catch (e: any) {
    console.error("[Tara] mobilepay request failed:", e.message)
    return res.status(502).json({ message: "Impossible de contacter Orange Money. Veuillez réessayer." })
  }
}
