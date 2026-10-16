import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getStorefrontSalesChannelIds } from "./storefront-channel"
import { ALL_SKIN_TYPES, concernFacets, ingredientFacets, skinTypeFacets } from "./shop-facets"

// Keeps the Meilisearch "products" index (the storefront search bar) in step with the catalogue.
//
// The @rokmohar plugin is declared under `modules` in medusa-config.ts, so its own subscribers are never
// loaded and nothing updated the index when a product changed; its index settings are not used either
// (the ones below are applied by resyncSearchIndex). The title stays brand-prefixed, as the search bar shows it.
// Only products the storefront can open belong in the index: PUBLISHED and linked to a storefront sales
// channel (otherwise /store/products answers 404 and the search result leads to "Produit introuvable").

const INDEX = "products"

const FIELDS = [
  "id",
  "title",
  "description",
  "thumbnail",
  "handle",
  "status",
  "metadata",
  "collection.title",
  "categories.name",
  "variants.sku",
  "variants.barcode",
  "variants.metadata",
  "variants.prices.amount",
  "variants.prices.currency_code",
  "sales_channels.id",
]

// What a shopper types, matched against what each product sheet already says (2026-10-16: the index used
// to hold only the title and a tagline, so "peau grasse", "acné" or "écran solaire" found almost nothing).
// The facets are the same canonical labels as the shop filters (shop-facets.ts).
const SEARCH_SETTINGS = {
  // order = weight: a word found in the title counts more than one found in the ingredients
  searchableAttributes: [
    "title",
    "brand",
    "function",
    "categories",
    "concerns",
    "skin_types",
    "ingredients",
    "description",
    "concern_tags",
    "texture",
    "barcodes",
  ],
  displayedAttributes: ["id", "title", "brand", "description", "thumbnail", "handle", "price", "in_stock"],
  filterableAttributes: ["in_stock", "brand"],
  sortableAttributes: ["price", "in_stock", "face"],
  // in-stock products first among those matching as many words (a sold-out product named in full still
  // comes first: no other product has all its words)
  // then face care before hair / body care when both match as well ("peau grasse" is also on scalp serums)
  rankingRules: ["words", "typo", "in_stock:desc", "proximity", "attribute", "face:desc", "sort", "exactness"],
  // "peau" is in every skin type label ("Peau grasse"...): as a search word it matched the whole catalogue
  stopWords: ["peau", "peaux", "skin", "de", "du", "des", "la", "le", "les", "pour", "et", "au", "aux", "en", "un", "une", "avec", "sur", "the", "for", "and", "of", "with"],
  typoTolerance: { disableOnAttributes: ["barcodes"] },
} as const

// French / English / K-beauty words for the same thing (each word of a group finds the others)
const SYNONYM_GROUPS: string[][] = [
  ["shampoing", "shampooing", "shampoo"],
  ["crème", "cream"],
  ["sérum", "serum", "ampoule"],
  ["écran solaire", "crème solaire", "protection solaire", "solaire", "spf", "sunscreen", "sun cream", "sun"],
  ["nettoyant", "cleanser", "cleansing", "mousse nettoyante", "gel nettoyant", "foam"],
  ["démaquillant", "huile démaquillante", "baume démaquillant", "cleansing oil", "cleansing balm"],
  ["tonique", "lotion tonique", "toner"],
  ["hydratant", "hydratante", "moisturizer", "moisturiser", "moisturizing"],
  ["acné", "acnéique", "imperfections", "boutons", "blemish", "acne-prone"],
  ["taches", "tache", "anti-taches", "hyperpigmentation", "pigmentation", "dark spot"],
  ["contour des yeux", "contour yeux", "eye cream", "crème yeux", "eye"],
  ["masque", "mask", "sheet mask", "masque tissu"],
  ["exfoliant", "peeling", "gommage", "scrub", "exfoliating"],
  ["lèvres", "lip", "baume à lèvres", "lip balm"],
  ["gel douche", "body wash", "shower gel"],
  ["lait corps", "lotion corps", "body lotion", "crème corps"],
  ["vitamine c", "vitamin c"],
  ["rétinol", "retinol", "retinal"],
  ["cica", "centella"],
  ["niacinamide", "vitamine b3"],
  ["acide hyaluronique", "hyaluronique", "hyaluronic"],
  ["escargot", "snail", "mucine"],
  ["anti-âge", "anti age", "antiâge", "anti-rides", "rides", "wrinkle"],
  ["éclat", "glow", "brightening", "éclaircissant", "teint terne"],
  ["pores", "sébum", "sebum"],
  ["peau grasse", "oily skin"],
  ["peau sèche", "dry skin"],
  ["peau sensible", "sensitive skin"],
  ["cheveux", "hair", "capillaire"],
  ["cuir chevelu", "scalp"],
  ["pellicules", "dandruff", "antipelliculaire"],
  ["parfum", "fragrance", "perfume"],
  ["huile", "oil"],
  // brands written several ways
  ["beauty of joseon", "boj", "joseon"],
  ["skin1004", "skin 1004"],
  ["some by mi", "somebymi"],
  ["round lab", "roundlab"],
  ["pyunkang yul", "pynkang yul"],
  ["k-secret", "k secret", "seoul 1988"],
  ["mary & may", "mary and may", "mary may"],
]

