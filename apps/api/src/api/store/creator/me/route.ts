import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CREATOR_PARTNER_MODULE } from "../../../../modules/creator_partner"
import { resolveCreatorForCustomer } from "../../../../lib/creator-account"

// The logged-in customer's own creator dashboard (customer auth required, see middlewares.ts).
// 404 = this account is not a creator.
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(CREATOR_PARTNER_MODULE) as any
  const creator = await resolveCreatorForCustomer(
    req.scope,
    req.auth_context?.actor_id,
    req.auth_context?.auth_identity_id
  )
  if (!creator) {
    return res.status(404).json({ error: "Creator not found" })
  }
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  
  // Current month summary
  const summaries = await service.listCreatorMonthlySummaries(
    { creator_id: creator.id, year, month }, {}
  )
  const currentMonth = summaries[0] || {
    total_eligible_revenue: 0,
    commission_rate: 3,
    total_commission: 0,
    total_orders: 0,
    total_new_customers: 0,
    total_clicks: 0,
    rank: null,
    commission_status: 'pending',
  }
  
  // Get config for next tier
  const configs = await service.listProgramConfigs({ key: 'commission_tiers' }, {})
  let tiers = [{ min: 0, max: 599999, rate: 3 }, { min: 600000, max: 999999, rate: 4 }, { min: 1000000, max: null, rate: 6 }]
  if (configs.length > 0) {
    try { tiers = JSON.parse(configs[0].value) } catch {}
  }
  
  // Find next tier
  const currentRevenue = currentMonth.total_eligible_revenue
  const sortedTiers = [...tiers].sort((a: any, b: any) => a.min - b.min)
  const nextTier = sortedTiers.find((t: any) => t.min > currentRevenue)
  
  // Commission breakdown
  const pendingOrders = await service.listCreatorOrders(
    { creator_id: creator.id, commission_status: 'pending', year, month }, {}
  )
  const validatedOrders = await service.listCreatorOrders(
    { creator_id: creator.id, commission_status: 'validated', year, month }, {}
  )
  
  const pendingCommission = pendingOrders.reduce((s: number, o: any) => s + o.commission_amount, 0)
  const validatedCommission = validatedOrders.reduce((s: number, o: any) => s + o.commission_amount, 0)
  // Everything already paid since she joined: the months marked paid
  const paidMonths = await service.listCreatorMonthlySummaries(
    { creator_id: creator.id, commission_status: 'paid' }, {}
  )
  const paidCommission = paidMonths.reduce((s: number, m: any) => s + (Number(m.total_commission) || 0), 0)
  
  // Panier moyen
  const validOrdersAll = await service.listCreatorOrders(
    { creator_id: creator.id, year, month }, {}
  )
  const completedOrders = validOrdersAll.filter((o: any) => o.order_status !== 'cancelled')
  const avgBasket = completedOrders.length > 0
    ? completedOrders.reduce((s: number, o: any) => s + o.gross_products_amount, 0) / completedOrders.length
    : 0
  
  const conversionRate = currentMonth.total_clicks > 0
    ? (currentMonth.total_orders / currentMonth.total_clicks) * 100
    : 0
  
  res.json({
    creator: {
      id: creator.id,
      first_name: creator.first_name,
      last_name: creator.last_name,
      code: creator.code,
      referral_link: creator.referral_link,
      status: creator.status,
      is_creator_of_month: creator.is_creator_of_month,
      creator_of_month_until: creator.creator_of_month_until,
    },
    current_month: {
      year,
      month,
      eligible_revenue: currentMonth.total_eligible_revenue,
      total_orders: currentMonth.total_orders,
      new_customers: currentMonth.total_new_customers,
      total_clicks: currentMonth.total_clicks,
      conversion_rate: Math.round(conversionRate * 100) / 100,
      avg_basket: Math.round(avgBasket),
      commission_rate: currentMonth.commission_rate,
      total_commission: currentMonth.total_commission,
      rank: currentMonth.rank,
    },
    next_tier: nextTier ? {
      rate: nextTier.rate,
      threshold: nextTier.min,
      remaining: nextTier.min - currentRevenue,
    } : null,
    // the programme's tiers, shown on the creator's earnings page
    tiers: sortedTiers.map((t: any) => ({ min: t.min, max: t.max ?? null, rate: t.rate })),
    commissions: {
      pending: Math.round(pendingCommission),
      validated: Math.round(validatedCommission),
      paid: Math.round(paidCommission),
    }
  })
}
