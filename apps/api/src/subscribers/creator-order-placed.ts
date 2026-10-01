import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { CREATOR_PARTNER_MODULE } from "../modules/creator_partner"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function creatorOrderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = data.id
  const service = container.resolve(CREATOR_PARTNER_MODULE) as any
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  
  try {
    // Fetch full order details
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id", "total", "subtotal", "item_total", "shipping_total",
        "discount_total", "created_at", "customer_id", "metadata",
        "promotions.*", "promotions.metadata",
        "items.*", "items.total"
      ],
      filters: { id: orderId }
    })

    if (!orders || orders.length === 0) return
    const order = orders[0]

    // Attribution: prefer the cart-metadata creator id set by /store/creator/apply-code —
    // this still works even when a different promo (e.g. launch offer) produced the
    // actual discount, since the creator code and the applied discount can differ.
    let creator: any = null
    if (order.metadata?.creator_partner_id) {
      const byId = await service.listCreatorPartners({ id: order.metadata.creator_partner_id }, {})
      if (byId.length) creator = byId[0]
    }

    // Fallback (orders placed before this attribution mechanism existed): match by
    // the applied promotion's own code/metadata.
    if (!creator) {
      const appliedPromos = order.promotions || []
      let creatorPromo: any = null

      for (const promo of appliedPromos) {
        if (promo.metadata?.is_creator_partner === true) {
          creatorPromo = promo
          break
        }
      }

      if (!creatorPromo) {
        for (const promo of appliedPromos) {
          if (promo.metadata?.is_influencer === true) {
            creatorPromo = promo
            break
          }
        }
      }

      if (!creatorPromo) return // No creator code used

      const creatorCode = creatorPromo.code
      const creators = await service.listCreatorPartners({ code: creatorCode }, {})
      if (!creators.length) return
      creator = creators[0]
    }

    if (!creator) return
    
    // Get program config
    const configs = await service.listProgramConfigs({}, {})
    const configMap: Record<string, string> = {}
    for (const c of configs) { configMap[c.key] = c.value }
    
    let tiers = [{ min: 0, max: 599999, rate: 3 }, { min: 600000, max: 999999, rate: 4 }, { min: 1000000, max: null, rate: 6 }]
    try { if (configMap.commission_tiers) tiers = JSON.parse(configMap.commission_tiers) } catch {}
    
    let paymentFeeRates = { default: 2.5 }
    try { if (configMap.payment_fee_rates) paymentFeeRates = JSON.parse(configMap.payment_fee_rates) } catch {}
    
    // Calculate eligible revenue
    // 1. Gross products = item_total (excludes shipping)
    const grossProducts = Number(order.item_total) || Number(order.subtotal) || 0
    
    // 2. Discount applied (only product discounts, not shipping)
    const discountApplied = Number(order.discount_total) || 0
    
    // 3. Net after discount
    const netAfterDiscount = grossProducts - discountApplied
    
    // 4. Payment fee
    const feeRate = Number((paymentFeeRates as any).default) || 2.5
    const paymentFeeAmount = netAfterDiscount * (feeRate / 100)
    
    // 5. Eligible revenue
    const eligibleRevenue = Math.max(0, netAfterDiscount - paymentFeeAmount)
    
    // Check if new customer
    let isNewCustomer = false
    if (order.customer_id) {
      const { data: customerOrders } = await query.graph({
        entity: "order",
        fields: ["id"],
        filters: { customer_id: order.customer_id }
      })
      isNewCustomer = customerOrders.length <= 1 // This is their first order
    }
    
    // Get current month commission rate (retroactive = based on monthly total so far)
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    
    // Get existing monthly summary
    const existingSummaries = await service.listCreatorMonthlySummaries(
      { creator_id: creator.id, year, month }, {}
    )

    // Option B (non-retroactive): the rate for THIS order is determined by
    // the revenue accumulated BEFORE this order — crossing a threshold only
    // changes the rate for sales that come after it, never for past/current
    // orders already placed this month.
    const revenueBeforeThisOrder = existingSummaries[0]?.total_eligible_revenue || 0

    const sortedTiers = [...tiers].sort((a: any, b: any) => a.min - b.min)
    const rateForRevenue = (revenue: number) => {
      let rate = sortedTiers[0]?.rate || 3
      for (const tier of sortedTiers) {
        if (revenue >= tier.min && (tier.max === null || revenue <= tier.max)) {
          rate = tier.rate
        }
      }
      return rate
    }

    const commissionRate = rateForRevenue(revenueBeforeThisOrder)
    const commissionAmount = eligibleRevenue * (commissionRate / 100)
    
    // Save creator_order
    await service.createCreatorOrders({
      creator_id: creator.id,
      order_id: orderId,
      order_status: "pending",
      gross_products_amount: grossProducts,
      discount_applied: discountApplied,
      payment_fee_amount: Math.round(paymentFeeAmount),
      payment_fee_rate: feeRate,
      eligible_revenue: Math.round(eligibleRevenue),
      commission_rate: commissionRate,
      commission_amount: Math.round(commissionAmount),
      commission_status: "pending",
      is_new_customer: isNewCustomer,
      year,
      month,
    })
    
    // Upsert monthly summary — additive only. total_commission accumulates the
    // commission_amount already fixed per order (never recomputed at a single
    // blanket rate), so past orders keep the rate they were placed at.
    const newTotal = revenueBeforeThisOrder + eligibleRevenue
    const newOrders = (existingSummaries[0]?.total_orders || 0) + 1
    const newCustomers = (existingSummaries[0]?.total_new_customers || 0) + (isNewCustomer ? 1 : 0)
    const newCommission = (existingSummaries[0]?.total_commission || 0) + commissionAmount

    // The rate shown as "current" on the dashboard is forward-looking: the
    // tier the creator has now reached, which will apply to their NEXT sale.
    const currentDisplayRate = rateForRevenue(newTotal)

    const summaryData = {
      creator_id: creator.id,
      year,
      month,
      total_eligible_revenue: Math.round(newTotal),
      commission_rate: currentDisplayRate,
      total_commission: Math.round(newCommission),
      total_orders: newOrders,
      total_new_customers: newCustomers,
    }
    
    if (existingSummaries.length > 0) {
      await service.updateCreatorMonthlySummaries({ id: existingSummaries[0].id, ...summaryData })
    } else {
      await service.createCreatorMonthlySummaries(summaryData)
    }
    
    console.log(`[CreatorPartner] Order ${orderId} attributed to ${creator.code}. Eligible: ${Math.round(eligibleRevenue)} FCFA. Commission: ${commissionRate}%.`)
    
  } catch (e) {
    console.error("[CreatorPartner] Error attributing order:", e)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
