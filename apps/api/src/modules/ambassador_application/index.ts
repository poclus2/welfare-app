import { Module } from "@medusajs/framework/utils"
import AmbassadorApplicationService from "./service"

export const AMBASSADOR_APPLICATION_MODULE = "ambassador_application"

export default Module(AMBASSADOR_APPLICATION_MODULE, {
  service: AmbassadorApplicationService,
})

