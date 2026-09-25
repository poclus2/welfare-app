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
        "discount_total", "created_at", "customer_id",
        "promotions.*", "promotions.metadata",
        "items.*", "items.total"
      ],
      filters: { id: orderId }
    })
    
    if (!orders || orders.length === 0) return
    const order = orders[0]
    
    // Check if a creator code was applied
    const appliedPromos = order.promotions || []
    let creatorPromo: any = null
    
    for (const promo of appliedPromos) {
      if (promo.metadata?.is_creator_partner === true) {
        creatorPromo = promo
        break
      }
    }
    
    // Also check if promo metadata has is_influencer (backward compat)
    if (!creatorPromo) {
      for (const promo of appliedPromos) {
        if (promo.metadata?.is_influencer === true) {
          creatorPromo = promo
          break
        }
      }
    }
    
    if (!creatorPromo) return // No creator code used
    
    // Find the creator by code
    const creatorCode = creatorPromo.code
    const creators = await service.listCreatorPartners({ code: creatorCode }, {})
    if (!creators.length) return
    
    const creator = creators[0]
    
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
    const existingSummaries = await service.listCreatorMonthlySummarys(
      { creator_id: creator.id, year, month }, {}
    )
    const currentRevenue = (existingSummaries[0]?.total_eligible_revenue || 0) + eligibleRevenue
    
    // Retroactive rate
    const sortedTiers = [...tiers].sort((a: any, b: any) => a.min - b.min)
    let commissionRate = sortedTiers[0]?.rate || 3
    for (const tier of sortedTiers) {
      if (currentRevenue >= tier.min && (tier.max === null || currentRevenue <= tier.max)) {
        commissionRate = tier.rate
      }
    }
    
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
    
    // Upsert monthly summary
    const newTotal = (existingSummaries[0]?.total_eligible_revenue || 0) + eligibleRevenue
    const newOrders = (existingSummaries[0]?.total_orders || 0) + 1
    const newCustomers = (existingSummaries[0]?.total_new_customers || 0) + (isNewCustomer ? 1 : 0)
    const newCommission = newTotal * (commissionRate / 100) // Retroactive: recalc on total
    
    const summaryData = {
      creator_id: creator.id,
      year,
      month,
      total_eligible_revenue: Math.round(newTotal),
      commission_rate: commissionRate,
      total_commission: Math.round(newCommission),
      total_orders: newOrders,
      total_new_customers: newCustomers,
    }
    
    if (existingSummaries.length > 0) {
      await service.updateCreatorMonthlySummarys({ id: existingSummaries[0].id, ...summaryData })
    } else {
      await service.createCreatorMonthlySummarys(summaryData)
    }
    
    console.log(`[CreatorPartner] Order ${orderId} attributed to ${creator.code}. Eligible: ${Math.round(eligibleRevenue)} FCFA. Commission: ${commissionRate}%.`)
    
  } catch (e) {
    console.error("[CreatorPartner] Error attributing order:", e)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
