import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CREATOR_PARTNER_MODULE } from "../../../../modules/creator_partner"
import * as crypto from "crypto"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(CREATOR_PARTNER_MODULE) as any
  const { code } = req.params
  
  const creators = await service.listCreatorPartners({ code: code.toUpperCase() }, {})
  
  const storeFrontUrl = process.env.STORE_URL || process.env.NEXT_PUBLIC_STORE_URL || "https://thewelfare.store"
  
  if (!creators.length) {
    return res.redirect(`${storeFrontUrl}?error=invalid_code`)
  }
  
  const creator = creators[0]
  
  // Track click
  try {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket?.remoteAddress || ''
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16)
    
    await service.createCreatorClicks({
      creator_id: creator.id,
      ip_hash: ipHash,
      user_agent: (req.headers['user-agent'] as string)?.substring(0, 200),
      referrer: (req.headers['referer'] as string)?.substring(0, 500),
    })
    
    // Update monthly click count
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const existing = await service.listCreatorMonthlySummarys(
      { creator_id: creator.id, year, month }, {}
    )
    if (existing.length > 0) {
      await service.updateCreatorMonthlySummarys({
        id: existing[0].id,
        total_clicks: (existing[0].total_clicks || 0) + 1
      })
    } else {
      await service.createCreatorMonthlySummarys({
        creator_id: creator.id, year, month, total_clicks: 1
      })
    }
  } catch (e) {
    console.error("Click tracking error:", e)
  }
  
  // Redirect to storefront with code pre-applied
  return res.redirect(`${storeFrontUrl}?promo=${code.toUpperCase()}`)
}
