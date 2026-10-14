// The routine is built and checked in code; the model chooses among valid products and explains
// (owner's rules, 2026-10-12):
// - every daily routine covers 3 essential functions: cleanse, moisturize with a leave-on cream / gel-cream /
//   emulsion (a toner or an essence does not count), protect from the sun;
// - the moisturizer's texture matches the skin (lib/skin-profile.ts);
// - the budget is met by dropping optional steps first, then by choosing the combination of essentials that
//   fits; if none fits, the cheapest complete combination is shown and the customer is told;
// - every product is checked again against allergies / pregnancy / medical restrictions (lib/skin-safety.ts).
// Nothing here relies on the text written by the model.

import { exclusionReason, normalizeInci, type SafetyProfile } from "./skin-safety";
import { moisturizerTextures, TEXTURE_LABEL, textureFit, type SkinProfile } from "./skin-profile";

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
  cleanser: "Nettoyant visage",
  moisturizer: "Hydratant sans rinçage",
  sunscreen: "Protection solaire",
  other: "Soin complémentaire",
};

export type CatalogEntry = {
  id: string;
  title: string;
  category: string;
  price?: number;
  inci: string;
  stock_total: number;
  fallback?: boolean;
  routine_function?: string; // product.metadata.routine_function, set in the admin (apps/admin/lib/product-sheet.ts)
  texture?: string; // product.metadata.texture
  skin_concerns?: string[];
};

// product.metadata.routine_function → role in the routine. An oil / balm cleanser is the optional first
// cleanse: the essential cleanser is the water-based one.
const FUNCTION_FROM_METADATA: Record<string, ProductFunction> = {
  nettoyant: "cleanser",
  hydratant: "moisturizer",
  solaire: "sunscreen",
  demaquillant: "other",
  tonique: "other",
  essence: "other",
  serum: "other",
  traitement: "other",
  exfoliant: "other",
  masque: "other",
  contour_yeux: "other",
};
const NOT_FACE_CARE = new Set(["levres", "corps", "accessoire"]);

const FIRST_CLEANSE = /huile (nettoyante|demaquillante|lavante)|cleansing (oil|balm)|oil cleanser|baume (nettoyant|demaquillant)/;
const CLEANSER = /nettoy|cleans|foam|mousse|wash|demaquill|gel lavant/;
const SUNSCREEN = /\bspf|\bsun\b|sunscreen|solaire|\buv\b/;
const NOT_MOISTURIZER = /toner|tonique|essence|serum|ampoule|mist|brume|\beye|yeux|contour|\blip|levre|mask|masque|\bpads?\b|patch|gommage|scrub|peeling|\bbody\b|corps|\bhand|mains|\bfoot\b|pieds/;
const MOISTURIZER = /cream|creme|emulsion|moistur|hydrat|baume|balm|lotion|\bgel\b/;

const isFirstCleanse = (p: { title: string; routine_function?: string }) =>
  p.routine_function === "demaquillant" || (!p.routine_function && FIRST_CLEANSE.test(normalizeInci(p.title || "")));

// Lips, body, accessories: not part of a face routine
export function isFaceCare(p: { routine_function?: string }): boolean {
  return !NOT_FACE_CARE.has(p.routine_function || "");
}

// The admin's "fonction" field when it is set; otherwise guessed from the product name first (the admin's
// step can be wrong: a "Nettoyant Facial Hydratant" filed under Hydratant is a cleanser), then from the
// step / category it was picked for.
export function productFunction(p: { title: string; category: string; routine_function?: string }): ProductFunction {
  const fromAdmin = p.routine_function ? FUNCTION_FROM_METADATA[p.routine_function] : undefined;
  if (fromAdmin) return fromAdmin;
  const t = normalizeInci(p.title || "");
  if (FIRST_CLEANSE.test(t)) return "other";
  if (CLEANSER.test(t)) return "cleanser";
  if (p.category === "Solaire" || SUNSCREEN.test(t)) return "sunscreen";
  if (p.category === "Nettoyant") return "cleanser";
  if (NOT_MOISTURIZER.test(t)) return "other";
  if (p.category === "Hydratant" || MOISTURIZER.test(t)) return "moisturizer";
  return "other";
}

// display order: first cleanse (oil), cleanse, toner / essence / serum, moisturize, protect
const orderOf = (p: CatalogEntry | undefined) => {
  if (!p) return 1;
  if (isFirstCleanse(p)) return -1;
  return { cleanser: 0, other: 1, moisturizer: 2, sunscreen: 3 }[productFunction(p)];
};

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

