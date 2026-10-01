import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createPromotionsWorkflow, updatePromotionsWorkflow } from "@medusajs/medusa/core-flows"
import { CREATOR_PARTNER_MODULE } from "../../../modules/creator_partner"

// Native JS types — GET always returns values in this same shape, whether
// they come from the DB (parsed) or fall back to these defaults, so the
// admin UI never has to guess whether a field is a stringified JSON blob.
const DEFAULT_CONFIG = {
  new_customer_discount_pct: 5,
  returning_customer_discount_pct: 2,
  commission_tiers: [
    { min: 0, max: 599999, rate: 3 },
    { min: 600000, max: 999999, rate: 4 },
    { min: 1000000, max: null, rate: 6 }
  ],
  payment_fee_rates: { default: 2.5, pawapay: 2.5, card: 2.5 },
  launch_promo_active: false,
  launch_promo_discount_pct: 10,
  launch_promo_ends_at: null as string | null,
  creator_of_month_bonus_pct: 2,
  creator_of_month_free_shipping: true,
  creator_of_month_duration_hours: 72,
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(CREATOR_PARTNER_MODULE) as any
  const configs = await service.listProgramConfigs({}, {})
  
  const configMap: Record<string, any> = {}
  for (const c of configs) {
    try {
      configMap[c.key] = JSON.parse(c.value)
    } catch {
      configMap[c.key] = c.value
    }
  }
  
  // Merge with defaults for missing keys
  const result = { ...DEFAULT_CONFIG, ...configMap }
  
  res.json({ config: result, raw: configs })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(CREATOR_PARTNER_MODULE) as any
  const updates = req.body as Record<string, any>
  
  const results = []
  for (const [key, value] of Object.entries(updates)) {
    const strValue = typeof value === 'string' ? value : JSON.stringify(value)

    // Upsert: check if exists
    const existing = await service.listProgramConfigs({ key }, {})
    if (existing.length > 0) {
      const updated = await service.updateProgramConfigs({ id: existing[0].id, value: strValue })
      results.push(updated)
    } else {
      const created = await service.createProgramConfigs({ key, value: strValue })
      results.push(created)
    }
  }

  // Keep the hidden launch-promo Promotion's discount value in sync with config.
  // The active/ends_at gating itself is read live by /store/creator/apply-code,
  // not enforced on the Promotion object (Medusa promotions have no end date).
  if ('launch_promo_discount_pct' in updates) {
    try { await syncLaunchPromotion(req.scope, service) } catch (e) { console.error("Launch promo sync error:", e) }
  }

  res.json({ success: true, updated: results })
}

async function syncLaunchPromotion(scope: any, service: any) {
  const configs = await service.listProgramConfigs({}, {})
  const configMap: Record<string, string> = {}
  for (const c of configs) { configMap[c.key] = c.value }

  let discountPct = 10
  try { if (configMap.launch_promo_discount_pct) discountPct = Number(JSON.parse(configMap.launch_promo_discount_pct)) } catch {}

  let existingCode = ''
  try { if (configMap.launch_promo_code) existingCode = JSON.parse(configMap.launch_promo_code) } catch {}

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  if (existingCode) {
    const { data: existingPromos } = await query.graph({
      entity: "promotion", fields: ["id", "code"], filters: { code: existingCode }
    })
    if (existingPromos.length > 0) {
      await updatePromotionsWorkflow(scope).run({
        input: { promotionsData: [{ id: existingPromos[0].id, application_method: { value: discountPct } }] }
      })
      return
    }
  }

  // No promotion yet for the launch offer — provision one, code never shown to clients
  const newCode = `LANCEMENT${Date.now().toString(36).toUpperCase()}`
  await createPromotionsWorkflow(scope).run({
    input: {
      promotionsData: [{
        code: newCode,
        type: "standard",
        status: "active",
        is_automatic: false,
        application_method: { type: "percentage", target_type: "order", value: discountPct },
        // @ts-ignore
        metadata: { is_launch_promo: true }
      } as any]
    }
  })
  await service.createProgramConfigs({ key: "launch_promo_code", value: JSON.stringify(newCode) })
}
