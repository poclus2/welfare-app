import { Modules } from "@medusajs/framework/utils"

export default async function fixCurrency({ container }) {
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  
  const options = await fulfillmentModule.listShippingOptions({}, { relations: ["prices"] })
  for (const opt of options) {
    if (opt.prices && opt.prices.length > 0) {
      const amount = opt.prices[0].amount
      await fulfillmentModule.updateShippingOptions(opt.id, {
        prices: [{ currency_code: "xaf", amount }]
      })
      console.log(`Updated shipping option ${opt.id} to use xaf for amount ${amount}`)
    }
  }
}
