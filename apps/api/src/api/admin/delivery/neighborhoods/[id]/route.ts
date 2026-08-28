// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const welfareDeliveryModuleService = req.scope.resolve("welfare_delivery")
  const neighborhood = await welfareDeliveryModuleService.updateDeliveryNeighborhoods({
    id,
    ...req.body as object,
  })
  res.json({ neighborhood })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const welfareDeliveryModuleService = req.scope.resolve("welfare_delivery")
  await welfareDeliveryModuleService.deleteDeliveryNeighborhoods(id)
  res.json({ success: true })
}
