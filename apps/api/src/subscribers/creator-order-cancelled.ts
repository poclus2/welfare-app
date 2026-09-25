import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { CREATOR_PARTNER_MODULE } from "../modules/creator_partner"

export default async function creatorOrderCancelledHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = data.id
  const service = container.resolve(CREATOR_PARTNER_MODULE) as any
  
  try {
    const creatorOrders = await service.listCreatorOrders({ order_id: orderId }, {})
    if (!creatorOrders.length) return
    
    const co = creatorOrders[0]
    
    // Update order status and cancel commission
    await service.updateCreatorOrders({
      id: co.id,
      order_status: "cancelled",
      commission_status: "cancelled",
      eligible_revenue: 0,
      commission_amount: 0,
    })
    
    // Update monthly summary (subtract)
    const summaries = await service.listCreatorMonthlySummarys(
      { creator_id: co.creator_id, year: co.year, month: co.month }, {}
    )
    if (summaries.length > 0) {
      const s = summaries[0]
      await service.updateCreatorMonthlySummarys({
        id: s.id,
        total_eligible_revenue: Math.max(0, s.total_eligible_revenue - co.eligible_revenue),
        total_orders: Math.max(0, s.total_orders - 1),
        total_new_customers: co.is_new_customer ? Math.max(0, s.total_new_customers - 1) : s.total_new_customers,
        total_commission: Math.max(0, s.total_commission - co.commission_amount),
      })
    }
    
    console.log(`[CreatorPartner] Order ${orderId} cancelled, commission revoked.`)
  } catch (e) {
    console.error("[CreatorPartner] Error on order cancel:", e)
  }
}

export const config: SubscriberConfig = {
  event: "order.cancelled",
}
