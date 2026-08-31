// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const welfareDeliveryModuleService = req.scope.resolve<any>("welfare_delivery")
  const points = await welfareDeliveryModuleService.listPickupPoints({ is_active: true })
  res.json({ points })
}

