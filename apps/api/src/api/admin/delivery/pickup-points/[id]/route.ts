// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const welfareDeliveryModuleService = req.scope.resolve<any>("welfare_delivery")
  const point = await welfareDeliveryModuleService.updatePickupPoints({
    id,
    ...req.body as object,
  })
  res.json({ point })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const welfareDeliveryModuleService = req.scope.resolve<any>("welfare_delivery")
  await welfareDeliveryModuleService.deletePickupPoints(id)
  res.json({ success: true })
}
