import WelfareDeliveryModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const WELFARE_DELIVERY_MODULE = "welfare_delivery"

export default Module(WELFARE_DELIVERY_MODULE, {
  service: WelfareDeliveryModuleService,
})
