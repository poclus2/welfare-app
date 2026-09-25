import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CREATOR_PARTNER_MODULE } from "../../../modules/creator_partner"

function getCommissionRate(eligibleRevenue: number, tiers: any[]): number {
  // Sort tiers by min ascending
  const sorted = [...tiers].sort((a, b) => a.min - b.min)
  let rate = sorted[0]?.rate || 3
  for (const tier of sorted) {
    if (eligibleRevenue >= tier.min && (tier.max === null || eligibleRevenue <= tier.max)) {
      rate = tier.rate
    }
  }
  return rate
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(CREATOR_PARTNER_MODULE) as any
  const body = req.body as any
  const now = new Date()
  const year = body.year || now.getFullYear()
  const month = body.month || (now.getMonth() + 1)
  
  // Get commission tiers from config
  const configs = await service.listProgramConfigs({ key: 'commission_tiers' }, {})
  let tiers = [{ min: 0, max: 599999, rate: 3 }, { min: 600000, max: 999999, rate: 4 }, { min: 1000000, max: null, rate: 6 }]
  if (configs.length > 0) {
    try { tiers = JSON.parse(configs[0].value) } catch {}
  }
  
  // Get all creators
  const creators = await service.listCreatorPartners({}, {})
  const results = []
  
  for (const creator of creators) {
    // Get all completed orders for this creator this month
    const orders = await service.listCreatorOrders(
      { creator_id: creator.id, year, month },
      {}
    )
    
    const validOrders = orders.filter((o: any) => !['cancelled'].includes(o.order_status))
    const totalEligible = validOrders.reduce((sum: number, o: any) => sum + (o.eligible_revenue + o.refund_adjustment), 0)
    const newCustomers = validOrders.filter((o: any) => o.is_new_customer).length
    
    // Retroactive rate calculation (Option A)
    const commissionRate = getCommissionRate(Math.max(0, totalEligible), tiers)
    const totalCommission = Math.max(0, totalEligible) * (commissionRate / 100)
    
    // Get clicks
    const clickStart = new Date(year, month - 1, 1)
    const clickEnd = new Date(year, month, 0, 23, 59, 59)
    // Count clicks (simplified - in production filter by date)
    const clicks = await service.listCreatorClicks({ creator_id: creator.id }, {})
    const monthClicks = clicks.filter((c: any) => {
      const d = new Date(c.created_at)
      return d >= clickStart && d <= clickEnd
    }).length
    
    // Upsert summary
    const existing = await service.listCreatorMonthlySummarys(
      { creator_id: creator.id, year, month }, {}
    )
    
    const summaryData = {
      creator_id: creator.id,
      year,
      month,
      total_eligible_revenue: Math.max(0, totalEligible),
      commission_rate: commissionRate,
      total_commission: totalCommission,
      total_orders: validOrders.length,
      total_new_customers: newCustomers,
      total_clicks: monthClicks,
    }
    
    if (existing.length > 0) {
      await service.updateCreatorMonthlySummarys({ id: existing[0].id, ...summaryData })
    } else {
      await service.createCreatorMonthlySummarys(summaryData)
    }
    
    results.push({ creator_id: creator.id, code: creator.code, ...summaryData })
  }
  
  // Update ranks
  results.sort((a, b) => b.total_eligible_revenue - a.total_eligible_revenue)
  for (let i = 0; i < results.length; i++) {
    const summaries = await service.listCreatorMonthlySummarys(
      { creator_id: results[i].creator_id, year, month }, {}
    )
    if (summaries.length > 0) {
      await service.updateCreatorMonthlySummarys({ id: summaries[0].id, rank: i + 1 })
    }
  }
  
  res.json({ success: true, recalculated: results.length, year, month })
}
