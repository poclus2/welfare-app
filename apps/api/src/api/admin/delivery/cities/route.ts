// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const welfareDeliveryModuleService = req.scope.resolve<any>("welfare_delivery")
  const cities = await welfareDeliveryModuleService.listDeliveryCities({}, { relations: ["neighborhoods"] })
  res.json({ cities })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const welfareDeliveryModuleService = req.scope.resolve<any>("welfare_delivery")
  const city = await welfareDeliveryModuleService.createDeliveryCities(req.body)
  res.json({ city })
}

