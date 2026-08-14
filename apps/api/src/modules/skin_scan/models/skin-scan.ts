import { model } from "@medusajs/framework/utils"

export const SkinScan = model.define("skin_scan", {
  id: model.id().primaryKey(),
  customer_id: model.text().nullable(),
  final_skin_type: model.text(),
  estimated_skin_age: model.number(),
  melanin_phototype: model.text().nullable(),
  concerns: model.json().nullable(),
  metrics: model.json().nullable(),
  routine: model.json().nullable(),
  images: model.json().nullable(),
  qwen_raw_summary: model.text().nullable(),
  claude_raw_summary: model.text().nullable(),
})
