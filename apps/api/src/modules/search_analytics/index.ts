import { Module } from "@medusajs/framework/utils"
import { SearchLog } from "./models/search-log"
import { MedusaService } from "@medusajs/framework/utils"

export const SEARCH_ANALYTICS_MODULE = "search_analytics"

class SearchAnalyticsService extends MedusaService({ SearchLog }) {}

export default Module(SEARCH_ANALYTICS_MODULE, {
  service: SearchAnalyticsService,
})
