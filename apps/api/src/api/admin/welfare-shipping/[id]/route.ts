import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { updateShippingOptionsWorkflow, deleteShippingOptionsWorkflow } from "@medusajs/medusa/core-flows"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const { name, price } = req.body as { name?: string; price?: number }

  try {
    const updatePayload: any = { id }
    if (name) updatePayload.name = name
    if (price !== undefined) {
      updatePayload.prices = [{ currency_code: "xof", amount: price }]
    }

    const { result } = await updateShippingOptionsWorkflow(req.scope).run({
      input: [updatePayload]
    })

    res.status(200).json({ shipping_option: result[0] })
  } catch (error: any) {
    console.error("Error updating shipping option:", error)
    res.status(400).json({ message: error.message })
  }
}

export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  try {
    await deleteShippingOptionsWorkflow(req.scope).run({
      input: { ids: [id] }
    })

    res.status(200).json({ success: true })
  } catch (error: any) {
    console.error("Error deleting shipping option:", error)
    res.status(400).json({ message: error.message })
  }
}
