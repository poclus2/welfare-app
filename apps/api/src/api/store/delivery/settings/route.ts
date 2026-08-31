// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const welfareDeliveryModuleService = req.scope.resolve<any>("welfare_delivery")
  const settings = await welfareDeliveryModuleService.listDeliverySettings()
  const setting = settings.length ? settings[0] : null
  res.json({ setting })
}

