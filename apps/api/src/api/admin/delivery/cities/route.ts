// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const welfareDeliveryModuleService = req.scope.resolve<any>("welfare_delivery")
  const cities = await welfareDeliveryModuleService.listDeliveryCities({}, { relations: ["neighborhoods"] })
  res.json({ cities })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const welfareDeliveryModuleService = req.scope.resolve<any>("welfare_delivery")
  const name = (req.body as any)?.name?.trim()

  if (!name) {
    res.status(400).json({ message: "Le nom de la ville est requis." })
    return
  }

  const existing = await welfareDeliveryModuleService.listDeliveryCities({})
  const duplicate = existing.find((c: any) => c.name.trim().toLowerCase() === name.toLowerCase())
  if (duplicate) {
    res.status(409).json({ message: `Une ville nommée "${name}" existe déjà.` })
    return
  }

  const city = await welfareDeliveryModuleService.createDeliveryCities({ ...(req.body as object), name })
  res.json({ city })
}

