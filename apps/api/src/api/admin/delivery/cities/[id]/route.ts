// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const welfareDeliveryModuleService = req.scope.resolve("welfare_delivery")
  const city = await welfareDeliveryModuleService.updateDeliveryCities({
    id,
    ...req.body as object,
  })
  res.json({ city })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const welfareDeliveryModuleService = req.scope.resolve("welfare_delivery")
  await welfareDeliveryModuleService.deleteDeliveryCities(id)
  res.json({ success: true })
}
