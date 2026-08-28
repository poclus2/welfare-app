import { model } from "@medusajs/framework/utils"

export const DeliverySetting = model.define("delivery_setting", {
  id: model.id().primaryKey(),
  free_shipping_threshold: model.number().default(0),
  cod_fee: model.number().default(0),
})
