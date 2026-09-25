import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CREATOR_PARTNER_MODULE } from "../../../modules/creator_partner"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(CREATOR_PARTNER_MODULE) as any
  const now = new Date()
  const year = parseInt((req.query.year as string) || String(now.getFullYear()))
  const month = parseInt((req.query.month as string) || String(now.getMonth() + 1))
  
  const summaries = await service.listCreatorMonthlySummarys(
    { year, month },
    { order: { total_eligible_revenue: "DESC" } }
  )
  
  // Add rank
  const ranked = summaries.map((s: any, i: number) => ({ ...s, rank: i + 1 }))
  
  // Fetch creator names
  const creatorIds = ranked.map((s: any) => s.creator_id)
  let creators: any[] = []
  if (creatorIds.length > 0) {
    creators = await service.listCreatorPartners({ id: creatorIds }, {})
  }
  
  const creatorsMap = Object.fromEntries(creators.map((c: any) => [c.id, c]))
  
  const result = ranked.map((s: any) => ({
    ...s,
    creator: creatorsMap[s.creator_id] ? {
      id: creatorsMap[s.creator_id].id,
      first_name: creatorsMap[s.creator_id].first_name,
      last_name: creatorsMap[s.creator_id].last_name,
      code: creatorsMap[s.creator_id].code,
      is_creator_of_month: creatorsMap[s.creator_id].is_creator_of_month,
    } : null
  }))
  
  res.json({ leaderboard: result, year, month })
}
