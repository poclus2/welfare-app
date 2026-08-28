import { model } from "@medusajs/framework/utils"

export const DeliveryWeightRule = model.define("weight_rule", {
  id: model.id().primaryKey(),
  min_weight: model.number(),
  max_weight: model.number().nullable(),
  additional_fee: model.number(),
})
