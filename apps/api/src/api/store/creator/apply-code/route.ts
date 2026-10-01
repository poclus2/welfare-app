import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules, PromotionActions } from "@medusajs/framework/utils"
import { updateCartPromotionsWorkflow } from "@medusajs/medusa/core-flows"
import { CREATOR_PARTNER_MODULE } from "../../../../modules/creator_partner"

// Resolves a single visible creator code into whichever real Medusa promo
// code should actually apply to the cart (the creator's new/returning rate,
// bumped by a creator-of-month bonus, or the hidden launch-promo code if
// it currently gives a bigger discount) — never both at once. The creator
// still gets commission credit either way, via cart.metadata.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { cart_id, code } = (req.body || {}) as { cart_id?: string; code?: string }
  if (!cart_id || !code) {
    res.status(400).json({ message: "cart_id et code sont requis" })
    return
  }

  const cpService = req.scope.resolve(CREATOR_PARTNER_MODULE) as any
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const creators = await cpService.listCreatorPartners({ code: code.trim().toUpperCase() }, {})
  if (!creators.length) {
    res.status(404).json({ message: "Code invalide" })
    return
  }
  const creator = creators[0]
  if (creator.status === "suspended") {
    res.status(400).json({ message: "Ce code n'est plus actif" })
    return
  }

  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "customer_id", "email"],
    filters: { id: cart_id },
  })
  if (!carts.length) {
    res.status(404).json({ message: "Panier introuvable" })
    return
  }
  const cart = carts[0]

  // New vs returning customer — same signal as the commission subscriber
  let isNewCustomer = true
  if (cart.customer_id) {
    const { data: customerOrders } = await query.graph({
      entity: "order",
      fields: ["id"],
      filters: { customer_id: cart.customer_id },
    })
    isNewCustomer = customerOrders.length === 0
  }

  const configs = await cpService.listProgramConfigs({}, {})
  const configMap: Record<string, string> = {}
  for (const c of configs) { configMap[c.key] = c.value }
  const readConfig = (key: string, fallback: any) => {
    try { return configMap[key] !== undefined ? JSON.parse(configMap[key]) : fallback } catch { return fallback }
  }

  const newRate = Number(readConfig("new_customer_discount_pct", 5))
  const returningRate = Number(readConfig("returning_customer_discount_pct", 2))

  let creatorRate = isNewCustomer ? newRate : returningRate
  const creatorOfMonthActive = creator.is_creator_of_month &&
    creator.creator_of_month_until &&
    new Date(creator.creator_of_month_until) > new Date()
  if (creatorOfMonthActive) {
    creatorRate += Number(creator.creator_of_month_bonus_pct || 0)
  }
  const creatorCode = isNewCustomer ? creator.code : (creator.code_returning || creator.code)

  // Launch promo — only considered if still active and not expired
  const launchActive = Boolean(readConfig("launch_promo_active", false))
  const launchEndsAt = readConfig("launch_promo_ends_at", null)
  const launchPct = Number(readConfig("launch_promo_discount_pct", 0))
  const launchCode = String(readConfig("launch_promo_code", "") || "")
  const launchValid = launchActive && !!launchCode && (!launchEndsAt || new Date(launchEndsAt) > new Date())

  let appliedCode = creatorCode
  let appliedRate = creatorRate
  if (launchValid && launchPct > creatorRate) {
    appliedCode = launchCode
    appliedRate = launchPct
  }

  await updateCartPromotionsWorkflow(req.scope).run({
    input: {
      cart_id,
      promo_codes: [appliedCode],
      action: PromotionActions.REPLACE,
    },
  })

  const cartModuleService = req.scope.resolve(Modules.CART) as any
  await cartModuleService.updateCarts(cart_id, {
    metadata: {
      creator_partner_id: creator.id,
      creator_code: creator.code,
      creator_free_shipping: creatorOfMonthActive && !!creator.creator_of_month_free_shipping,
    },
  })

  res.json({
    applied_rate: appliedRate,
    is_new_customer: isNewCustomer,
    creator_name: `${creator.first_name} ${creator.last_name}`.trim(),
    free_shipping: creatorOfMonthActive && !!creator.creator_of_month_free_shipping,
  })
}