function synonymsMap() {
  const map: Record<string, string[]> = {}
  for (const group of SYNONYM_GROUPS) {
    for (const word of group) map[word] = [...new Set([...(map[word] || []), ...group.filter((w) => w !== word)])]
  }
  return map
}

// routine_function codes of the product sheets, as a shopper says them
const FUNCTION_LABELS: Record<string, string> = {
  nettoyant: "Nettoyant visage",
  demaquillant: "Démaquillant",
  tonique: "Tonique (toner)",
  essence: "Essence",
  serum: "Sérum",
  hydratant: "Crème hydratante",
  solaire: "Protection solaire",
  masque: "Masque",
  exfoliant: "Exfoliant",
  contour_yeux: "Contour des yeux",
  levres: "Soin des lèvres",
  traitement: "Traitement ciblé",
  corps: "Soin du corps",
  accessoire: "Accessoire",
}

const SKIN_TYPE_WORDS: Record<string, string> = {
  [ALL_SKIN_TYPES]: "Tous types de peau",
  "À tendance acnéique": "Peau à tendance acnéique",
}

function meili(path: string, init: RequestInit = {}) {
  const host = process.env.MEILISEARCH_HOST || "http://localhost:7700"
  const key = process.env.MEILISEARCH_API_KEY || "meilisearch_super_secret"
  return fetch(`${host}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, ...(init.headers || {}) },
  })
}

const list = (v: unknown): string[] => (Array.isArray(v) ? v : v ? [v] : []).map(String).filter(Boolean)

// 1 when a shop has it (stock_b1 / stock_b2 written by the Odoo sync and the admin), 0 when both shops
// are out; a product whose stock was never recorded counts as available rather than being pushed down.
function inStock(variants: any[]): 0 | 1 {
  let known = false
  let total = 0
  for (const v of variants || []) {
    const m = v?.metadata || {}
    for (const key of ["stock_b1", "stock_b2"]) {
      if (m[key] == null) continue
      known = true
      total += Math.max(0, Number(m[key]) || 0)
    }
  }
  return !known || total > 0 ? 1 : 0
}

const HAIR = /cheveu|capillaire|shamp|cuir chevelu|scalp|\bhair\b|apr[èe]s-shampoing|conditioner/i
const BODY = /\bcorps\b|corporel|\bbody\b|gel douche|shower|\bmains?\b|\bhand\b|\bpieds?\b|\bfoot\b|vergeture/i

// 1 for face care, 0 for hair, body care and accessories (only breaks ties between equally relevant products)
function isFace(p: any, fn: string): 0 | 1 {
  if (fn === "corps" || fn === "accessoire") return 0
  const text = [p.title, ...(p.categories || []).map((c: any) => c?.name)].join(" ")
  return HAIR.test(text) || BODY.test(text) ? 0 : 1
}

export function toSearchDocument(p: any) {
  const brand = p.collection?.title || ""
  const m = p.metadata || {}
  const variant = p.variants?.[0]
  const prices: any[] = variant?.prices || []
  const price = prices.find((x) => x.currency_code === "xaf") ?? prices[0]
  const concernTags = list(m.skin_concerns)
  return {
    id: p.id,
    title: brand ? `${brand} - ${p.title}` : p.title,
    brand,
    description: m.search_tagline || p.description || "",
    function: FUNCTION_LABELS[String(m.routine_function || "")] || "",
    categories: (p.categories || []).map((c: any) => c?.name).filter(Boolean),
    concerns: concernFacets(concernTags),
    concern_tags: concernTags,
    skin_types: skinTypeFacets(m.skin_types).map((t) => SKIN_TYPE_WORDS[t] || `Peau ${t.toLowerCase()}`),
    ingredients: ingredientFacets(m.raw_inci),
    texture: typeof m.texture === "string" ? m.texture : "",
    barcodes: [...new Set((p.variants || []).map((v: any) => v?.barcode).filter(Boolean).map(String))],
    in_stock: inStock(p.variants),
    face: isFace(p, String(m.routine_function || "")),
    thumbnail: p.thumbnail,
    handle: p.handle,
    price: Number(price?.amount) || 0,
  }
}

export const searchSettings = () => ({ ...SEARCH_SETTINGS, synonyms: synonymsMap() })

/** Applies the search settings (searchable fields, synonyms, ranking). Kept here, not in the plugin options. */
export async function applySearchSettings() {
  const res = await meili(`/indexes/${INDEX}/settings`, { method: "PATCH", body: JSON.stringify(searchSettings()) })
  await expectOk(res, "settings")
}

function isVisibleInStore(p: any, channelIds: Set<string>) {
  return p.status === "published" && (p.sales_channels || []).some((sc: any) => sc && channelIds.has(sc.id))
}

async function expectOk(res: Response, what: string) {
  if (!res.ok) throw new Error(`Meilisearch ${what} failed (${res.status}): ${(await res.text().catch(() => "")).slice(0, 200)}`)
}

export async function removeProductFromSearch(id: string) {
  // 404 just means "was not indexed", which is fine
  const res = await meili(`/indexes/${INDEX}/documents/${encodeURIComponent(id)}`, { method: "DELETE" })
  if (!res.ok && res.status !== 404) await expectOk(res, "delete")
}

/** Indexes the product if the storefront can open it, removes it from the index otherwise. */
export async function syncProductToSearch(container: MedusaContainer, id: string) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "product", fields: FIELDS, filters: { id } })
  const product: any = data[0]
  const channelIds = new Set(await getStorefrontSalesChannelIds(container))

  if (!product || !isVisibleInStore(product, channelIds)) {
    await removeProductFromSearch(id)
    return "removed" as const
  }
  await expectOk(
    await meili(`/indexes/${INDEX}/documents`, { method: "POST", body: JSON.stringify([toSearchDocument(product)]) }),
    "upsert"
  )
  return "indexed" as const
}

/** Full resync: index every product the storefront can open, remove every indexed document that is not one. */
export async function resyncSearchIndex(container: MedusaContainer) {
  await applySearchSettings()
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: FIELDS,
    filters: { status: "published" },
    pagination: { take: 10000 },
  })
  const channelIds = new Set(await getStorefrontSalesChannelIds(container))
  const docs = (data as any[]).filter((p) => isVisibleInStore(p, channelIds)).map(toSearchDocument)
  const published = new Set(docs.map((d) => d.id))

  // ids currently in the index
  const indexed: string[] = []
  for (let offset = 0; ; offset += 1000) {
    const res = await meili(`/indexes/${INDEX}/documents?limit=1000&offset=${offset}&fields=id`)
    if (res.status === 404) break // index does not exist yet
    await expectOk(res, "list")
    const body: any = await res.json()
    indexed.push(...body.results.map((r: any) => r.id))
    if (body.results.length < 1000) break
  }
  const stale = indexed.filter((id) => !published.has(id))

  if (docs.length) {
    await expectOk(await meili(`/indexes/${INDEX}/documents`, { method: "POST", body: JSON.stringify(docs) }), "upsert")
  }
  if (stale.length) {
    await expectOk(
      await meili(`/indexes/${INDEX}/documents/delete-batch`, { method: "POST", body: JSON.stringify(stale) }),
      "delete-batch"
    )
  }
  return { indexed: docs.length, removed: stale.length, removed_ids: stale }
}
