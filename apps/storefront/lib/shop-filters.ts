// Shared by the category page (server, to narrow the list) and CategoryClient (browser).

export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export type FilterableProduct = {
  title: string;
  category?: string;
  categories?: string[];
  brand?: string;
  active_ingredients?: { name: string }[];
};

export const CATEGORY_LABELS: Record<string, string> = {
  all: "Tous les produits",
  nettoyants: "Nettoyants",
  toners: "Toners",
  "toners-essences": "Toners et essences",
  serums: "Sérums et ampoules",
  hydratants: "Hydratants",
  "soins-contour-des-yeux": "Contours des yeux",
  cremes: "Crèmes",
  solaires: "Protections solaires",
  masques: "Masques",
  essences: "Essences",
  traitements: "Traitements",
  coffrets: "Coffrets",
  exfoliants: "Exfoliants",
  cheveux: "Cheveux",
  "face-care": "Soins du Visage",
  "body-care": "Soins du Corps",
  "soins-corps": "Soins du corps",
  "hair-care": "Soins des Cheveux",
  "supplements": "Compléments",
  "masques-visage": "Masques visage",
  "soins-levres": "Soins des lèvres",
  "foot-care": "Foot Care",
};

export function matchesQuery(p: FilterableProduct, query: string): boolean {
  const qNorm = normalize(query);
  const titleMatch = normalize(p.title).includes(qNorm);
  const brandMatch = p.brand ? normalize(p.brand).includes(qNorm) : false;
  const ingredientMatch = p.active_ingredients?.some((i) => normalize(i.name).includes(qNorm));
  const catNorm = normalize(p.category || "");
  const catMatch = catNorm.includes(qNorm) || (p.categories && p.categories.some((c) => normalize(c).includes(qNorm)));
  return !!(titleMatch || brandMatch || ingredientMatch || catMatch);
}

export function matchesCategory(category: string, p: FilterableProduct): boolean {
  if (category === "all") return true;
  const catSlugNorm = normalize(category).replace(/-/g, " ");
  const catLabel = CATEGORY_LABELS[category] || "";
  const catLabelNorm = normalize(catLabel).replace(/-/g, " ");

  const pCatNorm = normalize(p.category || "").replace(/-/g, " ");
  let matches =
    (catSlugNorm && pCatNorm.includes(catSlugNorm)) ||
    (catLabelNorm && pCatNorm.includes(catLabelNorm)) ||
    (pCatNorm && catSlugNorm.includes(pCatNorm)) ||
    (p.categories &&
      p.categories.some((c) => {
        const cNorm = normalize(c).replace(/-/g, " ");
        return (catSlugNorm && cNorm.includes(catSlugNorm)) || (catLabelNorm && cNorm.includes(catLabelNorm)) || (cNorm && catSlugNorm.includes(cNorm));
      }));

  // Special categories like 'cheveux' also match on title / ingredients
  if (!matches && category === "cheveux") {
    const titleNorm = normalize(p.title);
    const descNorm = normalize((p.active_ingredients || []).map((i) => i.name).join(" "));
    matches = titleNorm.includes("cheveux") || titleNorm.includes("hair") || titleNorm.includes("shamp") || titleNorm.includes("scalp") || descNorm.includes("cheveux");
  }
  return !!matches;
}

export type FacetOption = { label: string; count: number };
export type ShopFacets = { skinTypes: FacetOption[]; concerns: FacetOption[]; ingredients: FacetOption[] };

// ─── Which part of the shop a product belongs to ───
// The skin filters are for a FACE routine: a shampoo or a body wash that merely carries a "Sensible" or
// "Hydratation" tag must not come up when someone filters for their face. The Medusa category handles say
// what a product really is (the title only catches hair products filed under face categories such as Sérums).
export type Domain = "face" | "hair" | "body" | "supplement";

const HAIR_HANDLE = /^(hair|scalp|shampoo|leave-in)|^cheveux$/;
const BODY_HANDLE = /^(body|hand-cream|foot)/;
const SUPPLEMENT_HANDLES = new Set([
  "supplements", "skin-health", "beauty-supplement", "antioxidant", "oral-care", "weight-management",
  "food-supplement", "collagen-supplement", "vitamin", "n/a", "omega-3-supplement", "mineral-supplement", "skin-supplement",
]);
const HAIR_TITLE = /shampoo|shampoing|cheveux|hair|scalp|cuir chevelu/i;

