// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const welfareDeliveryModuleService = req.scope.resolve<any>("welfare_delivery")
  const settings = await welfareDeliveryModuleService.listDeliverySettings()
  let setting = settings.length ? settings[0] : null
  if (!setting) {
    setting = await welfareDeliveryModuleService.createDeliverySettings({
      free_shipping_threshold: 50000
    })
  }
  res.json({ setting })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const welfareDeliveryModuleService = req.scope.resolve<any>("welfare_delivery")
  const settings = await welfareDeliveryModuleService.listDeliverySettings()
  let setting
  if (settings.length) {
    setting = await welfareDeliveryModuleService.updateDeliverySettings({
      id: settings[0].id,
      ...req.body as object
    })
  } else {
    setting = await welfareDeliveryModuleService.createDeliverySettings(req.body)
  }
  res.json({ setting })
}

