import { model } from "@medusajs/framework/utils"

export const ProgramConfig = model.define("program_config", {
  id: model.id().primaryKey(),
  key: model.text(),
  value: model.text(), // JSON string for complex values
  description: model.text().nullable(),
})
