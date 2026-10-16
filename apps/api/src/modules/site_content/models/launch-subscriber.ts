import { model } from "@medusajs/framework/utils"

// Someone who asked to be told when a launch happens (Sekoria). Kept with the consent they gave:
// the exact sentence they agreed to and when.
export const LaunchSubscriber = model.define("launch_subscriber", {
  id: model.id({ prefix: "lsub" }).primaryKey(),
  campaign: model.text().default("sekoria"),
  first_name: model.text().nullable(),
  phone: model.text().nullable(),
  email: model.text().nullable(),
  consent_text: model.text(),
  consented_at: model.dateTime(),
  source: model.text().nullable(),
})
