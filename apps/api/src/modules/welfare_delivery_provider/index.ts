import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import WelfareDeliveryProviderService from "./service"

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [WelfareDeliveryProviderService],
})
