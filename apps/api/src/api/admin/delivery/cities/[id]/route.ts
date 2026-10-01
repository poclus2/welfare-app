// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const welfareDeliveryModuleService = req.scope.resolve<any>("welfare_delivery")
  const body = { ...(req.body as object) } as any

  if (typeof body.name === "string") {
    const name = body.name.trim()
    if (!name) {
      res.status(400).json({ message: "Le nom de la ville est requis." })
      return
    }
    const existing = await welfareDeliveryModuleService.listDeliveryCities({})
    const duplicate = existing.find((c: any) => c.id !== id && c.name.trim().toLowerCase() === name.toLowerCase())
    if (duplicate) {
      res.status(409).json({ message: `Une ville nommée "${name}" existe déjà.` })
      return
    }
    body.name = name
  }

  const city = await welfareDeliveryModuleService.updateDeliveryCities({
    id,
    ...body,
  })
  res.json({ city })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const welfareDeliveryModuleService = req.scope.resolve<any>("welfare_delivery")
  await welfareDeliveryModuleService.deleteDeliveryCities(id)
  res.json({ success: true })
}
