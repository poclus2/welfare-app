import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updatePromotionsWorkflow } from "@medusajs/medusa/core-flows"

// One-off fix: every creator Promotion was created without an explicit `status`,
// so Medusa defaulted it to "draft" — a draft promotion can never actually be
// applied to a cart. This silently meant no creator code ever produced a real
// discount, from Phase 1 until the create-time fix landed. New promotions are
// now created as "active" directly; this script repairs any that were already
// created in `draft` before that fix shipped. Safe to re-run — a no-op once
// everything is already active.
//
// Run after deploying: npx medusa exec ./src/scripts/activate-draft-creator-promotions.ts
export default async function activateDraftCreatorPromotions({
  container,
}: {
  container: MedusaContainer
}) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: promotions } = await query.graph({
    entity: "promotion",
    fields: ["id", "code", "status", "metadata"],
    filters: { status: "draft" },
  })

  const creatorPromotions = promotions.filter(
    (p: any) => p.metadata?.is_creator_partner === true || p.metadata?.is_launch_promo === true
  )

  if (!creatorPromotions.length) {
    console.log("[activate-draft-creator-promotions] No draft creator/launch promotions found. Nothing to do.")
    return
  }

  await updatePromotionsWorkflow(container).run({
    input: {
      promotionsData: creatorPromotions.map((p: any) => ({ id: p.id, status: "active" })),
    },
  })

  console.log(
    `[activate-draft-creator-promotions] Activated ${creatorPromotions.length} promotion(s): ` +
      creatorPromotions.map((p: any) => p.code).join(", ")
  )
}
