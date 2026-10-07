import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CREATOR_PARTNER_MODULE } from "../modules/creator_partner"
import { normalizeCameroonMsisdn } from "../modules/pawapay/client"

// Data behind the admin "Paiements" page: the Mobile Money payments the shop received through PawaPay
// (read from the orders, so only validated payments count) and the withdrawals made from the PawaPay
// wallet. PawaPay v1 has no "list payouts" endpoint, so each payout is recorded here when it is sent.

export type PawapayPaymentRow = {
  payment_id: string
  order_id: string
  display_id: number | null
  created_at: string
  customer: string
  email: string | null
  payer: string | null
  order_amount: number
  charged: number
  fee: number
  deposit_id: string | null
  refunded: number
  order_status: string
}

export type PayoutRecord = {
  payoutId: string
  amount: number
  currency: string
  correspondent: string
  msisdn: string
  status: string // ACCEPTED | ENQUEUED | SUBMITTED | COMPLETED | FAILED | REJECTED
  failure?: string
  note?: string
  created_at: string
  updated_at: string
  created_by?: string
}

/** Every order paid through PawaPay, newest first. */
export async function listPawapayPayments(container: MedusaContainer): Promise<PawapayPaymentRow[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "created_at",
      "status",
      "email",
      "customer.first_name",
      "customer.last_name",
      "shipping_address.first_name",
      "shipping_address.last_name",
      "payment_collections.payments.id",
      "payment_collections.payments.provider_id",
      "payment_collections.payments.amount",
      "payment_collections.payments.data",
      "payment_collections.payments.canceled_at",
      "payment_collections.payments.refunds.amount",
    ],
    pagination: { take: 2000, order: { created_at: "DESC" } },
  })

  const rows: PawapayPaymentRow[] = []
  for (const o of orders as any[]) {
    for (const pc of o.payment_collections || []) {
      for (const p of pc.payments || []) {
        if (!String(p.provider_id || "").includes("pawapay") || p.canceled_at) continue
        const deposit = p.data?.pawapay_deposit || {}
        const orderAmount = Number(p.amount) || 0
        const charged = Number(p.data?.amount_charged ?? deposit.depositedAmount ?? orderAmount) || 0
        const name =
          [o.shipping_address?.first_name, o.shipping_address?.last_name].filter(Boolean).join(" ") ||
          [o.customer?.first_name, o.customer?.last_name].filter(Boolean).join(" ") ||
          "Client"
        rows.push({
          payment_id: p.id,
          order_id: o.id,
          display_id: o.display_id ?? null,
          created_at: o.created_at,
          customer: name,
          email: o.email || null,
          payer: deposit.payer?.address?.value || null,
          order_amount: orderAmount,
          charged,
          fee: Math.max(0, charged - orderAmount),
          deposit_id: p.data?.depositId || deposit.depositId || null,
          refunded: (p.refunds || []).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0),
          order_status: o.status,
        })
      }
    }
  }
  return rows
}

// ─── Payout records (program_config key/value store, like the Skin Coach AI config) ─────────────

const PAYOUTS_KEY = "pawapay_payouts"

export async function readPayouts(container: MedusaContainer): Promise<PayoutRecord[]> {
  const service = container.resolve(CREATOR_PARTNER_MODULE) as any
  const rows = await service.listProgramConfigs({ key: PAYOUTS_KEY }, {})
  if (!rows.length) return []
  try {
    const list = JSON.parse(rows[0].value)
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export async function writePayouts(container: MedusaContainer, list: PayoutRecord[]) {
  const service = container.resolve(CREATOR_PARTNER_MODULE) as any
  const existing = await service.listProgramConfigs({ key: PAYOUTS_KEY }, {})
  const value = JSON.stringify(list)
  if (existing.length) await service.updateProgramConfigs({ id: existing[0].id, value })
  else await service.createProgramConfigs({ key: PAYOUTS_KEY, value })
}

/**
 * Mobile Money numbers allowed to receive a withdrawal, set on the server (PAWAPAY_PAYOUT_RECIPIENTS,
 * comma separated). Kept out of the admin on purpose: a stolen admin session must not be able to send
 * the shop's money to any number.
 */
export function allowedPayoutRecipients(): string[] {
  return (process.env.PAWAPAY_PAYOUT_RECIPIENTS || "")
    .split(",")
    .map((n) => normalizeCameroonMsisdn(n.trim()))
    .filter((n): n is string => !!n)
}

/** Withdrawals that took (or may still take) money out of the wallet. */
export function isPayoutDebiting(status: string) {
  return ["ACCEPTED", "ENQUEUED", "SUBMITTED", "COMPLETED"].includes(status)
}

/**
 * The shop's own balance: what thewelfarecm.com customers paid through PawaPay, minus the refunds
 * recorded on those orders and the withdrawals (done or in progress). It is NOT the PawaPay wallet
 * balance — the PawaPay account can hold money from other activities, which must never be shown
 * here nor withdrawn from this admin.
 */
export function computeShopBalance(payments: PawapayPaymentRow[], payouts: PayoutRecord[]) {
  const received = payments.reduce((s, p) => s + p.charged, 0)
  const refunded = payments.reduce((s, p) => s + Math.min(p.refunded, p.charged), 0)
  const withdrawn = payouts.filter((p) => p.status === "COMPLETED").reduce((s, p) => s + p.amount, 0)
  const withdrawing = payouts.filter((p) => isPayoutDebiting(p.status) && p.status !== "COMPLETED").reduce((s, p) => s + p.amount, 0)
  return { received, refunded, withdrawn, withdrawing, available: Math.max(0, received - refunded - withdrawn - withdrawing) }
}
