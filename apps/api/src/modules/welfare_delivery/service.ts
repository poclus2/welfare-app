import { MedusaService } from "@medusajs/framework/utils"
import { DeliveryCity } from "./models/delivery-city"
import { DeliveryNeighborhood } from "./models/delivery-neighborhood"
import { DeliverySetting } from "./models/delivery-setting"
import { PickupPoint } from "./models/pickup-point"
import { DeliveryWeightRule } from "./models/weight-rule"

class WelfareDeliveryModuleService extends MedusaService({
  DeliveryCity,
  DeliveryNeighborhood,
  DeliverySetting,
  PickupPoint,
  DeliveryWeightRule,
}) {
  
  // Custom logic if needed later
  async getDeliveryPrice(cityId: string, neighborhoodId?: string): Promise<{ price: number | null }> {
    if (neighborhoodId) {
      const neighborhood = await this.retrieveDeliveryNeighborhood(neighborhoodId)
      if (neighborhood) return { price: neighborhood.price }
    }
    if (cityId) {
      const city = await this.retrieveDeliveryCity(cityId)
      if (city) return { price: city.fixed_price }
    }
    return { price: null }
  }

  async getFreeShippingThreshold(): Promise<number | null> {
    const settings = await this.listDeliverySettings()
    if (settings.length > 0) {
      return settings[0].free_shipping_threshold
    }
    return null
  }
}

export default WelfareDeliveryModuleService
