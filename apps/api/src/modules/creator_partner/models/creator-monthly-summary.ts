import { model } from "@medusajs/framework/utils"

export const CreatorMonthlySummary = model.define("creator_monthly_summary", {
  id: model.id().primaryKey(),
  creator_id: model.text(),
  year: model.number(),
  month: model.number(),
  total_eligible_revenue: model.number().default(0),
  commission_rate: model.number().default(3),
  total_commission: model.number().default(0),
  total_orders: model.number().default(0),
  total_new_customers: model.number().default(0),
  total_clicks: model.number().default(0),
  rank: model.number().nullable(),
  commission_paid_at: model.dateTime().nullable(),
  commission_status: model.enum(["pending", "validated", "paid"]).default("pending"),
})
