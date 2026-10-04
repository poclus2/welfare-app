import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createPromotionsWorkflow } from "@medusajs/medusa/core-flows"
import { CREATOR_PARTNER_MODULE } from "../../../modules/creator_partner"

type DiscountKind = "percentage" | "fixed" | "free_shipping"

const CODE_RE = /^[A-Z0-9_-]{3,32}$/

function toDate(value: unknown): Date | null {
  if (!value) return null
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? null : d
}

// GET /admin/promo-codes — generic (non-creator) promotion codes only
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "promotion",
    fields: [
      "id", "code", "status", "limit", "used", "metadata", "created_at",
      "application_method.type", "application_method.value", "application_method.currency_code",
      "campaign.starts_at", "campaign.ends_at",
    ],
  })

  const promo_codes = (data as any[])
    .filter((p) => p.metadata?.is_generic_promo)
    .map((p) => ({
      id: p.id,
      code: p.code,
      status: p.status,
      discount_kind: p.metadata?.discount_kind as DiscountKind,
      value: Number(p.application_method?.value ?? 0),
      currency_code: p.application_method?.currency_code ?? null,
      product_ids: p.metadata?.scope_product_ids ?? [],
      collection_ids: p.metadata?.scope_collection_ids ?? [],
      min_cart_amount: Number(p.metadata?.min_cart_amount ?? 0),
      per_customer_once: Boolean(p.metadata?.per_customer_once),
      starts_at: p.campaign?.starts_at ?? null,
      ends_at: p.campaign?.ends_at ?? null,
      limit: p.limit ?? null,
      used: p.used ?? 0,
      created_at: p.created_at,
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  res.json({ promo_codes })
}

// POST /admin/promo-codes — create a promotion code dedicated to a specific offer
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as any

  const code = String(body.code ?? "").trim().toUpperCase()
  if (!CODE_RE.test(code)) {
    return res.status(400).json({ message: "Le code doit faire 3 à 32 caractères (lettres, chiffres, - ou _)." })
  }

  const kind = body.discount_kind as DiscountKind
  if (!["percentage", "fixed", "free_shipping"].includes(kind)) {
    return res.status(400).json({ message: "Type de remise invalide." })
  }

  const value = Number(body.value)
  if (kind === "percentage" && !(value >= 1 && value <= 100)) {
    return res.status(400).json({ message: "Le pourcentage doit être entre 1 et 100." })
  }
  if (kind === "fixed" && !(Number.isInteger(value) && value > 0)) {
    return res.status(400).json({ message: "Le montant fixe doit être un entier positif." })
  }

  const productIds: string[] = Array.isArray(body.product_ids) ? body.product_ids.filter(Boolean) : []
  const collectionIds: string[] = Array.isArray(body.collection_ids) ? body.collection_ids.filter(Boolean) : []
  if (kind === "free_shipping" && (productIds.length || collectionIds.length)) {
    return res.status(400).json({ message: "Une livraison offerte ne peut pas être limitée à des produits ou des marques." })
  }

  const startsAt = toDate(body.starts_at)
  const endsAt = toDate(body.ends_at)
  if (endsAt && endsAt.getTime() <= Date.now()) {
    return res.status(400).json({ message: "La date de fin est déjà passée." })
  }
  if (startsAt && endsAt && endsAt <= startsAt) {
    return res.status(400).json({ message: "La date de fin doit être après la date de début." })
  }

  const usageLimit = body.usage_limit === undefined || body.usage_limit === null || body.usage_limit === ""
    ? null
    : Number(body.usage_limit)
  if (usageLimit !== null && !(Number.isInteger(usageLimit) && usageLimit >= 1)) {
    return res.status(400).json({ message: "Le nombre d'utilisations doit être un entier supérieur ou égal à 1." })
  }

  const minCartAmount = Number(body.min_cart_amount || 0)
  if (!(minCartAmount >= 0)) {
    return res.status(400).json({ message: "Le panier minimum est invalide." })
  }
  const perCustomerOnce = Boolean(body.per_customer_once)

  // The code must be unique across generic promos, creator codes (visible + hidden) and the launch promo
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: existing } = await query.graph({ entity: "promotion", fields: ["id", "code"], filters: { code } })
  const cpService = req.scope.resolve(CREATOR_PARTNER_MODULE) as any
  const creators = await cpService.listCreatorPartners({}, {})
  const takenByCreator = creators.some(
    (c: any) => c.code?.toUpperCase() === code || c.code_returning?.toUpperCase() === code
  )
  if (existing.length > 0 || takenByCreator) {
    return res.status(409).json({ message: `Le code "${code}" est déjà utilisé.` })
  }

  // Fixed amounts need the store currency — read it from the region instead of hardcoding it
  let currencyCode: string | undefined
  if (kind === "fixed") {
    const regionService = req.scope.resolve(Modules.REGION) as any
    const regions = await regionService.listRegions({}, { take: 1 })
    currencyCode = body.currency_code || regions[0]?.currency_code
    if (!currencyCode) {
      return res.status(400).json({ message: "Aucune région/devise configurée pour un montant fixe." })
    }
  }

  const targetRules: any[] = []
  if (productIds.length) {
    targetRules.push({ attribute: "items.product.id", operator: "in", values: productIds })
  }
  if (collectionIds.length) {
    targetRules.push({ attribute: "items.product.collection_id", operator: "in", values: collectionIds })
  }
  const restricted = targetRules.length > 0

  let applicationMethod: any
  if (kind === "free_shipping") {
    // Medusa requires max_quantity whenever allocation is "each"
    applicationMethod = { type: "percentage", target_type: "shipping_methods", allocation: "each", max_quantity: 1, value: 100 }
  } else if (restricted) {
    applicationMethod = {
      type: kind,
      target_type: "items",
      allocation: kind === "fixed" ? "across" : "each",
      ...(kind === "fixed" ? {} : { max_quantity: 999 }),
      value,
      ...(currencyCode ? { currency_code: currencyCode } : {}),
      target_rules: targetRules,
    }
  } else if (kind === "fixed") {
    applicationMethod = { type: "fixed", target_type: "order", allocation: "across", value, currency_code: currencyCode }
  } else {
    applicationMethod = { type: "percentage", target_type: "order", value }
  }

  const needsCampaign = Boolean(startsAt || endsAt || perCustomerOnce)
  const campaign = needsCampaign
    ? {
        name: `Code promo ${code}`,
        campaign_identifier: `promo-${code.toLowerCase()}`,
        starts_at: startsAt,
        ends_at: endsAt,
        ...(perCustomerOnce
          ? { budget: { type: "use_by_attribute", attribute: "customer_id", limit: 1 } }
          : {}),
      }
    : undefined

  try {
    const { result } = await createPromotionsWorkflow(req.scope).run({
      input: {
        promotionsData: [{
          code,
          type: "standard",
          status: "active",
          is_automatic: false,
          ...(usageLimit !== null ? { limit: usageLimit } : {}),
          application_method: applicationMethod,
          ...(campaign ? { campaign } : {}),
          // @ts-ignore metadata is persisted by the promotion module but missing from the DTO type
          metadata: {
            is_generic_promo: true,
            discount_kind: kind,
            min_cart_amount: minCartAmount,
            per_customer_once: perCustomerOnce,
            scope_product_ids: productIds,
            scope_collection_ids: collectionIds,
          },
        } as any],
      },
    })
    res.status(201).json({ promotion: (result as any[])[0] })
  } catch (err: any) {
    console.error("[promo-codes] create failed:", err?.message)
    res.status(400).json({ message: err?.message || "Impossible de créer ce code promo." })
  }
}
