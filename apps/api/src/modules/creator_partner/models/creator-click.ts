import { model } from "@medusajs/framework/utils"

export const CreatorClick = model.define("creator_click", {
  id: model.id().primaryKey(),
  creator_id: model.text(),
  ip_hash: model.text().nullable(),
  user_agent: model.text().nullable(),
  referrer: model.text().nullable(),
})
