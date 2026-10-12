// Checks applied in code to the routine the model proposes, before it is shown (owner's rules, 2026-10-12):
// - every daily routine covers 3 essential functions: cleanse, moisturize with a leave-on cream / gel-cream /
//   emulsion (a toner or an essence does not count), protect from the sun;
// - the budget is met by dropping optional steps first and choosing cheaper references, never by dropping an
//   essential function; if the essentials alone exceed the budget, we say so instead of hiding it;
// - every product is checked again against allergies / pregnancy / medical restrictions (lib/skin-safety.ts).
// Nothing here relies on the text written by the model.

import { exclusionReason, normalizeInci, type SafetyProfile } from "./skin-safety";

export type ProductFunction = "cleanser" | "moisturizer" | "sunscreen" | "other";
export const ESSENTIAL_FUNCTIONS: ProductFunction[] = ["cleanser", "moisturizer", "sunscreen"];

export const FUNCTION_LABEL: Record<ProductFunction, string> = {
  cleanser: "nettoyant",
  moisturizer: "hydratant (crème, gel-crème ou émulsion)",
  sunscreen: "protection solaire",
  other: "soin complémentaire",
};
// "un nettoyant" / "une protection solaire", "de nettoyant" / "d'hydratant"
export function withArticle(fn: ProductFunction, article: "un" | "de"): string {
  const label = FUNCTION_LABEL[fn];
  if (article === "de") return /^[aeiouyh]/i.test(label) ? `d'${label}` : `de ${label}`;
  return fn === "sunscreen" ? `une ${label}` : `un ${label}`;
}

const FUNCTION_STEP_NAME: Record<ProductFunction, string> = {
  cleanser: "Nettoyant",
  moisturizer: "Hydratant",
  sunscreen: "Protection solaire",
  other: "Soin complémentaire",
};
// display order: cleanse, then toner / essence / serum, then moisturize, then protect
const FUNCTION_ORDER: Record<ProductFunction, number> = { cleanser: 0, other: 1, moisturizer: 2, sunscreen: 3 };

const CLEANSER = /nettoy|cleans|foam|mousse|wash|demaquill|gel lavant/;
const SUNSCREEN = /\bspf|\bsun\b|sunscreen|solaire|\buv\b/;
const NOT_MOISTURIZER = /toner|tonique|essence|serum|ampoule|mist|brume|\beye|yeux|contour|\blip|levre|mask|masque|\bpads?\b|patch|gommage|scrub|peeling|\bbody\b|corps|\bhand|mains|\bfoot\b|pieds/;
const MOISTURIZER = /cream|creme|emulsion|moistur|hydrat|baume|balm|lotion|\bgel\b/;

// From the product name first (the admin's step can be wrong: a "Nettoyant Facial Hydratant" filed under
// Hydratant is a cleanser), then from the step / category it was picked for.
export function productFunction(p: { title: string; category: string }): ProductFunction {
  const t = normalizeInci(p.title || "");
  if (CLEANSER.test(t)) return "cleanser";
  if (p.category === "Solaire" || SUNSCREEN.test(t)) return "sunscreen";
  if (p.category === "Nettoyant") return "cleanser";
  if (NOT_MOISTURIZER.test(t)) return "other";
  if (p.category === "Hydratant" || MOISTURIZER.test(t)) return "moisturizer";
  return "other";
}

// The questionnaire's budget answer → the upper bound she chose (Infinity when there is none)
export function budgetMax(answer: string): number {
  if (/25k/.test(answer)) return 35000;
  if (/35k/.test(answer)) return 45000;
  return Infinity;
}
export const BUDGET_TOLERANCE = 5000;

export type RoutineStep = {
  step_number: number;
  step_name: string;
  explanation_for_client: string;
  medusa_product_id: string | null;
  product_name: string;
  [key: string]: unknown;
};

export type CatalogEntry = {
  id: string;
  title: string;
  category: string;
  price?: number;
  inci: string;
  stock_total: number;
  fallback?: boolean;
};

export type RoutineCheck = {
  steps: RoutineStep[];
  dropped: string[]; // why each removed step was removed (logged)
  missing: ProductFunction[]; // essential functions not covered although the catalog has a compatible product
  unavailable: ProductFunction[]; // essential functions with no compatible product in the catalog at all
  total: number;
  budgetMax: number;
  overBudget: boolean; // total above the budget + tolerance
  cheaperPossible: boolean; // the essentials could fit the budget with other references from the catalog
};

const priceOf = (p: CatalogEntry | undefined) => (p?.price && p.price > 0 ? p.price : 15000);