export function productDomain(handles: string[], title: string): Domain {
  const h = handles.map((x) => x.toLowerCase());
  if (h.some((x) => HAIR_HANDLE.test(x)) || (h.length > 0 && HAIR_TITLE.test(title) && !h.some((x) => BODY_HANDLE.test(x)))) return "hair";
  if (h.some((x) => SUPPLEMENT_HANDLES.has(x))) return "supplement";
  if (h.some((x) => BODY_HANDLE.test(x)) && !h.some((x) => ["face-care"].includes(x))) return "body";
  return "face";
}

// ─── Skin type / concern matching ───
const ALL_SKIN_TYPES = "Toutes";
const SKIN_TYPE_ORDER = ["Sèche", "Mixte", "Grasse", "Normale", "Sensible", "Mature", "À tendance acnéique"];
const OILY_FAMILY = ["Grasse", "Mixte", "À tendance acnéique"];
const OIL_CONTROL = "Pores & sébum";

type Profiled = { skin_types: string[]; concerns: string[]; ingredients?: string[] };

/**
 * A skin-type selection describes ONE person ("sèche ET sensible"), so a product has to suit every type
 * selected - not any of them (that is what let oily-skin products through for a dry, sensitive profile).
 *  - a product that names its skin types suits exactly those ("Toutes" next to named types is noise);
 *  - a product that only says "all skin types" suits everyone, EXCEPT when it is a sebum / pore control
 *    product and the person did not pick an oily-family type;
 *  - a product with no skin-type data at all is not shown (we cannot claim it suits anyone).
 */
export function matchesSkinTypes(selected: string[], p: Profiled): boolean {
  if (selected.length === 0) return true;
  const named = p.skin_types.filter((t) => t !== ALL_SKIN_TYPES);
  if (named.length > 0) return selected.every((t) => named.includes(t));
  if (!p.skin_types.includes(ALL_SKIN_TYPES)) return false;
  const wantsOily = selected.some((t) => OILY_FAMILY.includes(t));
  return wantsOily || !p.concerns.includes(OIL_CONTROL);
}

/**
 * Concerns: a product must answer at least half of those selected (rounded up: 1 of 1-2, 2 of 3-4, ...).
 * "Any one" made three concerns match 4 products in 10; the products answering the most come first.
 */
export function matchesConcerns(selected: string[], p: Profiled): boolean {
  if (selected.length === 0) return true;
  const needed = Math.ceil(selected.length / 2);
  return selected.filter((c) => p.concerns.includes(c)).length >= needed;
}

export function matchesIngredients(selected: string[], p: Profiled): boolean {
  return selected.length === 0 || selected.some((i) => (p.ingredients || []).includes(i));
}

/** Higher = better fit. Used to order the results when filters are on. */
export function relevanceScore(selected: { skinTypes: string[]; concerns: string[]; ingredients: string[] }, p: Profiled): number {
  const named = p.skin_types.filter((t) => t !== ALL_SKIN_TYPES);
  return (
    selected.skinTypes.filter((t) => named.includes(t)).length * 3 +
    selected.concerns.filter((c) => p.concerns.includes(c)).length * 2 +
    selected.ingredients.filter((i) => (p.ingredients || []).includes(i)).length
  );
}

function countBy(products: Profiled[], labels: string[], test: (label: string, p: Profiled) => boolean): FacetOption[] {
  return labels.map((label) => ({ label, count: products.filter((p) => test(label, p)).length })).filter((o) => o.count > 0);
}

/** Filter choices shown in the sidebar, with how many of the listed products each one gives. */
export function buildFacets(products: Profiled[]): ShopFacets {
  const byFrequency = (key: "concerns" | "ingredients") => {
    const f = new Map<string, number>();
    products.forEach((p) => (p[key] || []).forEach((l) => f.set(l, (f.get(l) || 0) + 1)));
    return [...f.entries()].sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, count: n }));
  };
  return {
    skinTypes: countBy(products, SKIN_TYPE_ORDER, (label, p) => matchesSkinTypes([label], p)),
    concerns: byFrequency("concerns"),
    ingredients: byFrequency("ingredients"),
  };
}
