import { Module } from "@medusajs/framework/utils"
import CreatorPartnerService from "./service"

export const CREATOR_PARTNER_MODULE = "creator_partner"

export default Module(CREATOR_PARTNER_MODULE, {
  service: CreatorPartnerService,
})
