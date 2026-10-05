import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

// order.canceled: take back the loyalty points that order had earned (once). Only points recorded on the
// order by loyalty-registration are taken back, so an order that never earned any costs nothing.
export default async function loyaltyOrderCanceled({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const query = container.resolve("query")
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "customer_id", "metadata", "customer.*"],
      filters: { id: data.id },
    })
    const order: any = orders?.[0]
    if (!order?.customer_id) return

    const earned = Number(order.metadata?.loyalty_points_earned) || 0
    if (earned <= 0 || order.metadata?.loyalty_points_reversed) return

    const customerModuleService = container.resolve(Modules.CUSTOMER)
    const orderModuleService: any = container.resolve(Modules.ORDER)
    const current = Number(order.customer?.metadata?.loyalty_points) || 0
    const next = Math.max(0, current - earned)

    await customerModuleService.updateCustomers(order.customer_id, {
      metadata: { ...(order.customer?.metadata || {}), loyalty_points: next },
    })
    await orderModuleService.updateOrders([
      { id: order.id, metadata: { ...(order.metadata || {}), loyalty_points_reversed: true } },
    ])
    console.log(`Took back ${earned} loyalty points from customer ${order.customer_id} (order ${order.id} canceled). New total: ${next}`)
  } catch (err) {
    console.error("Error reversing loyalty points on cancellation:", err)
  }
}

export const config: SubscriberConfig = {
  event: "order.canceled",
}
