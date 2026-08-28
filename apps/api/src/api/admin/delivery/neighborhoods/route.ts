// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const welfareDeliveryModuleService = req.scope.resolve("welfare_delivery")
  const neighborhood = await welfareDeliveryModuleService.createDeliveryNeighborhoods(req.body)
  res.json({ neighborhood })
}
