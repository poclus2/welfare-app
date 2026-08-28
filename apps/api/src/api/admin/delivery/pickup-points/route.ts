// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const welfareDeliveryModuleService = req.scope.resolve("welfare_delivery")
  const points = await welfareDeliveryModuleService.listPickupPoints({})
  res.json({ points })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const welfareDeliveryModuleService = req.scope.resolve("welfare_delivery")
  const point = await welfareDeliveryModuleService.createPickupPoints(req.body)
  res.json({ point })
}
