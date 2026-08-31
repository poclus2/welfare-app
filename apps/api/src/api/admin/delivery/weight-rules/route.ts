// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const welfareDeliveryModuleService = req.scope.resolve<any>("welfare_delivery")
  const rules = await welfareDeliveryModuleService.listDeliveryWeightRules({})
  res.json({ rules })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const welfareDeliveryModuleService = req.scope.resolve<any>("welfare_delivery")
  const rule = await welfareDeliveryModuleService.createDeliveryWeightRules(req.body)
  res.json({ rule })
}