export type RoutineCheck = {
  steps: RoutineStep[];
  dropped: string[]; // why each removed step was removed (logged)
  missing: ProductFunction[]; // essential functions not covered although the catalog has a compatible product
  unavailable: ProductFunction[]; // essential functions with no compatible product in the catalog at all
  textureIssue: string | null; // the moisturizer's texture does not suit her skin (sentence for the model)
  total: number;
  budgetMax: number;
  overBudget: boolean; // total above the budget + tolerance
  cheaperPossible: boolean; // the essentials could fit the budget with other references from the catalog
};

export type CheckOptions = {
  safety: SafetyProfile;
  excludedIds: Set<string>;
  maxSteps: number;
  budgetMax: number;
  essentialsOnly: boolean;
  profile?: SkinProfile;
};

const priceOf = (p: CatalogEntry | undefined) => (p?.price && p.price > 0 ? p.price : 15000);

const usable = (p: CatalogEntry, opts: { safety: SafetyProfile; excludedIds: Set<string> }) =>
  isFaceCare(p) && !opts.excludedIds.has(p.id) && !exclusionReason(p, opts.safety);

// Compatible products of the catalog for one function (for the moisturizer, textures to avoid are left out
// when something else is available)
export function candidatesFor(
  fn: ProductFunction,
  catalog: CatalogEntry[],
  opts: { safety: SafetyProfile; excludedIds: Set<string>; profile?: SkinProfile }
): CatalogEntry[] {
  const all = catalog.filter((p) => productFunction(p) === fn && !isFirstCleanse(p) && usable(p, opts));
  if (fn !== "moisturizer" || !opts.profile) return all;
  const suitable = all.filter((p) => textureFit(p, opts.profile!) !== "avoid");
  return suitable.length ? suitable : all;
}

function describeTextureIssue(product: CatalogEntry, profile: SkinProfile): string {
  const { preferred } = moisturizerTextures(profile);
  const what = product.texture ? `texture ${TEXTURE_LABEL[product.texture] || product.texture}` : "crème matifiante";
  return `L'hydratant choisi (${product.title}, ${what}) ne convient pas à sa ${profile.label} : choisis un hydratant de texture ${preferred.map((t) => TEXTURE_LABEL[t]).join(", ")}.`;
}

