import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import crypto from "crypto"
import {
  describePayoutFailure,
  detectCameroonOperator,
  getCameroonPayoutCorrespondents,
  getWalletBalance,
  normalizeCameroonMsisdn,
  requestPayout,
} from "../../../../modules/pawapay/client"
import {
  allowedPayoutRecipients,
  computeShopBalance,
  listPawapayPayments,
  PayoutRecord,
  readPayouts,
  writePayouts,
} from "../../../../lib/pawapay-ledger"

/**
 * POST /admin/pawapay/payouts  { amount: number, msisdn: string, note?: string }
 * Withdraws money from the PawaPay wallet to one of the shop's own Mobile Money accounts
 * (PAWAPAY_PAYOUT_RECIPIENTS), up to the shop's own balance (its validated payments minus refunds and
 * withdrawals, see computeShopBalance). Every check is done here, not trusted from the admin UI.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as { amount?: unknown; msisdn?: unknown; note?: unknown }
  const amount = Math.floor(Number(body.amount))
  const msisdn = normalizeCameroonMsisdn(typeof body.msisdn === "string" ? body.msisdn : "")
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 120) : ""

  if (!msisdn || !allowedPayoutRecipients().includes(msisdn)) {
    return res.status(400).json({ message: "Ce numéro n'est pas autorisé à recevoir un retrait (liste définie sur le serveur)." })
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ message: "Montant invalide." })
  }

  const operator = detectCameroonOperator(msisdn)
  const wanted = operator === "ORANGE" ? "ORANGE" : "MTN"
  let correspondents: Awaited<ReturnType<typeof getCameroonPayoutCorrespondents>>
  try {
    correspondents = await getCameroonPayoutCorrespondents()
  } catch (e: any) {
    console.error("[PawaPay] active-conf failed:", e.message)
    return res.status(502).json({ message: "Impossible de vérifier la configuration PawaPay. Réessayez." })
  }
  const correspondent = correspondents.find((c) => c.correspondent.startsWith(wanted))
  if (!correspondent) {
    return res.status(400).json({
      message: correspondents.length
        ? `Les retraits vers ${wanted === "MTN" ? "MTN" : "Orange"} Money ne sont pas activés sur votre compte PawaPay.`
        : "Les retraits ne sont pas encore activés sur votre compte PawaPay. Demandez à PawaPay d'activer les payouts pour MTN_MOMO_CMR.",
    })
  }
  if (amount < correspondent.min || (correspondent.max > 0 && amount > correspondent.max)) {
    return res.status(400).json({ message: `Montant hors limites PawaPay (${correspondent.min} à ${correspondent.max} XAF par retrait).` })
  }

  // The shop can only withdraw what its own customers paid (the PawaPay account may hold other money)
  const [payments, existingPayouts] = await Promise.all([listPawapayPayments(req.scope), readPayouts(req.scope)])
  const shop = computeShopBalance(payments, existingPayouts)
  if (amount > shop.available) {
    return res.status(400).json({ message: `Montant supérieur au solde disponible (${Math.floor(shop.available)} XAF).` })
  }
  // Safety net, never shown: the wallet itself must hold the amount
  try {
    const wallet = await getWalletBalance("CMR")
    if (!wallet || amount > wallet.balance) {
      return res.status(400).json({ message: "Retrait impossible pour le moment : fonds PawaPay insuffisants. Contactez PawaPay." })
    }
  } catch (e: any) {
    console.error("[PawaPay] balance check failed:", e.message)
    return res.status(502).json({ message: "Impossible de vérifier les fonds PawaPay. Réessayez." })
  }

  const payoutId = crypto.randomUUID()
  const now = new Date().toISOString()
  const record: PayoutRecord = {
    payoutId,
    amount,
    currency: "XAF",
    correspondent: correspondent.correspondent,
    msisdn,
    status: "REQUESTED",
    note: note || undefined,
    created_at: now,
    updated_at: now,
    created_by: (req as any).auth_context?.actor_id,
  }

  try {
    const result = await requestPayout({
      payoutId,
      amount: String(amount),
      currency: "XAF",
      correspondent: correspondent.correspondent,
      msisdn,
      statementDescription: "The Welfare retrait",
    })
    record.status = result.status === "DUPLICATE_IGNORED" ? "ACCEPTED" : result.status
    if (result.status === "REJECTED") {
      record.failure = describePayoutFailure(result.rejectionReason?.rejectionCode, result.rejectionReason?.rejectionMessage)
    }
  } catch (e: any) {
    console.error("[PawaPay] payout request failed:", e.message)
    record.status = "FAILED"
    record.failure = "PawaPay n'a pas pu être contacté."
  }

  // Recorded in every case, so a refused or failed attempt stays visible in the history
  // (re-read: the list may have changed while PawaPay was answering)
  const payouts = await readPayouts(req.scope)
  await writePayouts(req.scope, [record, ...payouts])

  if (record.status === "REJECTED" || record.status === "FAILED") {
    return res.status(400).json({ message: record.failure || "Retrait refusé.", payout: record })
  }
  return res.json({ payout: record })
}
