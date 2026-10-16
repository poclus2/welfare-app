import { Module } from "@medusajs/framework/utils"
import SiteContentService from "./service"

export const SITE_CONTENT_MODULE = "site_content"

export default Module(SITE_CONTENT_MODULE, {
  service: SiteContentService,
})
