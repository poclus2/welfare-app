import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  deleteCampaignsWorkflow,
  deletePromotionsWorkflow,
  updatePromotionsWorkflow,
} from "@medusajs/medusa/core-flows"

// Only ever touch generic promo codes — creator and launch promotions are managed elsewhere
async function findGenericPromotion(req: MedusaRequest, id: string) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "promotion",
    fields: ["id", "code", "campaign_id", "metadata"],
    filters: { id },
  })
  const promotion: any = data[0]
  return promotion?.metadata?.is_generic_promo ? promotion : null
}

// POST /admin/promo-codes/:id — activate / deactivate
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const { status } = (req.body ?? {}) as { status?: string }

  if (status !== "active" && status !== "inactive") {
    return res.status(400).json({ message: "Statut invalide (active ou inactive)." })
  }

  const promotion = await findGenericPromotion(req, id)
  if (!promotion) {
    return res.status(404).json({ message: "Code promo introuvable." })
  }

  await updatePromotionsWorkflow(req.scope).run({
    input: { promotionsData: [{ id, status }] },
  })
  res.json({ id, status })
}

// DELETE /admin/promo-codes/:id
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  const promotion = await findGenericPromotion(req, id)
  if (!promotion) {
    return res.status(404).json({ message: "Code promo introuvable." })
  }

  await deletePromotionsWorkflow(req.scope).run({ input: { ids: [id] } })
  if (promotion.campaign_id) {
    await deleteCampaignsWorkflow(req.scope).run({ input: { ids: [promotion.campaign_id] } })
  }
  res.json({ id, deleted: true })
}
