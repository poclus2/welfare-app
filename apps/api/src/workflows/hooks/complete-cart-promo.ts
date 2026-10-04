import { completeCartWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

// Medusa's promotion engine has no "minimum cart amount" rule, so generic promo codes keep it in
// metadata.min_cart_amount. apply-code checks it when the code is typed; this re-checks at checkout
// in case items were removed afterwards.
completeCartWorkflow.hooks.validate(async ({ input }, { container }) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "item_subtotal", "promotions.code"],
    filters: { id: input.id },
  })
  const cart: any = carts[0]
  const codes: string[] = (cart?.promotions || []).map((p: any) => p.code).filter(Boolean)
  if (!codes.length) return

  const { data: promos } = await query.graph({
    entity: "promotion",
    fields: ["code", "metadata"],
    filters: { code: codes },
  })

  for (const promo of promos as any[]) {
    const minCart = Number(promo.metadata?.min_cart_amount || 0)
    if (promo.metadata?.is_generic_promo && minCart > 0 && Number(cart.item_subtotal || 0) < minCart) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Le code ${promo.code} est valable à partir de ${new Intl.NumberFormat("fr-FR").format(minCart)} FCFA d'achats. Retirez le code ou complétez votre panier.`
      )
    }
  }
})