export function checkRoutine(input: RoutineStep[], catalog: CatalogEntry[], opts: CheckOptions): RoutineCheck {
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const dropped: string[] = [];
  const seen = new Set<string>();
  const seenFunction = new Set<string>();
  let kept: { step: RoutineStep; product: CatalogEntry; fn: ProductFunction }[] = [];

  for (const step of Array.isArray(input) ? input : []) {
    const id = step?.medusa_product_id || "";
    const product = byId.get(id);
    const label = `${step?.product_name || id || "?"}`;
    if (!product) { dropped.push(`${label}: hors catalogue`); continue; }
    if (opts.excludedIds.has(id)) { dropped.push(`${label}: acné d'abord`); continue; }
    if (!isFaceCare(product)) { dropped.push(`${label}: pas un soin du visage`); continue; }
    const unsafe = exclusionReason(product, opts.safety);
    if (unsafe) { dropped.push(`${label}: BLOQUÉ (${unsafe})`); continue; }
    if (seen.has(id)) { dropped.push(`${label}: doublon`); continue; }
    const fn = productFunction(product);
    const slot = isFirstCleanse(product) ? "first_cleanse" : fn;
    if (slot !== "other" && seenFunction.has(slot)) { dropped.push(`${label}: doublon (${FUNCTION_LABEL[fn]})`); continue; }
    if (fn === "other" && opts.essentialsOnly) { dropped.push(`${label}: routine essentielle uniquement`); continue; }
    seen.add(id);
    seenFunction.add(slot);
    kept.push({ step, product, fn });
  }

  kept.sort((a, b) => orderOf(a.product) - orderOf(b.product));

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

  const present = new Set(kept.filter((k) => !isFirstCleanse(k.product)).map((k) => k.fn));
  const missing = ESSENTIAL_FUNCTIONS.filter((fn) => !present.has(fn) && candidatesFor(fn, catalog, opts).length > 0);
  const unavailable = ESSENTIAL_FUNCTIONS.filter((fn) => !present.has(fn) && candidatesFor(fn, catalog, opts).length === 0);

  const moisturizer = kept.find((k) => k.fn === "moisturizer")?.product;
  const textureIssue =
    moisturizer && opts.profile && textureFit(moisturizer, opts.profile) === "avoid" &&
    candidatesFor("moisturizer", catalog, opts).some((p) => textureFit(p, opts.profile!) !== "avoid")
      ? describeTextureIssue(moisturizer, opts.profile)
      : null;

  const minEssentials = cheapestEssentials(catalog, opts)?.total ?? 0;
  const finalTotal = total();

  return {
    steps: kept.map((k, i) => ({ ...k.step, step_number: i + 1 })),
    dropped,
    missing,
    unavailable,
    textureIssue,
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
  if (check.textureIssue) problems.push(check.textureIssue);
  if (check.overBudget && check.cheaperPossible) {
    problems.push(
      `Le total (${fmt(check.total)} FCFA) dépasse le budget de la cliente (jusqu'à ${fmt(check.budgetMax)} FCFA). Choisis des références moins chères pour les étapes essentielles, et retire d'abord les soins complémentaires : ne retire jamais le nettoyant, l'hydratant ou la protection solaire.`
    );
  }
  return problems;
}

// A product made to treat something specific (spots, acne…) is not a good default for a basic step
const TARGETED_TREATMENT = /dark spot|tache|eclairciss|whitening|brightening|tranexam|\btxa\b|arbutin|acne|acné|azelaic|\bbha\b|\baha\b|retinol/;
const isTargetedTreatment = (p: CatalogEntry) => p.routine_function === "traitement" || TARGETED_TREATMENT.test(normalizeInci(p.title));

const textureRank = (p: CatalogEntry, profile?: SkinProfile) => {
  if (!profile || productFunction(p) !== "moisturizer") return 1;
  return { preferred: 2, ok: 1, unknown: 1, avoid: 0 }[textureFit(p, profile)];
};

// The cheapest complete set of essentials in the catalog (null when a function has no compatible product)
export function cheapestEssentials(
  catalog: CatalogEntry[],
  opts: { safety: SafetyProfile; excludedIds: Set<string>; profile?: SkinProfile }
): { products: CatalogEntry[]; total: number } | null {
  const products: CatalogEntry[] = [];
  for (const fn of ESSENTIAL_FUNCTIONS) {
    const pick = candidatesFor(fn, catalog, opts).sort((a, b) => priceOf(a) - priceOf(b) || textureRank(b, opts.profile) - textureRank(a, opts.profile))[0];
    if (!pick) return null;
    products.push(pick);
  }
  return { products, total: products.reduce((s, p) => s + priceOf(p), 0) };
}

function replacementStep(p: CatalogEntry, fn: ProductFunction, why: string): RoutineStep {
  const texture = p.texture ? ` (texture ${TEXTURE_LABEL[p.texture] || p.texture})` : "";
  return {
    step_number: 0,
    step_name: FUNCTION_STEP_NAME[fn],
    explanation_for_client: `${why} : ${withArticle(fn, "un")}${texture} compatible avec vos réponses et disponible.`,
    medusa_product_id: p.id,
    product_name: p.title,
  };
}

const sortSteps = (steps: RoutineStep[], catalog: CatalogEntry[]) =>
  steps
    .sort((a, b) => orderOf(catalog.find((c) => c.id === a.medusa_product_id)) - orderOf(catalog.find((c) => c.id === b.medusa_product_id)))
    .map((s, i) => ({ ...s, step_number: i + 1 }));

// Last resort when the model still left an essential function out: the cheapest compatible product of the
// catalog (the team's selection first, basic products before targeted treatments, suitable texture, then the
// largest stock), with a plain explanation.
export function addMissingEssentials(
  check: RoutineCheck,
  catalog: CatalogEntry[],
  opts: { safety: SafetyProfile; excludedIds: Set<string>; profile?: SkinProfile }
): { steps: RoutineStep[]; added: string[] } {
  const steps = [...check.steps];
  const added: string[] = [];
  for (const fn of check.missing) {
    const pick = candidatesFor(fn, catalog, opts).sort(
      (a, b) =>
        Number(!!a.fallback) - Number(!!b.fallback) ||
        Number(isTargetedTreatment(a)) - Number(isTargetedTreatment(b)) ||
        textureRank(b, opts.profile) - textureRank(a, opts.profile) ||
        priceOf(a) - priceOf(b) ||
        b.stock_total - a.stock_total
    )[0];
    if (!pick) continue;
    steps.push(replacementStep(pick, fn, "Étape essentielle ajoutée par notre contrôle qualité, car une routine quotidienne doit toujours la comporter"));
    added.push(pick.title);
  }
  return { steps: sortSteps(steps, catalog), added };
}

// Budget and texture, settled in code: keeps as many of the model's essentials as possible within the budget,
// with a suitable moisturizer texture. When no complete set fits the budget, the cheapest one is used
// (owner's decision) and `minimumTotal` tells how much a complete routine costs at least.
export function fitEssentials(
  steps: RoutineStep[],
  catalog: CatalogEntry[],
  opts: { safety: SafetyProfile; excludedIds: Set<string>; budgetMax: number; profile?: SkinProfile }
): { steps: RoutineStep[]; changed: string[]; minimumTotal: number | null } {
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const ceiling = opts.budgetMax + BUDGET_TOLERANCE;
  const productOf = (s: RoutineStep) => byId.get(s.medusa_product_id || "");
  const isEssentialStep = (s: RoutineStep) => {
    const p = productOf(s);
    return !!p && !isFirstCleanse(p) && productFunction(p) !== "other";
  };
  const current = new Map<ProductFunction, RoutineStep>();
  for (const s of steps) if (isEssentialStep(s)) current.set(productFunction(productOf(s)!), s);

  const total = routineTotal(steps, catalog);
  const moisturizer = current.get("moisturizer");
  const badTexture = !!(moisturizer && opts.profile && textureFit(productOf(moisturizer)!, opts.profile) === "avoid");
  if (total <= ceiling && !badTexture) return { steps, changed: [], minimumTotal: null };

  const lists = ESSENTIAL_FUNCTIONS.map((fn) => candidatesFor(fn, catalog, opts));
  if (lists.some((l) => l.length === 0)) return { steps, changed: [], minimumTotal: null };
  const others = steps.filter((s) => !isEssentialStep(s));
  const othersTotal = routineTotal(others, catalog);

  type Combo = { picks: CatalogEntry[]; total: number; kept: number; targeted: number; texture: number; fallback: number };
  const combos: Combo[] = [];
  const [cleansers = [], moisturizers = [], sunscreens = []] = lists;
  for (const c of cleansers) for (const m of moisturizers) for (const s of sunscreens) {
    const picks = [c, m, s];
    combos.push({
      picks,
      total: picks.reduce((sum, p) => sum + priceOf(p), 0),
      kept: picks.filter((p, i) => current.get(ESSENTIAL_FUNCTIONS[i]!)?.medusa_product_id === p.id).length,
      // a spot / acne treatment chosen by the code (not the model) is a poor default for a basic step
      targeted: picks.filter((p, i) => isTargetedTreatment(p) && current.get(ESSENTIAL_FUNCTIONS[i]!)?.medusa_product_id !== p.id).length,
      texture: textureRank(m, opts.profile),
      fallback: picks.filter((p) => p.fallback).length,
    });
  }
  const fitting = combos.filter((x) => x.total + othersTotal <= ceiling);
  const pick = fitting.length
    ? fitting.sort(
        (a, b) =>
          Number(b.texture > 0) - Number(a.texture > 0) || // no texture to avoid
          b.kept - a.kept || // as close as possible to the model's choice
          a.targeted - b.targeted ||
          b.texture - a.texture ||
          a.fallback - b.fallback ||
          a.total - b.total
      )[0]
    : combos.sort((a, b) => a.total - b.total || a.targeted - b.targeted || b.texture - a.texture || b.kept - a.kept)[0];
  // nothing fits: the optional steps go too, the cheapest complete routine is shown
  if (!pick) return { steps, changed: [], minimumTotal: null };
  const keptOthers = fitting.length ? others : [];

  const changed: string[] = [];
  const next: RoutineStep[] = [...keptOthers];
  ESSENTIAL_FUNCTIONS.forEach((fn, i) => {
    const p = pick.picks[i]!;
    const was = current.get(fn);
    if (was?.medusa_product_id === p.id) next.push(was);
    else {
      const why = badTexture && fn === "moisturizer" ? "Choisi par notre contrôle qualité pour sa texture adaptée à votre peau" : "Choisi par notre contrôle qualité pour respecter votre budget";
      next.push(replacementStep(p, fn, why));
      changed.push(`${was?.product_name || "(aucun)"} → ${p.title}`);
    }
  });
  return { steps: sortSteps(next, catalog), changed, minimumTotal: fitting.length ? null : pick.total };
}

export function routineTotal(steps: RoutineStep[], catalog: CatalogEntry[]): number {
  return steps.reduce((sum, s) => sum + priceOf(catalog.find((c) => c.id === s.medusa_product_id)), 0);
}

export const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR").replace(/[  ]/g, " ");
