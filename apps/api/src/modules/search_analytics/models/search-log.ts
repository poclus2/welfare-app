import { model } from "@medusajs/framework/utils"

export const SearchLog = model.define("search_log", {
  id: model.id().primaryKey(),
  term: model.text(),
  results_count: model.number(),
  region: model.text().nullable(),
})
