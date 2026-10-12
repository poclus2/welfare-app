// Shared by the product form and the AI sheet route: the "fiche beauté" stored in product.metadata
// and read by the storefront (product page, Skin Coach, shop filters).
//
// Skin types / concerns are picked from fixed lists so they fold cleanly into the shop filter labels
// (apps/api/src/lib/shop-facets.ts matches them by regex): free text from the AI would create
// near-duplicates ("Peaux sensibles", "Sensitive"...) that the filters have to guess at.

export const SKIN_TYPE_OPTIONS = [
  "Tous types de peau",
  "Peau sèche",
  "Peau mixte",
  "Peau grasse",
  "Peau normale",
  "Peau sensible",
  "Peau mature",
  "Peau à tendance acnéique",
] as const;

export const SKIN_CONCERN_OPTIONS = [
  "Hydratation",
  "Acné & imperfections",
  "Taches & hyperpigmentation",
  "Éclat & teint terne",
  "Rougeurs & irritations",
  "Barrière cutanée",
  "Pores & sébum",
  "Anti-âge",
  "Sensibilité",
  "Protection solaire",
  "Cuir chevelu & cheveux",
  "Cicatrisation & régénération",
  "Texture & grain de peau",
  "Antioxydant & pollution",
] as const;

// Icons the product page knows how to draw for a usage step (ProductDetailClient iconMap)
export const STEP_ICONS = ["droplets", "wind", "star", "sun", "moon"] as const;
export const STEP_ICON_LABELS: Record<(typeof STEP_ICONS)[number], string> = {
  droplets: "Goutte",
  wind: "Souffle",
  star: "Étoile",
  sun: "Soleil",
  moon: "Lune",
};

export type LayeringStep = {
  step: number;
  label: string;
  timing: string;
  description: string;
  tip: string;
  icon: (typeof STEP_ICONS)[number];
  highlight: boolean;
};

/** What the AI route returns: every field is a proposal the admin reviews before saving. */
export type AiProductSheet = {
  title: string;
  subtitle: string;
  handle: string;
  description: string;
  collection_id: string | null;
  brand_detected: string;
  category_ids: string[];
  raw_inci: string;
  inci_markdown: string;
  skin_types: string[];
  skin_concerns: string[];
  search_tagline: string;
  commercial_description: string;
  layering_steps: LayeringStep[];
  inci_confidence: "high" | "medium" | "low";
  warnings: string[];
  model: string;
};

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// An INCI list is a comma-separated list of ingredient names. The AI sheet sometimes returns an excuse
// instead ("INCI non visible sur l'image…", "The image provides … but not the INCI list"): that is not one.
// Same rule as the storefront's Skin Coach (apps/storefront/lib/skin-safety.ts), which filters allergens on it.
const NOT_INCI_RE = /\b(image|photo|visibles?|lisibles?|illisibles?|impossible|cannot|unable|sorry|not provided|not available|not visible|n'est pas|ne sont pas|non disponibles?|aucune liste|pas fournie|r[ée]solution|floue?|exemple|example|non applicable)\b/i;

export function looksLikeInciList(s: string): boolean {
  const text = s.replace(/\[illisible\]/gi, "").trim(); // the prompt marks an unreadable passage this way
  if (!text || NOT_INCI_RE.test(text)) return false;
  return text.split(/[,;]/).filter((x) => x.trim()).length >= 4;
}
