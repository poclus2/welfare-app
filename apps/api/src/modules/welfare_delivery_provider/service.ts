// @ts-nocheck
import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils"
import { CalculateShippingOptionPriceDTO, FulfillmentOption } from "@medusajs/framework/types"

class WelfareDeliveryProviderService extends AbstractFulfillmentProviderService {
  static identifier = "welfare_delivery_provider"
  protected container_: any

  constructor(container: any) {
    super(...arguments)
    this.container_ = container
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return [
      {
        id: "welfare-standard",
      },
    ]
  }

  async validateFulfillmentData(optionData: any, data: any, context: any) {
    return data
  }

  async validateOption(data: any) {
    return true
  }

  async canCalculate(data: any) {
    return true
  }

  async calculatePrice(
    optionData: any,
    data: any,
    cart: any
  ): Promise<any> {
    const welfareDeliveryService = this.container_.resolve("welfare_delivery")
    const metadata = cart?.metadata || {}
    const cityName = metadata.city_name
    const neighborhoodId = metadata.neighborhood_id
    const pickupPointId = metadata.pickup_point_id

    let price = 3000

    if (pickupPointId) {
      const points = await welfareDeliveryService.listPickupPoints({ id: pickupPointId, is_active: true })
      if (points.length) price = points[0].price
    } else if (neighborhoodId) {
      const hoods = await welfareDeliveryService.listDeliveryNeighborhoods({ id: neighborhoodId, is_active: true })
      if (hoods.length) price = hoods[0].price
    } else if (cityName) {
      const cities = await welfareDeliveryService.listDeliveryCities({ name: cityName, is_active: true })
      if (cities.length && cities[0].fixed_price !== null) price = cities[0].fixed_price
    }

    // Calculate total weight (assuming items have variant.weight in grams)
    let totalWeight = 0;
    if (cart?.items) {
      for (const item of cart.items) {
        const weight = item.variant?.weight || item.weight || 0;
        totalWeight += weight * item.quantity;
      }
    }

    if (totalWeight > 0) {
      const weightRules = await welfareDeliveryService.listDeliveryWeightRules()
      for (const rule of weightRules) {
        if (totalWeight >= rule.min_weight && (rule.max_weight === null || totalWeight <= rule.max_weight)) {
          price += rule.additional_fee;
          break;
        }
      }
    }

    // Check free shipping threshold
    const settings = await welfareDeliveryService.listDeliverySettings()
    if (settings.length > 0 && settings[0].free_shipping_threshold) {
      const cartTotal = cart?.subtotal || cart?.item_subtotal || 0
      if (cartTotal >= settings[0].free_shipping_threshold) {
        return { calculated_amount: 0 }
      }
    }

    return { calculated_amount: price }
  }

  async createFulfillment(data: any, items: any, order: any, fulfillment: any) {
    return data
  }

  async cancelFulfillment(fulfillment: any) {
    return {}
  }
}

export default WelfareDeliveryProviderService
