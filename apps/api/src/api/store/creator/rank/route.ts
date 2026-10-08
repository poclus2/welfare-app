import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CREATOR_PARTNER_MODULE } from "../../../../modules/creator_partner"
import { resolveCreatorForCustomer } from "../../../../lib/creator-account"

// The logged-in creator's rank this month (customer auth required, see middlewares.ts)
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(CREATOR_PARTNER_MODULE) as any
  const creator = await resolveCreatorForCustomer(
    req.scope,
    req.auth_context?.actor_id,
    req.auth_context?.auth_identity_id
  )
  if (!creator) return res.status(404).json({ error: "Creator not found" })

  const now = new Date()
  const summaries = await service.listCreatorMonthlySummaries(
    { creator_id: creator.id, year: now.getFullYear(), month: now.getMonth() + 1 },
    {}
  )
  
  // Total active creators this month
  const allSummaries = await service.listCreatorMonthlySummaries(
    { year: now.getFullYear(), month: now.getMonth() + 1 },
    {}
  )
  
  res.json({
    rank: summaries[0]?.rank || null,
    total_creators: allSummaries.length,
  })
}
