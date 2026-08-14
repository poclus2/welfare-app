import SkinScanService from "./service"
import { Module } from "@medusajs/framework/utils"

export const SKIN_SCAN_MODULE = "skin_scan"

export default Module(SKIN_SCAN_MODULE, {
  service: SkinScanService,
})
