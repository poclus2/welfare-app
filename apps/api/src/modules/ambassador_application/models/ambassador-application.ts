import { model } from "@medusajs/framework/utils"

export const AmbassadorApplication = model.define("ambassador_application", {
  id: model.id().primaryKey(),
  first_name: model.text(),
  last_name: model.text(),
  email: model.text(),
  phone: model.text().nullable(),
  instagram: model.text().nullable(),
  tiktok: model.text().nullable(),
  youtube: model.text().nullable(),
  other_link: model.text().nullable(),
  followers: model.text(),
  content_type: model.text(),
  motivation: model.text(),
  status: model.enum(["pending", "approved", "rejected"]).default("pending"),
})