export function checkRoutine(
  input: RoutineStep[],
  catalog: CatalogEntry[],
  opts: { safety: SafetyProfile; excludedIds: Set<string>; maxSteps: number; budgetMax: number; essentialsOnly: boolean }
): RoutineCheck {
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const dropped: string[] = [];
  const seen = new Set<string>();
  const seenFunction = new Set<ProductFunction>();
  let kept: { step: RoutineStep; product: CatalogEntry; fn: ProductFunction }[] = [];

  for (const step of Array.isArray(input) ? input : []) {
    const id = step?.medusa_product_id || "";
    const product = byId.get(id);
    const label = `${step?.product_name || id || "?"}`;
    if (!product) { dropped.push(`${label}: hors catalogue`); continue; }
    if (opts.excludedIds.has(id)) { dropped.push(`${label}: acné d'abord`); continue; }
    const unsafe = exclusionReason(product, opts.safety);
    if (unsafe) { dropped.push(`${label}: BLOQUÉ (${unsafe})`); continue; }
    if (seen.has(id)) { dropped.push(`${label}: doublon`); continue; }
    const fn = productFunction(product);
    if (fn !== "other" && seenFunction.has(fn)) { dropped.push(`${label}: doublon (${FUNCTION_LABEL[fn]})`); continue; }
    if (fn === "other" && opts.essentialsOnly) { dropped.push(`${label}: routine essentielle uniquement`); continue; }
    seen.add(id);
    seenFunction.add(fn);
    kept.push({ step, product, fn });
  }

  kept.sort((a, b) => FUNCTION_ORDER[a.fn] - FUNCTION_ORDER[b.fn]);

  // Too many steps / over budget: optional steps go first, most expensive first. Essentials are never dropped.
  const ceiling = opts.budgetMax + BUDGET_TOLERANCE;
  const total = () => kept.reduce((sum, k) => sum + priceOf(k.product), 0);
  const dropMostExpensiveOptional = (why: string) => {
    const optional = kept.filter((k) => k.fn === "other").sort((a, b) => priceOf(b.product) - priceOf(a.product))[0];
    if (!optional) return false;
    kept = kept.filter((k) => k !== optional);
    dropped.push(`${optional.product.title}: ${why}`);
    return true;
  };
  while (kept.length > opts.maxSteps && dropMostExpensiveOptional("nombre maximal d'étapes")) {}
  while (total() > ceiling && dropMostExpensiveOptional("budget")) {}

  const present = new Set(kept.map((k) => k.fn));
  const candidates = (fn: ProductFunction) => catalog.filter((p) => productFunction(p) === fn && !opts.excludedIds.has(p.id) && !exclusionReason(p, opts.safety));
  const missing = ESSENTIAL_FUNCTIONS.filter((fn) => !present.has(fn) && candidates(fn).length > 0);
  const unavailable = ESSENTIAL_FUNCTIONS.filter((fn) => !present.has(fn) && candidates(fn).length === 0);

  const minEssentials = ESSENTIAL_FUNCTIONS.reduce((sum, fn) => {
    const prices = candidates(fn).map(priceOf);
    return sum + (prices.length ? Math.min(...prices) : 0);
  }, 0);
  const finalTotal = total();

  return {
    steps: kept.map((k, i) => ({ ...k.step, step_number: i + 1 })),
    dropped,
    missing,
    unavailable,
    total: finalTotal,
    budgetMax: opts.budgetMax,
    overBudget: finalTotal > ceiling,
    cheaperPossible: finalTotal > ceiling && minEssentials <= ceiling,
  };
}

// What to ask the model to fix (sent back to it once, see analyze-skin.ts)
export function routineProblems(check: RoutineCheck): string[] {
  const problems = check.missing.map(
    (fn) => `Il manque ${withArticle(fn, "un")} : c'est une fonction essentielle de toute routine quotidienne${fn === "moisturizer" ? " (un toner ou une essence ne remplace pas un hydratant)" : ""}. Ajoute ce soin en le choisissant dans le catalogue.`
  );
  if (check.overBudget && check.cheaperPossible) {
    problems.push(
      `Le total (${fmt(check.total)} FCFA) dépasse le budget de la cliente (jusqu'à ${fmt(check.budgetMax)} FCFA). Choisis des références moins chères pour les étapes essentielles, et retire d'abord les soins complémentaires : ne retire jamais le nettoyant, l'hydratant ou la protection solaire.`
    );
  }
  return problems;
}

// A product made to treat something specific (spots, acne…) is not a good default for a basic step
const TARGETED_TREATMENT = /dark spot|tache|eclairciss|whitening|brightening|tranexam|\btxa\b|arbutin|acne|acné|azelaic|\bbha\b|\baha\b|retinol/;
const isTargetedTreatment = (p: CatalogEntry) => TARGETED_TREATMENT.test(normalizeInci(p.title));

// Last resort when the model still left an essential function out: the cheapest compatible product of the
// catalog (the team's selection first, basic products before targeted treatments, then the largest stock),
// with a plain explanation.
export function addMissingEssentials(
  check: RoutineCheck,
  catalog: CatalogEntry[],
  opts: { safety: SafetyProfile; excludedIds: Set<string> }
): { steps: RoutineStep[]; added: string[] } {
  const steps = [...check.steps];
  const added: string[] = [];
  for (const fn of check.missing) {
    const pick = catalog
      .filter((p) => productFunction(p) === fn && !opts.excludedIds.has(p.id) && !exclusionReason(p, opts.safety))
      .sort((a, b) => Number(!!a.fallback) - Number(!!b.fallback) || Number(isTargetedTreatment(a)) - Number(isTargetedTreatment(b)) || priceOf(a) - priceOf(b) || b.stock_total - a.stock_total)[0];
    if (!pick) continue;
    steps.push({
      step_number: 0,
      step_name: FUNCTION_STEP_NAME[fn],
      explanation_for_client: `Étape essentielle ajoutée par notre contrôle qualité : une routine quotidienne doit toujours comporter ${withArticle(fn, "un")}. Ce produit est compatible avec vos réponses et disponible.`,
      medusa_product_id: pick.id,
      product_name: pick.title,
    });
    added.push(pick.title);
  }
  const fnOf = (s: RoutineStep) => {
    const p = catalog.find((c) => c.id === s.medusa_product_id);
    return p ? productFunction(p) : "other";
  };
  steps.sort((a, b) => FUNCTION_ORDER[fnOf(a)] - FUNCTION_ORDER[fnOf(b)]);
  return { steps: steps.map((s, i) => ({ ...s, step_number: i + 1 })), added };
}

export function routineTotal(steps: RoutineStep[], catalog: CatalogEntry[]): number {
  return steps.reduce((sum, s) => sum + priceOf(catalog.find((c) => c.id === s.medusa_product_id)), 0);
}

export const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR").replace(/ | /g, " ");
