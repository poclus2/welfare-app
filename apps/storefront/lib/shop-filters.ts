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
  serums: "Sérums",
  cremes: "Crèmes",
  solaires: "Solaires",
  masques: "Masques",
  essences: "Essences",
  traitements: "Traitements",
  coffrets: "Coffrets",
  exfoliants: "Exfoliants",
  cheveux: "Cheveux",
  "face-care": "Soins du Visage",
  "body-care": "Soins du Corps",
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

const ALL_SKIN_TYPES = "Toutes";
const SKIN_TYPE_ORDER = ["Sèche", "Mixte", "Grasse", "Normale", "Sensible", "Mature", "À tendance acnéique"];

function count(products: { [k: string]: any }[], key: string, labels: string[], alsoIf?: (p: any) => boolean): FacetOption[] {
  return labels
    .map((label) => ({
      label,
      count: products.filter((p) => p[key].includes(label) || (alsoIf && alsoIf(p))).length,
    }))
    .filter((o) => o.count > 0);
}

/** Filter choices shown in the sidebar, with how many of the listed products each one gives. */
export function buildFacets(products: { skin_types: string[]; concerns: string[]; ingredients: string[] }[]): ShopFacets {
  const byFrequency = (key: "concerns" | "ingredients") => {
    const f = new Map<string, number>();
    products.forEach((p) => p[key].forEach((l) => f.set(l, (f.get(l) || 0) + 1)));
    return [...f.entries()].sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, count: n }));
  };
  return {
    // a product for "all skin types" suits every skin-type filter
    skinTypes: count(products, "skin_types", SKIN_TYPE_ORDER, (p) => p.skin_types.includes(ALL_SKIN_TYPES)),
    concerns: byFrequency("concerns"),
    ingredients: byFrequency("ingredients"),
  };
}

export function matchesSkinTypes(selected: string[], productSkinTypes: string[]): boolean {
  if (selected.length === 0) return true;
  return productSkinTypes.includes(ALL_SKIN_TYPES) || selected.some((s) => productSkinTypes.includes(s));
}
