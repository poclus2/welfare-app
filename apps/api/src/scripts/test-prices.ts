import { Modules } from "@medusajs/framework/utils"
export default async function testPrices({ container }) {
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  const options = await fulfillmentModule.listShippingOptions({}, { relations: ["prices"] })
  console.log(JSON.stringify(options.map(o => ({id: o.id, name: o.name, prices: o.prices})), null, 2))
}
