import { MedusaContainer } from "@medusajs/framework/types"
import { CREATOR_PARTNER_MODULE } from "../modules/creator_partner"
import { syncCreatorOfMonthPromotions } from "../modules/creator_partner/creator-of-month-sync"

export default async function creatorOfMonthExpiryJob(container: MedusaContainer) {
  const service = container.resolve(CREATOR_PARTNER_MODULE) as any

  const expired = await service.listCreatorPartners({
    is_creator_of_month: true,
    creator_of_month_until: { $lt: new Date() },
  }, {})

  for (const creator of expired) {
    try {
      await syncCreatorOfMonthPromotions(container, creator.id)
    } catch (e) {
      console.error(`[CreatorOfMonthExpiry] Failed to revert ${creator.code}:`, e)
    }
  }
}

export const config = {
  name: "creator-of-month-expiry",
  schedule: "*/30 * * * *",
}
