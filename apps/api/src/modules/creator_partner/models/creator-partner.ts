import { model } from "@medusajs/framework/utils"

export const CreatorPartner = model.define("creator_partner", {
  id: model.id().primaryKey(),
  application_id: model.text().nullable(),
  customer_id: model.text().nullable(),
  first_name: model.text(),
  last_name: model.text(),
  email: model.text(),
  phone: model.text().nullable(),
  code: model.text(), // e.g. ALICE5 — public code, shown to the client
  code_returning: model.text().nullable(), // internal code for the returning-customer rate, never shown
  referral_link: model.text().nullable(),
  status: model.enum(["active", "suspended", "ambassador"]).default("active"),
  is_creator_of_month: model.boolean().default(false),
  creator_of_month_until: model.dateTime().nullable(),
  creator_of_month_bonus_pct: model.number().nullable(), // bonus extra %
  creator_of_month_free_shipping: model.boolean().default(false),
  instagram: model.text().nullable(),
  tiktok: model.text().nullable(),
  youtube: model.text().nullable(),
  other_link: model.text().nullable(),
})
