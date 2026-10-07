import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getCameroonPayoutCorrespondents, getPayout, describePayoutFailure } from "../../../../modules/pawapay/client"
import {
  allowedPayoutRecipients,
  computeShopBalance,
  listPawapayPayments,
  readPayouts,
  writePayouts,
} from "../../../../lib/pawapay-ledger"

/**
 * GET /admin/pawapay/overview
 * Everything the admin "Paiements" page shows: the shop's balance computed from its own validated Mobile
 * Money payments (never the PawaPay wallet balance, which can include other activities), withdrawals
 * (pending ones are refreshed from PawaPay), totals and whether withdrawals are possible.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const [payoutConfRes, payments, storedPayouts] = await Promise.all([
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

  const balance = computeShopBalance(payments, payouts)

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
    balance: { amount: balance.available, currency: "XAF" },
    stats: {
      received: balance.received,
      payments_count: payments.length,
      fees: payments.reduce((s, p) => s + p.fee, 0),
      received_this_month: payments.filter((p) => new Date(p.created_at) >= monthStart).reduce((s, p) => s + p.charged, 0),
      refunded: balance.refunded,
      withdrawn: balance.withdrawn,
      withdrawing: balance.withdrawing,
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
