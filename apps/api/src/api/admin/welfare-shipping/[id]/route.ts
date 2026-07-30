import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const { name, price } = req.body as { name?: string; price?: number }

  try {
    const fulfillmentModule = req.scope.resolve(Modules.FULFILLMENT) as any

    const updatePayload: any = {}
    if (name) updatePayload.name = name
    if (price !== undefined) {
      updatePayload.prices = [{ currency_code: "xaf", amount: price }]
    }

    const updated = await fulfillmentModule.updateShippingOptions(id, updatePayload)

    res.status(200).json({ shipping_option: Array.isArray(updated) ? updated[0] : updated })
  } catch (error: any) {
    console.error("Error updating shipping option:", error)
    res.status(500).json({ message: error.message })
  }
}

export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  try {
    const fulfillmentModule = req.scope.resolve(Modules.FULFILLMENT) as any
    await fulfillmentModule.deleteShippingOptions([id])
    res.status(200).json({ success: true })
  } catch (error: any) {
    console.error("Error deleting shipping option:", error)
    res.status(500).json({ message: error.message })
  }
}
