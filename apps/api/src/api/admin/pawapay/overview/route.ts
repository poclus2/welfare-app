import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getCameroonPayoutCorrespondents, getPayout, getWalletBalance, describePayoutFailure } from "../../../../modules/pawapay/client"
import {
  allowedPayoutRecipients,
  isPayoutDebiting,
  listPawapayPayments,
  readPayouts,
  writePayouts,
} from "../../../../lib/pawapay-ledger"

/**
 * GET /admin/pawapay/overview
 * Everything the admin "Paiements" page shows: live PawaPay balance, validated Mobile Money payments,
 * withdrawals (pending ones are refreshed from PawaPay), totals and whether withdrawals are possible.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const [balanceRes, payoutConfRes, payments, storedPayouts] = await Promise.all([
    getWalletBalance("CMR").then((b) => ({ ok: true as const, b }), (e) => ({ ok: false as const, error: e.message })),
    getCameroonPayoutCorrespondents().then((c) => ({ ok: true as const, c }), (e) => ({ ok: false as const, error: e.message })),
    listPawapayPayments(req.scope),
    readPayouts(req.scope),
  ])

  // Refresh withdrawals that are not final yet
  let payouts = storedPayouts
  const pending = payouts.filter((p) => ["ACCEPTED", "ENQUEUED", "SUBMITTED"].includes(p.status))
  if (pending.length) {
    let changed = false
    payouts = await Promise.all(
      payouts.map(async (p) => {
        if (!pending.includes(p)) return p
        try {
          const live = await getPayout(p.payoutId)
          if (live && live.status !== p.status) {
            changed = true
            return {
              ...p,
              status: live.status,
              failure: live.status === "FAILED" ? describePayoutFailure(live.failureReason?.failureCode, live.failureReason?.failureMessage) : undefined,
              updated_at: new Date().toISOString(),
            }
          }
        } catch (e: any) {
          console.error(`[PawaPay] payout ${p.payoutId} status check failed:`, e.message)
        }
        return p
      })
    )
    if (changed) await writePayouts(req.scope, payouts)
  }

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const received = payments.reduce((s, p) => s + p.charged, 0)
  const withdrawn = payouts.filter((p) => p.status === "COMPLETED").reduce((s, p) => s + p.amount, 0)
  const withdrawing = payouts.filter((p) => isPayoutDebiting(p.status) && p.status !== "COMPLETED").reduce((s, p) => s + p.amount, 0)

  // Daily amounts received over the last 30 days (for the chart)
  const days: { date: string; amount: number; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    days.push({ date: d.toISOString().slice(0, 10), amount: 0, count: 0 })
  }
  const byDay = new Map(days.map((d) => [d.date, d]))
  for (const p of payments) {
    const day = byDay.get(new Date(p.created_at).toISOString().slice(0, 10))
    if (day) {
      day.amount += p.charged
      day.count += 1
    }
  }

  const correspondents = payoutConfRes.ok ? payoutConfRes.c : []
  res.json({
    balance: balanceRes.ok
      ? { available: true, amount: balanceRes.b?.balance ?? 0, currency: balanceRes.b?.currency ?? "XAF" }
      : { available: false, error: "error" in balanceRes ? balanceRes.error : null },
    stats: {
      received,
      payments_count: payments.length,
      fees: payments.reduce((s, p) => s + p.fee, 0),
      received_this_month: payments.filter((p) => new Date(p.created_at) >= monthStart).reduce((s, p) => s + p.charged, 0),
      recorded_refunds: payments.reduce((s, p) => s + p.refunded, 0),
      withdrawn,
      withdrawing,
      // What should be on the wallet if only the shop's payments and withdrawals moved it; the gap with the
      // live balance is PawaPay's commission (and anything done outside this admin)
      expected_balance: received - withdrawn - withdrawing,
    },
    daily: days,
    payments: payments.slice(0, 500),
    payouts: [...payouts].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    payout: {
      enabled: correspondents.length > 0,
      correspondents,
      recipients: allowedPayoutRecipients(),
      config_error: "error" in payoutConfRes ? payoutConfRes.error : null,
    },
  })
}
