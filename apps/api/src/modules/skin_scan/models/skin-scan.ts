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
  // Audit trail (client feedback, 2026-10-12): the questionnaire answers (product photos left out), the raw
  // answers of both models and every decision taken in code (exclusions, corrections, budget, texture)
  responses: model.json().nullable(),
  analysis_log: model.json().nullable(),
  // Messages decided in code and shown with the routine (doctor's opinion, budget, missing step)
  notices: model.json().nullable(),
  // Pilot: a skin advisor validates or corrects the routine afterwards, with a reason per change
  review_status: model.text().nullable(), // "validated" | "corrected"
  reviewed_routine: model.json().nullable(),
  review_corrections: model.json().nullable(), // [{ step_name, from, to, reason }]
  reviewed_by: model.text().nullable(),
  reviewed_at: model.dateTime().nullable(),
  // The advisor this scan was given to (models/skin-advisor.ts) and when she was told on WhatsApp
  advisor_id: model.text().nullable(),
  advisor_notified_at: model.dateTime().nullable(),
})
