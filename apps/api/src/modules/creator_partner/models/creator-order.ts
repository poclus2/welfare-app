import { model } from "@medusajs/framework/utils"

export const CreatorOrder = model.define("creator_order", {
  id: model.id().primaryKey(),
  creator_id: model.text(),
  order_id: model.text(),
  order_status: model.text().default("pending"), // pending, completed, cancelled, refunded
  gross_products_amount: model.number().default(0),
  discount_applied: model.number().default(0),
  payment_fee_amount: model.number().default(0),
  payment_fee_rate: model.number().default(0),
  eligible_revenue: model.number().default(0),
  commission_rate: model.number().default(3),
  commission_amount: model.number().default(0),
  commission_status: model.enum(["pending", "validated", "paid", "cancelled", "adjusted"]).default("pending"),
  is_new_customer: model.boolean().default(false),
  year: model.number(),
  month: model.number(),
  refund_adjustment: model.number().default(0),
})
