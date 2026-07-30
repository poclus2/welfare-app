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

    await fulfillmentModule.updateShippingOptions(id, updatePayload)

    // Update Price if provided
    if (price !== undefined) {
      const remoteQuery = req.scope.resolve("remoteQuery")
      const query = {
        entryPoint: "shipping_option",
        variables: { id: [id] },
        fields: ["id", "price_set.id", "price_set.prices.id"]
      }
      const data = await remoteQuery(query)
      if (data && data[0]) {
        const pricingModule = req.scope.resolve(Modules.PRICING) as any
        const priceSet = data[0].price_set
        if (priceSet) {
          if (priceSet.prices && priceSet.prices.length > 0) {
            await pricingModule.updatePrices([
              { id: priceSet.prices[0].id, amount: price }
            ])
          } else {
            await pricingModule.createPrices([
              { price_set_id: priceSet.id, currency_code: "xaf", amount: price }
            ])
          }
        } else {
          const newPriceSet = await pricingModule.createPriceSets({
            rules: [],
            prices: [{ currency_code: "xaf", amount: price }]
          })
          const remoteLink = req.scope.resolve("remoteLink")
          await remoteLink.create({
            [Modules.FULFILLMENT]: { shipping_option_id: id },
            [Modules.PRICING]: { price_set_id: newPriceSet.id }
          })
        }
      }
    }

    res.status(200).json({ success: true })
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
