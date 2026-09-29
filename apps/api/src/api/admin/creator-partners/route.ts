import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CREATOR_PARTNER_MODULE } from "../../../modules/creator_partner"
import { createPromotionsWorkflow } from "@medusajs/medusa/core-flows"

// GET /admin/creator-partners - list all creators
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(CREATOR_PARTNER_MODULE) as any
  const creators = await service.listCreatorPartners({}, {
    order: { created_at: "DESC" }
  })
  res.json({ creator_partners: creators })
}

// POST /admin/creator-partners - manually create a promo code + creator partner
// (mirrors the auto-creation done on ambassador-application approval, but with
// admin-provided values instead of the hardcoded 5%/10% defaults)
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as any
  const { code, discount, rate, customer_id, first_name, last_name, email, phone } = body

  if (!code || typeof code !== "string" || !code.trim()) {
    return res.status(400).json({ error: "Le code promo est requis." })
  }
  if (!first_name || !last_name || !email) {
    return res.status(400).json({ error: "Prénom, nom et email sont requis pour créer une ambassadrice." })
  }

  const normalizedCode = code.trim().toUpperCase()
  const discountValue = Number(discount)
  const rateValue = Number(rate)
  if (!Number.isFinite(discountValue) || discountValue <= 0 || discountValue > 100) {
    return res.status(400).json({ error: "La réduction client doit être un pourcentage entre 1 et 100." })
  }
  if (!Number.isFinite(rateValue) || rateValue < 0 || rateValue > 100) {
    return res.status(400).json({ error: "La commission ambassadrice doit être un pourcentage entre 0 et 100." })
  }

  const cpService = req.scope.resolve(CREATOR_PARTNER_MODULE) as any

  const existing = await cpService.listCreatorPartners({ code: normalizedCode })
  if (existing?.length > 0) {
    return res.status(409).json({ error: `Le code "${normalizedCode}" est déjà utilisé.` })
  }

  try {
    await createPromotionsWorkflow(req.scope).run({
      input: {
        promotionsData: [{
          code: normalizedCode,
          type: "standard",
          is_automatic: false,
          application_method: {
            type: "percentage",
            target_type: "order",
            value: discountValue,
          },
          // @ts-ignore
          metadata: {
            is_influencer: true,
            is_creator_partner: true,
            influencer_id: customer_id || null,
            commission_rate: rateValue,
          },
        } as any],
      },
    })
  } catch (err: any) {
    return res.status(400).json({
      error: err?.message?.includes("already exists")
        ? `Le code "${normalizedCode}" existe déjà dans les promotions Medusa.`
        : "Impossible de créer le code promo. Veuillez réessayer.",
    })
  }

  const storeUrl = process.env.STORE_URL || process.env.NEXT_PUBLIC_STORE_URL || "https://thewelfarecm.com"
  const creator = await cpService.createCreatorPartners({
    customer_id: customer_id || null,
    first_name,
    last_name,
    email,
    phone: phone || null,
    code: normalizedCode,
    referral_link: `${storeUrl}/r/${normalizedCode}`,
  })

  res.status(201).json({ creator_partner: creator })
}
