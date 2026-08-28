import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const welfareDeliveryModuleService = req.scope.resolve("welfare_delivery")

  const cities = await welfareDeliveryModuleService.listDeliveryCities(
    { is_active: true },
    { relations: ["neighborhoods"] }
  )

  res.json({ cities })
}
