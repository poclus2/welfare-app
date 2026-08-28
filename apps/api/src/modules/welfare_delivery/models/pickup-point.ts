import { model } from "@medusajs/framework/utils"

export const PickupPoint = model.define("pickup_point", {
  id: model.id().primaryKey(),
  name: model.text(),
  address: model.text(),
  city: model.text(),
  phone: model.text().nullable(),
  opening_hours: model.text().nullable(),
  price: model.number().default(0),
  is_active: model.boolean().default(true),
})
