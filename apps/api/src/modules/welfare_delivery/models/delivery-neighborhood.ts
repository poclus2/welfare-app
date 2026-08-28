import { model } from "@medusajs/framework/utils"
import { DeliveryCity } from "./delivery-city"

export const DeliveryNeighborhood = model.define("delivery_neighborhood", {
  id: model.id().primaryKey(),
  name: model.text(),
  price: model.number().default(0),
  is_active: model.boolean().default(true),
  estimated_time: model.text().nullable(),
  city: model.belongsTo(() => DeliveryCity, {
    mappedBy: "neighborhoods",
  }),
})
