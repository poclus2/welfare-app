import { model } from "@medusajs/framework/utils"

export const DeliveryCity = model.define("delivery_city", {
  id: model.id().primaryKey(),
  name: model.text(),
  has_neighborhoods: model.boolean().default(false),
  fixed_price: model.number().nullable(),
  is_active: model.boolean().default(true),
  estimated_time: model.text().nullable(),
  neighborhoods: model.hasMany(() => require("./delivery-neighborhood").DeliveryNeighborhood, {
    mappedBy: "city",
  }),
})
