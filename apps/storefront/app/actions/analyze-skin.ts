"use server";

import { createHash, createHmac, timingSafeEqual } from "crypto";
import { decideMedical, exclusionReason, needsInciCheck, readSafetyProfile } from "@/lib/skin-safety";
import {
  addMissingEssentials,
  BUDGET_TOLERANCE,
  budgetMax,
  candidatesFor,
  checkRoutine,
  cheapestEssentials,
  fitEssentials,
  isFaceCare,
  ESSENTIAL_FUNCTIONS,
  fmt,
  FUNCTION_LABEL,
  productFunction,
  routineProblems,
  routineTotal,
  type RoutineCheck,
  type RoutineStep as CheckedStep,
  withArticle,
} from "@/lib/skin-routine";
import { callOpenRouter, parseJsonAnswer, type AiErrorCode } from "@/lib/openrouter";
import { ACNE_SCAN_LOW, ACNE_SCAN_THRESHOLD, answerOf, FOLLOWUP_ACNE, FOLLOWUP_SPOTS, moisturizerTextures, readAcne, readSkinProfile, TEXTURE_LABEL } from "@/lib/skin-profile";

export type UserResponse = {
  questionId: string;
  answer: string | { type: "image"; base64: string };
};

// === Updated RoutineStep with Medusa product linking ===
export type RoutineStep = {
  step_number: number;
  step_name: string;
  explanation_for_client: string;
  medusa_product_id?: string;
  product_name?: string;
  // Legacy fields kept for backward compat
  category?: string;
  target_concern?: string;
  explanation?: string;
};

// Messages decided in code (never written by the model), shown above the routine
export type SkinNotice = { kind: "referral" | "caution" | "budget" | "missing"; text: string };

// Pilot: a skin advisor validated or corrected the routine afterwards (admin, POST /admin/skin-scans/:id/review)
export type SkinReview = {
  status: "validated" | "corrected";
  corrections?: { step_name: string; from: string; to: string; reason: string }[];
};

export type SkinAnalysisResult = {
  notices?: SkinNotice[];
  review?: SkinReview;
  final_skin_type: string;
  estimated_skin_age: number;
  melanin_phototype?: string;
  empathetic_message: string;
  scan_id?: string; // id of the saved diagnostic, used to attach it to the customer's history
  kbeauty_routine: RoutineStep[];
  metrics?: {
    sebum_level_percentage: number;
    acne_severity_percentage: number;
    hydration_barrier_percentage: number;
    pore_visibility_percentage: number;
    eye_contour_fatigue_percentage: number;
  };
};

// =========================================================================
// AI CONFIG TYPE
// =========================================================================

type AIConfig = {
  mode: "top_stock" | "manual_selection";
  min_stock_threshold: number;
  max_routine_steps: number;
  manual_product_ids: string[];
  manual_products_by_step?: Record<string, string[]>;
  enforce_stock_filter: boolean;
};

const DEFAULT_AI_CONFIG: AIConfig = {
  mode: "top_stock",
  min_stock_threshold: 1,
  max_routine_steps: 5,
  manual_product_ids: [],
  enforce_stock_filter: true,
};

// =========================================================================
// FETCH AI CONFIG FROM MEDUSA BACKEND
// =========================================================================

async function fetchAIConfig(): Promise<AIConfig> {
  try {
    const medusaUrl =
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

    const res = await fetch(`${medusaUrl}/store/ai-config`, {
      headers: {
        "x-publishable-api-key": publishableKey,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return DEFAULT_AI_CONFIG;
    const data = await res.json();
    return { ...DEFAULT_AI_CONFIG, ...(data.config || {}) };
  } catch {
    return DEFAULT_AI_CONFIG;
  }
}

// =========================================================================
// MEDUSA STORE — Fetch products with stock metadata
// =========================================================================

type EnrichedProduct = {
  id: string;
  title: string;
  description?: string;
  handle?: string;
  thumbnail?: string;
  stock_total: number;
  category: string; // assigned by RAG
  price?: number;
  skin_concerns: string[]; // product.metadata.skin_concerns, most relevant first
  inci: string; // product.metadata.raw_inci, checked against allergies / pregnancy
  routine_function?: string; // product.metadata.routine_function (admin product form)
  texture?: string; // product.metadata.texture
  fallback?: boolean; // added to complete a manual-selection step left without any product
};

async function fetchStoreProductsByIds(
  ids: string[],
  category: string
): Promise<EnrichedProduct[]> {
  if (ids.length === 0) return [];
  const medusaUrl =
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

  try {
    // Build query with comma-separated IDs — Medusa store supports id[]
    const query = ids.map((id) => `id[]=${id}`).join("&");
    const res = await fetch(
      `${medusaUrl}/store/products?${query}&limit=${ids.length}&fields=*variants.prices,+metadata`,
      {
        headers: {
          "x-publishable-api-key": publishableKey,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products || []).map((p: any) => {
      let price = 15000;
      if (p.variants && p.variants.length > 0) {
         price = p.variants[0].calculated_price?.calculated_amount || p.variants[0].prices?.[0]?.amount || 15000;
      }
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        handle: p.handle,
        thumbnail: p.thumbnail,
        // Per-store metadata (Odoo-synced, same source as the product page) is the stock of record;
        // Medusa's inventory_quantity is an unmaintained counter that only goes negative.
        stock_total: (p.variants || []).reduce((acc: number, v: any) => {
          const m = v.metadata || {};
          if (m.stock_b1 != null || m.stock_b2 != null) {
            return acc + (Number(m.stock_b1) || 0) + (Number(m.stock_b2) || 0);
          }
          if (m.stock_total != null) return acc + (Number(m.stock_total) || 0);
          return acc + (Number(v.inventory_quantity) || 0);
        }, 0),
        category,
        price,
        skin_concerns: Array.isArray(p.metadata?.skin_concerns) ? p.metadata.skin_concerns.map(String) : [],
        routine_function: typeof p.metadata?.routine_function === "string" ? p.metadata.routine_function : undefined,
        texture: typeof p.metadata?.texture === "string" && p.metadata.texture ? p.metadata.texture : undefined,
        inci: typeof p.metadata?.raw_inci === "string" ? p.metadata.raw_inci : "",
      };
    });
  } catch {
    return [];
  }
}

// =========================================================================
// RAG HELPER : Meilisearch → IDs de produits pertinents
// =========================================================================

type MeiliProduct = {
  id: string;
  title: string;
  description?: string;
  category: string;
};

async function fetchProductCatalogForSkin(
  skinType: string,
  concerns: string[],
  config: AIConfig
): Promise<EnrichedProduct[]> {
  const host = process.env.MEILISEARCH_HOST;
  const searchKey = process.env.MEILISEARCH_SEARCH_KEY;

  // ---- MODE : MANUAL SELECTION ----
  if (config.mode === "manual_selection") {
    let enrichedAll: EnrichedProduct[] = [];
    if (config.manual_products_by_step) {
      await Promise.allSettled(
        Object.entries(config.manual_products_by_step).map(async ([stepName, ids]) => {
          if (ids.length > 0) {
            const products = await fetchStoreProductsByIds(ids, stepName);
            enrichedAll.push(...products);
          }
        })
      );
    } else if (config.manual_product_ids && config.manual_product_ids.length > 0) {
      // Legacy fallback
      enrichedAll = await fetchStoreProductsByIds(config.manual_product_ids, "Sélection manuelle");
    }

    if (enrichedAll.length === 0) {
      console.warn("[RAG] Mode manual_selection mais aucun produit sélectionné.");
      return [];
    }

    // Apply stock filter if enabled
    return config.enforce_stock_filter
      ? enrichedAll.filter((p) => p.stock_total >= config.min_stock_threshold)
      : enrichedAll;
  }

  // ---- MODE : TOP STOCK (automatique) ----
  if (!host || !searchKey) {
    console.warn("[RAG] Variables Meilisearch manquantes, mode dégradé activé.");
    return [];
  }

  const skinKeywords = buildSkinKeywords(skinType, concerns);

  const categories = [
    { name: "Nettoyant", queries: ["nettoyant", "cleanser", "cleansing", "mousse"] },
    { name: "Toner / Essence", queries: ["toner", "essence", "lotion", "eau de soin"] },
    { name: "Sérum", queries: ["sérum", "serum", "ampoule", "concentré"] },
    { name: "Hydratant", queries: ["crème", "hydratant", "moisturizer", "gel crème"] },
    { name: "Solaire", queries: ["solaire", "spf", "sunscreen", "protection solaire"] },
  ];

  const results = await Promise.allSettled(
    categories.map(async (cat) => {
      const query = [...cat.queries, ...skinKeywords].slice(0, 3).join(" ");
      try {
        const res = await fetch(`${host}/indexes/products/search`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${searchKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: query,
            limit: 5, // Increased from 3 to have more margin after stock filtering
            attributesToRetrieve: ["id", "title", "description"],
          }),
        });
        if (!res.ok) return [] as MeiliProduct[];
        const data = await res.json();
        return (data.hits || []).map((hit: any) => ({
          id: hit.id,
          title: hit.title,
          description: hit.description,
          category: cat.name,
        })) as MeiliProduct[];
      } catch {
        return [] as MeiliProduct[];
      }
    })
  );

  // Collect Meilisearch results grouped by category
  const byCategory: Record<string, string[]> = {};
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value.length > 0) {
      const categoryName = categories[i]?.name;
      if (categoryName) {
        byCategory[categoryName] = r.value.map((p) => p.id);
      }
    }
  });

  // Enrich with stock from Medusa Store API
  const enrichedAll: EnrichedProduct[] = [];
  await Promise.allSettled(
    Object.entries(byCategory).map(async ([cat, ids]) => {
      const products = await fetchStoreProductsByIds(ids, cat);
      enrichedAll.push(...products);
    })
  );

  // Filter by stock threshold
  const filtered = config.enforce_stock_filter
    ? enrichedAll.filter((p) => p.stock_total >= config.min_stock_threshold)
    : enrichedAll;

  // Sort by stock descending (highest stock first = preferred by AI)
  filtered.sort((a, b) => b.stock_total - a.stock_total);

  console.log(
    `[RAG] ${filtered.length} produits en stock sur ${enrichedAll.length} trouvés (seuil: ${config.min_stock_threshold})`
  );
  return filtered;
}

function buildSkinKeywords(skinType: string, concerns: string[]): string[] {
  const keywords: string[] = [];
  const st = skinType.toLowerCase();

  if (st.includes("grasse") || st.includes("mixte")) keywords.push("pore", "sébum", "matifiant");
  if (st.includes("sèche") || st.includes("déshydratée")) keywords.push("hydratation", "nourrissant");
  if (st.includes("sensible")) keywords.push("apaisant", "calmant", "centella");
  if (st.includes("terne") || st.includes("éclat")) keywords.push("vitamine c", "éclat", "luminosité");

  concerns.slice(0, 2).forEach((c) => {
    const lc = c.toLowerCase();
    if (lc.includes("acné") || lc.includes("imperfection")) keywords.push("acné", "BHA", "salicylique");
    if (lc.includes("rides") || lc.includes("antiâge")) keywords.push("rétinol", "antiâge", "firming");
    if (lc.includes("taches") || lc.includes("pigmentation")) keywords.push("niacinamide", "acide kojique");
  });

  return keywords;
}

// =========================================================================
// =========================================================================
// ACNE FIRST — brand rule from the owner: when someone has active acne AND wants to treat spots, the
// routine must calm the acne first. Treating spots on skin that is still in an inflammatory flare risks
// making it worse. Decided here in code (not left to the model) from the goal chosen in the questionnaire,
// the "active pimples?" answer, the photo scan's acne score, and the follow-up question asked when the
// photos and the answers disagree (lib/skin-profile.ts). Breakouts that come and go but nothing active
// today (owner's decision): an acne-prone routine, without the acne-first rule.
// =========================================================================

const SPOT_RE = /tache|pigment|m[ée]lasma|dark spot/i;

function answerFor(responses: UserResponse[], questionId: string): string {
  return answerOf(responses, questionId);
}

function decideAcnePriority(responses: UserResponse[], scanAcnePct: unknown) {
  const reading = readAcne(responses, scanAcnePct);
  const acneFirst = reading.goalIsAcne || reading.declaredActive || reading.detectedActive;
  return {
    ...reading,
    acneFirst,
    // she asked for something else (spots, glow...) but the acne takes priority
    redirected: acneFirst && !reading.goalIsAcne,
    // specifically: she asked for spots and they are postponed
    spotsDeferred: acneFirst && SPOT_RE.test(reading.goal),
  };
}

// A product whose MAIN purpose (first listed concern) is spots / hyperpigmentation is a spot treatment.
// Products that merely mention spots among other benefits (barrier repair, hydration...) stay.
// Sunscreens are always kept: sun protection stays in an acne routine (it stops marks from getting worse).
function isSpotTreatment(p: EnrichedProduct): boolean {
  if (p.category === "Solaire" || p.skin_concerns.some((c) => /solaire|spf|sun/i.test(c))) return false;
  const main = p.skin_concerns[0];
  return !!main && SPOT_RE.test(main);
}

// =========================================================================
// APPEL 1 : Le Diagnostic Visuel Brut (QWEN VL)
// Run as soon as the photos are taken (analyzeFace), while she answers the questionnaire, then reused by
// analyzeSkin. The result travels through the browser, so it is signed with the server secret and bound to
// the photos: a tampered or foreign result is ignored and the analysis is simply redone.
// =========================================================================

const QWEN_SYSTEM_PROMPT = `Tu es un algorithme dermatologique clinique de haute précision. Analyse ces 3 vues (face, profil gauche, profil droit) du visage.
MISSION : Traque en profondeur les micro-détails cutanés. Cherche les micro-comédons, l'acné kystique, l'hyperpigmentation post-inflammatoire (PIH), le niveau de sébum (réflectance), la desquamation, et la dilatation des pores. Tu dois également estimer avec la plus grande précision l'âge cutané ('estimated_skin_age') en analysant les rides, ridules et la perte d'élasticité.
OBLIGATION : Tu dois générer un champ 'visual_reasoning' où tu décris cliniquement ce que tu vois sur chaque zone (Front, Joues, Menton) avant de donner tes notes.
SIGNAUX D'ALERTE ('medical_flags') : tu ne poses aucun diagnostic médical, tu signales seulement ce qui est nettement visible.
- severe_acne : nombreux boutons profonds ou douloureux, nodules, kystes, ou cicatrices marquées.
- unusual_pigmentation : taches gris-bleu ou brun-noir inhabituelles, en plaques (pommettes, tempes, front, cou), d'aspect granité ou très contrasté, pouvant faire penser à une réaction à des produits éclaircissants. Les simples marques post-inflammatoires ne comptent pas.
- other_lesion : plaie, lésion suintante ou croûteuse, grain de beauté irrégulier.
Sur les peaux foncées, les lésions inflammatoires paraissent brunes ou violacées plutôt que rouges : ne les ignore pas. Si les photos ne permettent pas de conclure (flou, lumière), mets false et explique-le dans 'notes'.
FORMAT JSON ATTENDU :
{
  "visual_reasoning": "...",
  "clinical_observations": ["...", "..."],
  "melanin_phototype": "...",
  "estimated_skin_age": 0,
  "has_glasses": false,
  "metrics": {
    "sebum_level_percentage": 0-100,
    "acne_severity_percentage": 0-100,
    "hydration_barrier_percentage": 0-100,
    "pore_visibility_percentage": 0-100,
    "eye_contour_fatigue_percentage": 0-100
  },
  "medical_flags": {
    "severe_acne": false,
    "unusual_pigmentation": false,
    "other_lesion": false,
    "notes": "..."
  }
}`;

type FaceImages = { front: string; left: string; right: string };

const VISUAL_MODEL = "qwen/qwen3-vl-235b-a22b-instruct";
const ROUTINE_MODEL = "anthropic/claude-opus-4.8";

export type SignedVisualAnalysis = { result: any; signature: string };

// What the customer reads when a step fails; the code is shown with it and logged.
function aiErrorMessage(code: AiErrorCode, step: "visual" | "routine"): string {
  const what = step === "visual" ? "l'analyse de vos photos" : "la création de votre routine";
  if (code === "AI_CREDITS" || code === "AI_BUSY") {
    return "Notre service d'analyse est momentanément saturé. Vos photos et vos réponses sont conservées : réessayez dans quelques instants.";
  }
  if (code === "AI_TIMEOUT") return `${what.charAt(0).toUpperCase()}${what.slice(1)} a pris trop de temps. Vos photos et vos réponses sont conservées : réessayez.`;
  return `Une erreur technique est survenue pendant ${what}. Vos photos et vos réponses sont conservées : réessayez.`;
}

type Failure = { ok: false; code: string; error: string; retryable: boolean };

async function runVisualAnalysis(images: FaceImages): Promise<{ ok: true; result: any } | Failure> {
  const ai = await callOpenRouter(
    "visual",
    {
      model: VISUAL_MODEL,
      max_tokens: 4000,
      temperature: 0, // the same face should get the same reading (client feedback: unstable scores)
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: QWEN_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Vue de face :" },
            { type: "image_url", image_url: { url: images.front } },
            { type: "text", text: "Vue profil gauche :" },
            { type: "image_url", image_url: { url: images.left } },
            { type: "text", text: "Vue profil droit :" },
            { type: "image_url", image_url: { url: images.right } },
          ],
        },
      ],
    },
    { timeoutMs: 90_000 }
  );
  if (!ai.ok) return { ok: false, code: `VISUAL_${ai.code}`, error: aiErrorMessage(ai.code, "visual"), retryable: true };

  const result = parseJsonAnswer(ai.content);
  if (!result || typeof result !== "object") {
    console.error("[Appel 1 Qwen] Parsing error:", ai.content.slice(0, 500));
    return { ok: false, code: "VISUAL_AI_FORMAT", error: aiErrorMessage("AI_FORMAT", "visual"), retryable: true };
  }
  if (result.has_glasses) {
    return {
      ok: false,
      code: "GLASSES",
      error: "Veuillez retirer vos lunettes pour que l'IA puisse analyser précisément votre peau, puis reprenez les photos.",
      retryable: false,
    };
  }
  return { ok: true, result };
}

function signVisual(images: FaceImages, result: unknown): string | null {
  const secret = process.env.SKIN_SCAN_TOKEN;
  if (!secret) return null;
  const photos = createHash("sha256").update(images.front).update("|").update(images.left).update("|").update(images.right).digest("hex");
  return createHmac("sha256", secret).update(photos).update(JSON.stringify(result)).digest("hex");
}

function visualIsAuthentic(images: FaceImages, visual: SignedVisualAnalysis): boolean {
  const expected = signVisual(images, visual?.result);
  if (!expected || typeof visual?.signature !== "string" || visual.signature.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(visual.signature));
}

function checkInputs(images: FaceImages, photoConsent: boolean): Failure | null {
  // The face photos are analysed and stored only with the consent given on the scan intro screen
  if (photoConsent !== true) {
    return { ok: false, code: "CONSENT_MISSING", error: "Votre accord pour l'analyse de vos photos est nécessaire.", retryable: false };
  }
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("Clé API OpenRouter manquante.");
    return { ok: false, code: "CONFIG_MISSING", error: "Le service d'analyse n'est pas disponible pour le moment.", retryable: false };
  }
  if (!images?.front || !images?.left || !images?.right) {
    return { ok: false, code: "PHOTOS_MISSING", error: "Les 3 photos (face, gauche, droite) sont nécessaires : reprenez les photos.", retryable: false };
  }
  return null;
}

type ActionFailure = { success: false; error: string; code: string; retryable: boolean };
function failure(f: Failure): ActionFailure {
  console.error(`[SkinCoach] Scan failed: ${f.code}`);
  return { success: false, error: f.error, code: f.code, retryable: f.retryable };
}

// Started by the flow right after the photos are taken
export async function analyzeFace(
  images: FaceImages,
  photoConsent: boolean
): Promise<{ success: true; visual: SignedVisualAnalysis } | ActionFailure> {
  try {
    const invalid = checkInputs(images, photoConsent);
    if (invalid) return failure(invalid);
    const visual = await runVisualAnalysis(images);
    if (!visual.ok) return failure(visual);
    const signature = signVisual(images, visual.result);
    // without the secret the early result can't be trusted: analyzeSkin will run the analysis itself
    if (!signature) return { success: false, error: "", code: "EARLY_UNSIGNED", retryable: true };
    return { success: true, visual: { result: visual.result, signature } };
  } catch (error: any) {
    console.error("[SkinCoach] Erreur dans analyzeFace:", error);
    return failure({ ok: false, code: "VISUAL_UNKNOWN", error: aiErrorMessage("AI_ERROR", "visual"), retryable: true });
  }
}

// =========================================================================
// MAIN ACTION
// =========================================================================

export async function analyzeSkin(
  images: FaceImages,
  userResponses: UserResponse[],
  photoConsent: boolean,
  earlyVisual?: SignedVisualAnalysis
): Promise<{ success: true; data: SkinAnalysisResult } | ActionFailure> {
  try {
    const invalid = checkInputs(images, photoConsent);
    if (invalid) return failure(invalid);

    // =========================================================================
    // APPEL 0 : Lecture de la configuration IA Admin
    // =========================================================================
    const aiConfig = await fetchAIConfig();
    console.log(`[SkinCoach] Mode IA: ${aiConfig.mode} | Stock seuil: ${aiConfig.min_stock_threshold}`);

    // Audit trail saved with the scan (client feedback: every decision must be explainable afterwards)
    const startedAt = Date.now();
    const log: Record<string, any> = {
      version: "2026-10-12",
      models: { visual: VISUAL_MODEL, routine: ROUTINE_MODEL },
      config: { mode: aiConfig.mode, max_routine_steps: aiConfig.max_routine_steps, min_stock_threshold: aiConfig.min_stock_threshold },
    };

    // APPEL 1 : reuse the analysis started during the questionnaire, or run it now
    let qwenResult: any;
    if (earlyVisual && visualIsAuthentic(images, earlyVisual)) {
      qwenResult = earlyVisual.result;
      log.visual_source = "questionnaire";
      console.log("[SkinCoach] Visual analysis reused from the questionnaire phase");
    } else {
      if (earlyVisual) console.warn("[SkinCoach] Early visual analysis rejected (signature mismatch): running it again");
      const visual = await runVisualAnalysis(images);
      if (!visual.ok) return failure(visual);
      qwenResult = visual.result;
      log.visual_source = "final";
    }

    // =========================================================================
    // SÉCURITÉ : orientation médicale, allergies, grossesse, traitements (décidé en code)
    // =========================================================================
    const answers = {
      allergies: answerFor(userResponses, "q_allergies_list"),
      pregnancy: answerFor(userResponses, "q_pregnancy"),
      dermTreatment: answerFor(userResponses, "q_derm_treatment"),
      lightening: answerFor(userResponses, "q_lightening"),
    };
    const medical = decideMedical(qwenResult.medical_flags, qwenResult.metrics?.acne_severity_percentage, answers);
    if (medical.referral || medical.cautions.length) {
      console.log(
        `[SkinCoach] Medical: referral ${medical.referral} [${medical.reasons.join(" | ")}], ${medical.cautions.length} caution(s), flags ${JSON.stringify(qwenResult.medical_flags || {})}`
      );
    }
    const safety = readSafetyProfile(answers, medical);
    // skin type from the questionnaire: chooses the moisturizer texture
    const profile = readSkinProfile(userResponses);
    log.visual = qwenResult;
    log.medical = medical;
    log.profile = profile;
    const maxSteps = medical.referral ? ESSENTIAL_FUNCTIONS.length : aiConfig.max_routine_steps;
    const budgetAnswer = userResponses.find((r) => typeof r.answer === "string" && r.answer.includes("FCFA"));
    const maxBudget = budgetMax(typeof budgetAnswer?.answer === "string" ? budgetAnswer.answer : "");

    // =========================================================================
    // APPEL 1.5 : RAG — Catalogue filtré selon la config Admin
    // =========================================================================
    const acne = decideAcnePriority(userResponses, qwenResult.metrics?.acne_severity_percentage);
    console.log(
      `[SkinCoach] Acne-first: ${acne.acneFirst} (goal: "${acne.goal}", goal is acne: ${acne.goalIsAcne}, declared active: ${acne.declaredActive}, scan acne: ${acne.scanAcnePct}%, threshold ${ACNE_SCAN_THRESHOLD}%)`
    );

    const observations: string[] = qwenResult.clinical_observations || [];
    const searchSkinType = qwenResult.visual_reasoning || "";
    // acne first: search for acne products and don't let spot keywords steer the search
    const searchConcerns = acne.acneFirst ? ["acné", ...observations.filter((o) => !SPOT_RE.test(o))] : observations;
    const rawCatalog = await fetchProductCatalogForSkin(searchSkinType, searchConcerns, aiConfig);

    // Products she must not be offered are removed before the model sees the catalog:
    // - acne first: spot treatments;
    // - allergies, pregnancy, treatment, lightening products, doctor's opinion: from the INCI list and the
    //   product name (lib/skin-safety.ts). The final routine is checked again before it is shown.
    const excludedProductIds = new Set<string>();
    const safetyExclusions = new Map<string, number>();
    const filterCatalog = (products: EnrichedProduct[]) =>
      products.filter((p) => {
        if (!isFaceCare(p)) return false; // lips, body, accessories
        if (acne.acneFirst && isSpotTreatment(p)) {
          excludedProductIds.add(p.id);
          return false;
        }
        const reason = exclusionReason(p, safety);
        if (reason) safetyExclusions.set(reason, (safetyExclusions.get(reason) || 0) + 1);
        return !reason;
      });

    let productCatalog = filterCatalog(rawCatalog);

    // Manual selection: a step the team filled but where none of its products is left (out of stock, allergy,
    // pregnancy, acne first) is completed with the best in-stock products of that category (owner's decision).
    // The team's selection stays preferred (see the prompt).
    if (aiConfig.mode === "manual_selection" && aiConfig.manual_products_by_step) {
      const emptySteps = Object.entries(aiConfig.manual_products_by_step)
        .filter(([step, ids]) => ids.length > 0 && !productCatalog.some((p) => p.category === step))
        .map(([step]) => step);
      if (emptySteps.length) {
        const topStock = await fetchProductCatalogForSkin(searchSkinType, searchConcerns, { ...aiConfig, mode: "top_stock" });
        const extra = filterCatalog(
          topStock.filter((p) => emptySteps.includes(p.category) && !productCatalog.some((q) => q.id === p.id))
        ).map((p) => ({ ...p, fallback: true }));
        productCatalog = [...productCatalog, ...extra];
        console.log(`[SkinCoach] Manual selection: no product left for [${emptySteps.join(", ")}], ${extra.length} in-stock product(s) added`);
        log.completed_steps = { steps: emptySteps, added: extra.map((p) => p.title) };
      }
    }

    if (excludedProductIds.size) {
      console.log(`[SkinCoach] Acne-first: ${excludedProductIds.size} spot-treatment products excluded from the catalog`);
    }
    if (needsInciCheck(safety) || safety.otherAllergy) {
      console.log(
        `[SkinCoach] Safety: allergies [${safety.allergies.map((a) => a.name).join(", ")}]${safety.otherAllergy ? ` + other "${safety.otherAllergy}"` : ""}, pregnant: ${safety.pregnant}, gentle only: ${safety.gentleOnly}, no depigmenting: ${safety.noDepigmenting} — ${productCatalog.length} products left, excluded ${JSON.stringify(Object.fromEntries(safetyExclusions))}`
      );
    }

    const hasCatalog = productCatalog.length > 0;
    log.acne = acne;
    log.safety = {
      allergies: safety.allergies.map((a) => a.name),
      other_allergy: safety.otherAllergy,
      pregnant: safety.pregnant,
      gentle_only: safety.gentleOnly,
      no_depigmenting: safety.noDepigmenting,
    };
    log.budget_max = Number.isFinite(maxBudget) ? maxBudget : null;
    log.catalog = {
      products: productCatalog.map((p) => p.title),
      excluded: Object.fromEntries(safetyExclusions),
      acne_first_excluded: excludedProductIds.size,
    };

    // Build catalog text with stock hints and full AI descriptions (for precise AI prioritization)
    const miniCatalogText = hasCatalog
      ? productCatalog
          .map(
            (p) =>
              `[${p.category} · fonction : ${FUNCTION_LABEL[productFunction(p)]}${p.texture ? ` · texture : ${TEXTURE_LABEL[p.texture] || p.texture}` : ""}]${p.fallback ? " (complément automatique, hors sélection de l'équipe)" : ""} ${p.title} (medusa_product_id: "${p.id}", stock: ${p.stock_total}, PRIX: ${p.price || 15000} FCFA)\n  COMPOSITION ET FICHE IA: ${(p.description || "Aucune description").replace(/\n/g, "  ")}\n` +
              // a free-text allergy can only be checked by the model, so it gets the full ingredient list
              (safety.otherAllergy ? `  INCI COMPLET: ${p.inci || "inconnu"}\n` : "")
          )
          .join("\n")
      : "Aucun produit spécifique disponible pour le moment.";

    // =========================================================================
    // APPEL 2 : Le Skin Coach Prescripteur (CLAUDE) — Prompt enrichi
    // =========================================================================

    const sanitizedUserResponses = userResponses.map((r) => ({
      ...r,
      answer:
        typeof r.answer === "string"
          ? r.answer
          : "[Image de produit attachée par l'utilisateur]",
    }));

    const userChatJson = JSON.stringify(sanitizedUserResponses);
    const qwenResultJson = JSON.stringify(qwenResult);

    // ---- Catalog constraint based on mode ----
    const modeLabel =
      aiConfig.mode === "top_stock"
        ? "Top Stock (automatique)"
        : "Sélection éditoriale manuelle";

    const budgetLine = Number.isFinite(maxBudget)
      ? `la somme des prix des produits doit rester au maximum à ${fmt(maxBudget)} FCFA`
      : "budget confortable : ce n'est pas une raison pour multiplier les produits";

    const catalogConstraint = hasCatalog
      ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATALOGUE THE WELFARE DISPONIBLE (Mode: ${modeLabel})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Les produits suivants sont TOUS disponibles en stock et compatibles avec ses restrictions. Tu DOIS choisir tes recommandations UNIQUEMENT dans cette liste. Ne propose AUCUN produit hors de cette liste.

${miniCatalogText}

CONSTRUCTION DE LA ROUTINE, DANS CET ORDRE :
1. Sécurité : les produits incompatibles avec ses allergies, sa situation ou son traitement ont déjà été retirés ; ne cherche jamais à contourner une exclusion.
2. Besoins de la peau (observés sur les photos ET déclarés) et objectif de la cliente.
3. FONCTIONS ESSENTIELLES, obligatoires dans toute routine quotidienne : un nettoyant doux, un hydratant sans rinçage (crème, gel-crème ou émulsion, dont la texture convient à son type de peau et à ses différentes zones) et une protection solaire. Un toner, une essence ou un sérum ne remplacent JAMAIS l'hydratant.
4. Soins complémentaires (toner, essence, sérum, traitement) seulement s'ils apportent un bénéfice justifié pour elle, et sans cumuler les actifs irritants (tiens compte de la routine qu'elle utilise déjà). Un budget élevé ne signifie pas plus de produits.
5. Budget : ${budgetLine}. Pour le respecter, retire d'abord les soins complémentaires, puis choisis des références moins chères pour les fonctions essentielles. Ne retire JAMAIS le nettoyant, l'hydratant ou la protection solaire : si même les références les moins chères dépassent le budget, garde-les quand même (un message l'expliquera à la cliente).
- En cas d'hésitation entre deux produits équivalents qui respectent le budget, préfère celui qui a le stock le plus élevé.
- Si le mode est "Sélection éditoriale manuelle", ces produits ont été choisis par notre équipe : leur recommandation est FORTEMENT encouragée. Les produits marqués "complément automatique" ne sont là que parce qu'aucun produit de la sélection n'est disponible pour leur étape : utilise-les seulement pour cette étape.
- Pour chaque étape, copie EXACTEMENT le medusa_product_id du produit choisi.`
      : `Note: Le catalogue produit n'est pas disponible pour le moment. Génère une routine K-Beauty générique et minimaliste (nettoyant, hydratant, protection solaire). Laisse medusa_product_id à null pour chaque étape.`;

    const acneReasons = [
      acne.goalIsAcne ? "son objectif numéro 1 est de combattre l'acné" : "",
      acne.declaredActive ? "elle déclare avoir des boutons actifs ou inflammés en ce moment" : "",
      acne.detectedActive ? `le scan visuel détecte de l'acné active (score ${acne.scanAcnePct}/100)` : "",
    ].filter(Boolean);

    const acnePriorityBlock = acne.acneFirst
      ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 PRIORITÉ ABSOLUE — L'ACNÉ D'ABORD (règle de la marque, validée par sa fondatrice)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Objectif déclaré par la cliente : "${acne.goal}". Constat : ${acneReasons.join(" ; ")}.
On NE traite JAMAIS les taches / l'hyperpigmentation en même temps qu'une acné active : agir sur les taches pendant une poussée inflammatoire risque d'aggraver l'inflammation. La résolution de l'acné passe en premier.
- Ta routine ('routine_steps') vise UNIQUEMENT à calmer et traiter l'acné : nettoyer sans agresser, réguler le sébum, apaiser l'inflammation, réparer la barrière cutanée, hydrater léger.
- N'inclus AUCUN produit dont la fonction principale est d'atténuer, d'éclaircir ou d'unifier les taches (éclaircissants, acide tranexamique, acide kojique, arbutine, vitamine C concentrée, exfoliants intensifs).
- La protection solaire reste possible : présente-la comme une protection de la peau, jamais comme un traitement des taches.
${acne.redirected ? `- Dans 'empathetic_message', explique avec douceur, en une ou deux phrases, que l'on commence par apaiser l'acné avant de s'occuper de ses autres objectifs. Ne promets aucun délai chiffré et ne joue pas au médecin.` : ""}
- Ne rédige PAS toi-même la phrase "prochaine étape pour les taches" : elle est ajoutée automatiquement.`
      : "";

    const safetyLines = [
      safety.allergies.length
        ? `- Allergies / sensibilités déclarées : ${safety.allergies.map((a) => a.name).join(", ")}. Les produits qui en contiennent ont déjà été retirés du catalogue.`
        : "",
      safety.allergies.some((a) => a.name.startsWith("aloé"))
        ? `- Elle réagit à certains extraits de plantes : reste prudent avec les produits très riches en extraits botaniques et privilégie des formules simples.`
        : "",
      safety.otherAllergy
        ? `- Autre allergie déclarée, en texte libre : "${safety.otherAllergy}". Vérifie l'INCI COMPLET de chaque produit et n'en recommande AUCUN qui contient cet ingrédient ou une forme proche. En cas de doute, n'ajoute pas l'étape.`
        : "",
      safety.pregnant
        ? `- Elle est enceinte ou allaite : les rétinoïdes, l'hydroquinone et l'acide salicylique sans rinçage ont déjà été retirés. Propose une routine douce et, dans 'empathetic_message', invite-la avec bienveillance à faire valider sa routine par son médecin ou sa sage-femme.`
        : "",
      safety.gentleOnly && !medical.referral
        ? `- Elle suit un traitement pour la peau : les actifs irritants (rétinoïdes, acides exfoliants, peroxyde de benzoyle) ont été retirés. Propose une routine douce qui accompagne son traitement sans le concurrencer.`
        : "",
      safety.noDepigmenting
        ? `- Aucun actif dépigmentant ne doit être ajouté (produits éclaircissants utilisés actuellement ou pigmentation inhabituelle) : ils ont été retirés du catalogue.`
        : "",
    ].filter(Boolean);
    const safetyBlock = safetyLines.length
      ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ SÉCURITÉ DE LA CLIENTE (prioritaire sur tout le reste)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${safetyLines.join("\n")}`
      : "";

    // ---- Routine plan, set by code: essential functions, moisturizer texture, budget, justified extra ----
    const textures = moisturizerTextures(profile);
    const cheapest = hasCatalog ? cheapestEssentials(productCatalog, { safety, excludedIds: excludedProductIds, profile }) : null;
    const goalForExtra = acne.acneFirst ? "acné" : acne.goal;
    const EXTRA_FOR_GOAL: [RegExp, RegExp][] = [
      [/acn|imperfection/i, /acn|imperfection|pores|s[ée]bum/i],
      [/tache|pigment/i, /tache|pigment|[ée]clat|teint/i],
      [/[aâ]ge|ferme/i, /anti-?[aâ]ge|rides|fermet|[ée]lasticit/i],
      [/hydrat|glow|[ée]clat/i, /hydrat|[ée]clat|barri[èe]re/i],
    ];
    const extraConcern = EXTRA_FOR_GOAL.find(([goal]) => goal.test(goalForExtra))?.[1];
    const extras =
      extraConcern && hasCatalog && !medical.referral
        ? productCatalog
            .filter((p) => productFunction(p) === "other" && (p.skin_concerns || []).some((c) => extraConcern.test(c)))
            .map((p) => p.title)
            .slice(0, 8)
        : [];
    const essentialsOverBudget = !!cheapest && Number.isFinite(maxBudget) && cheapest.total > maxBudget + BUDGET_TOLERANCE;
    const planBlock = hasCatalog
      ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PLAN DE ROUTINE (établi par notre contrôle, à respecter)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Fonctions essentielles, dans cet ordre : nettoyant, hydratant, protection solaire.
- Hydratant pour sa ${profile.label} : texture conseillée ${textures.preferred.map((t) => TEXTURE_LABEL[t]).join(", ")} ; à éviter : ${textures.avoid.map((t) => TEXTURE_LABEL[t]).join(", ")}${profile.dryZones ? " ; pas de crème matifiante ou « oil control » sur des joues qui tiraillent" : ""}. Quand la texture d'un produit n'est pas indiquée, déduis-la de sa fiche.
${cheapest ? `- Combinaison essentielle la moins chère disponible : ${fmt(cheapest.total)} FCFA${essentialsOverBudget ? " : c'est au-dessus de son budget, propose quand même les 3 essentiels, en choisissant les moins chers" : ""}.` : ""}
- Soin complémentaire possible pour son objectif : ${extras.length ? extras.join(" ; ") : "aucun soin ciblé disponible, n'en ajoute pas"}. Seulement si le budget le permet et si c'est justifié pour elle.`
      : "";

    // ---- What the photos show, what she declared, what is uncertain (client feedback: keep them apart) ----
    const m = qwenResult.metrics || {};
    const pct = acne.scanAcnePct;
    const acneSeen =
      pct == null ? "non mesuré"
      : pct >= ACNE_SCAN_THRESHOLD ? "imperfections actives visibles"
      : pct < ACNE_SCAN_LOW ? "pas de bouton actif visible"
      : "quelques imperfections légères";
    const followUp = [FOLLOWUP_ACNE, FOLLOWUP_SPOTS]
      .map((q) => ({ q: q.text, a: answerOf(userResponses, q.id) }))
      .find((x) => x.a);
    const activeAnswer = answerOf(userResponses, "q_active_acne");
    const synthesisBlock = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYNTHÈSE : OBSERVÉ, DÉCLARÉ, INCERTAIN (établie par notre contrôle)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Observé sur les photos : imperfections ${pct ?? "?"}/100 (${acneSeen}), sébum ${m.sebum_level_percentage ?? "?"}/100, hydratation ${m.hydration_barrier_percentage ?? "?"}/100.
- Déclaré par la cliente : objectif « ${acne.goal} »${activeAnswer ? ` ; boutons actifs : « ${activeAnswer} »` : ""} ; après le nettoyage : « ${answerOf(userResponses, "q_post_wash")} » ; à midi : « ${answerOf(userResponses, "q_midday_behavior")} » ; réaction aux nouveaux produits : « ${answerOf(userResponses, "q_sensitivity")} ».
${followUp ? `- Précision demandée : « ${followUp.q} » → réponse : « ${followUp.a} ».` : ""}
${acne.acneProne ? "- Peau sujette aux poussées : rien d'actif aujourd'hui. Routine qui prévient les imperfections, sans traiter une acné absente." : ""}
${acne.uncertain ? `- Incertain : ${acne.uncertain}. Présente-le comme une hypothèse, sans conclure.` : ""}
CONSIGNE : dans 'empathetic_message', distingue clairement ce que montrent les photos, ce qu'elle a déclaré et ce qui reste incertain. Ne confirme jamais une acné active que les photos ne montrent pas sans sa confirmation, et tiens compte des imperfections visibles même si elle ne les a pas mentionnées.`;

    const medicalBlock = medical.referral
      ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🩺 AVIS DERMATOLOGIQUE RECOMMANDÉ (décidé par notre contrôle, non négociable)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Constat : ${medical.reasons.join(" ; ")}.
- Propose UNIQUEMENT les 3 fonctions essentielles (nettoyant, hydratant, protection solaire), avec les produits les plus doux du catalogue.
- Dans 'empathetic_message', explique avec bienveillance que ces signes justifient l'avis d'un dermatologue et qu'une routine cosmétique ne remplace pas une consultation. Ne pose aucun diagnostic, ne nomme aucune maladie, ne promets aucun résultat.`
      : "";

    const claudeSystemPrompt = `Tu es le 'Skin Coach VIP' de la marque K-Beauty premium 'The Welfare', basée en Afrique (Cameroun). Tu es l'expert bienveillant qui va concevoir la routine de soin idéale pour chaque cliente.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIAGNOSTIC CLINIQUE VISUEL (données de notre scanner IA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${qwenResultJson}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESSENTI ET BESOINS DÉCLARÉS PAR LA CLIENTE (questionnaire)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${userChatJson}

${catalogConstraint}

${planBlock}

${synthesisBlock}

${safetyBlock}

${medicalBlock}

${acnePriorityBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TA MISSION (4 points obligatoires)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. MESSAGE EMPATHIQUE ('empathetic_message') :
   Rédige un message extrêmement humain, chaleureux et bienveillant, en vouvoyant la cliente.
   Ce message DOIT faire le lien entre ce que voit objectivement l'IA (métriques visuelles) et ce que ressent subjectivement la cliente (ses déclarations dans le questionnaire).
   Il doit valider ses inquiétudes et la rassurer avec bienveillance, sans promesse excessive.

2. TYPE DE PEAU FINAL ('final_skin_type') :
   Détermine le type de peau avec nuance (ex: "Peau Mixte à tendance déshydratée").
   RÈGLE ABSOLUE : Croise TOUJOURS les métriques visuelles avec le RESSENTI DÉCLARÉ.
   Le ressenti physique et émotionnel de la cliente prime sur les seules mesures visuelles.

3. ÂGE CUTANÉ ('estimated_skin_age') :
   Transmets l'estimation fournie par le scanner visuel.

4. ROUTINE K-BEAUTY SUR-MESURE ('routine_steps') :
   Construis une routine respectant SCRUPULEUSEMENT les règles ci-dessous.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RÈGLES D'EXPERTISE K-BEAUTY — THE WELFARE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌿 SKINIMALISME (${maxSteps} étapes MAXIMUM) :
   Le tableau "routine_steps" doit contenir MAXIMUM ${maxSteps} éléments.
   Les 3 fonctions essentielles d'abord ; un soin complémentaire seulement s'il apporte un bénéfice justifié.

🚨 SIGNES PRÉOCCUPANTS :
   Si tu observes d'autres signes préoccupants (rosacée, dermatite, irritation importante…), reste sur les fonctions essentielles et conseille dans 'empathetic_message' l'avis d'un dermatologue, sans poser de diagnostic. Ne joue pas au médecin.

🚫 ANTI-REDONDANCE :
   Évite les doublons fonctionnels. Si un toner hydrate déjà bien, n'ajoute pas d'essence par-dessus.

🎓 PÉDAGOGIE & TOLÉRANCE :
   Ne sois JAMAIS dictatorial sur les ingrédients actifs. Présente-les comme des OPTIONS selon la tolérance.
   ❌ À FUIR : "Il vous faut ABSOLUMENT un sérum à la niacinamide."
   ✅ BON : "Je vous recommande un sérum traitant. Selon votre tolérance, il peut contenir de la niacinamide ou de la vitamine C pour unifier le teint."

🔗 COHÉRENCE & JUSTIFICATION :
   Dans 'explanation_for_client', justifie TOUJOURS pourquoi CE produit précis a été sélectionné pour ELLE aujourd'hui, y compris sa texture.
   Fais le lien entre ses préoccupations spécifiques (acné, pores, éclat...) et les bénéfices du produit choisi.

🌍 CONTEXTE AFRICAIN :
   Tiens compte du climat chaud et humide d'Afrique centrale. Privilégie les textures légères en journée, sans laisser de zones sèches inconfortables.
   Si le phototype est foncé (Fitzpatrick IV-VI), insiste sur la protection solaire et la prévention des taches.

IMPORTANT : Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après.

FORMAT JSON ATTENDU :
{
  "final_skin_type": "...",
  "estimated_skin_age": 0,
  "empathetic_message": "...",
  "routine_steps": [
    {
      "step_number": 1,
      "step_name": "Nettoyant doux",
      "explanation_for_client": "L'explication nuancée, justifiant le choix du produit...",
      "medusa_product_id": "prod_01H8X...",
      "product_name": "Nom du produit"
    }
  ]
}`;

    const claudeMessages: Record<string, unknown>[] = [
      { role: "system", content: claudeSystemPrompt },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Génère la routine VIP finale en te basant sur le diagnostic et les images des produits s'il y en a.",
          },
          ...userResponses
            .filter((r) => typeof r.answer !== "string" && r.answer.type === "image")
            .map((r) => ({
              type: "image_url",
              image_url: { url: (r.answer as { type: "image"; base64: string }).base64 },
            })),
        ],
      },
    ];
    const claudeRequest = (messages: Record<string, unknown>[]) => ({
      model: ROUTINE_MODEL,
      max_tokens: 4000,
      response_format: { type: "json_object" },
      messages,
    });

    const ai = await callOpenRouter("routine", claudeRequest(claudeMessages), { timeoutMs: 150_000 });
    if (!ai.ok) return failure({ ok: false, code: `ROUTINE_${ai.code}`, error: aiErrorMessage(ai.code, "routine"), retryable: true });
    let parsed = parseJsonAnswer(ai.content);
    log.routine_answer = ai.content.slice(0, 20_000);
    if (!parsed || typeof parsed !== "object") {
      console.error("[Appel 2 Claude] Parsing error:", ai.content.slice(0, 500));
      return failure({ ok: false, code: "ROUTINE_AI_FORMAT", error: aiErrorMessage("AI_FORMAT", "routine"), retryable: true });
    }

    // =========================================================================
    // CONTRÔLE FINAL (en code, indépendant du texte du modèle) — lib/skin-routine.ts
    // =========================================================================
    const notices: SkinNotice[] = [];
    let routineSteps: CheckedStep[];
    if (hasCatalog) {
      const checkOpts = { safety, excludedIds: excludedProductIds, maxSteps, budgetMax: maxBudget, essentialsOnly: medical.referral, profile };
      const logCheck = (label: string, c: RoutineCheck) =>
        console.log(
          `[SkinCoach] Routine check (${label}): ${c.steps.length} step(s), total ${c.total} FCFA, budget ${Number.isFinite(c.budgetMax) ? c.budgetMax : "none"}, missing [${c.missing.join(", ")}], unavailable [${c.unavailable.join(", ")}]${c.dropped.length ? `, dropped: ${c.dropped.join(" | ")}` : ""}`
        );
      let check = checkRoutine(parsed.routine_steps || parsed.kbeauty_routine || [], productCatalog, checkOpts);
      log.check_model = { dropped: check.dropped, missing: check.missing, unavailable: check.unavailable, texture: check.textureIssue, total: check.total };
      logCheck("model", check);
      if (check.dropped.some((d) => d.includes("BLOQUÉ"))) {
        console.error("[SkinCoach] Routine check: the model chose a product the safety filter should have removed");
      }

      // One correction round: the model is told exactly what is wrong and fixes its own routine
      const problems = routineProblems(check);
      if (problems.length) {
        const fix = await callOpenRouter(
          "routine-fix",
          claudeRequest([
            ...claudeMessages,
            { role: "assistant", content: ai.content },
            {
              role: "user",
              content: `Notre contrôle qualité a détecté ces problèmes dans ta routine :\n- ${problems.join("\n- ")}\nCorrige-les en gardant ce qui était valide, et renvoie le JSON complet au même format.`,
            },
          ]),
          { timeoutMs: 150_000, attempts: 2 }
        );
        const fixed = fix.ok ? parseJsonAnswer(fix.content) : null;
        log.correction = { problems, answer: fix.ok ? fix.content.slice(0, 20_000) : `error ${fix.code}` } as Record<string, any>;
        if (fixed && typeof fixed === "object") {
          const fixedCheck = checkRoutine(fixed.routine_steps || fixed.kbeauty_routine || [], productCatalog, checkOpts);
          logCheck("after correction", fixedCheck);
          if (fixedCheck.steps.length && routineProblems(fixedCheck).length <= problems.length) {
            check = fixedCheck;
            parsed = { ...parsed, ...fixed };
            log.correction.accepted = true;
          }
        } else {
          console.warn(`[SkinCoach] Routine check: correction round failed (${fix.ok ? "unreadable answer" : fix.code})`);
        }
      }

      // Last resort: an essential function still missing is added by code
      routineSteps = check.steps;
      if (check.missing.length) {
        const completed = addMissingEssentials(check, productCatalog, { safety, excludedIds: excludedProductIds, profile });
        routineSteps = completed.steps;
        if (completed.added.length) log.added_by_code = completed.added;
        if (completed.added.length) console.warn(`[SkinCoach] Routine check: essential step(s) added by code: ${completed.added.join(", ")}`);
      }

      // Budget and moisturizer texture settled in code: as close as possible to the model's choice, within the
      // budget; when no complete routine fits, the cheapest one (owner's decision)
      const fitted = fitEssentials(routineSteps, productCatalog, { safety, excludedIds: excludedProductIds, budgetMax: maxBudget, profile });
      if (fitted.changed.length) log.adjusted_by_code = fitted.changed;
      if (fitted.changed.length) console.log(`[SkinCoach] Routine check: essentials adjusted by code: ${fitted.changed.join(" | ")}`);
      routineSteps = fitted.steps;

      // Final safety gate, on exactly what will be shown
      routineSteps = routineSteps.filter((s) => {
        const p = productCatalog.find((c) => c.id === s.medusa_product_id);
        const reason = p ? exclusionReason(p, safety) : "hors catalogue";
        if (reason) console.error(`[SkinCoach] Final gate blocked ${s.product_name}: ${reason}`);
        if (reason) (log.final_gate_blocked ||= []).push(`${s.product_name}: ${reason}`);
        return !reason;
      });
      routineSteps.forEach((s, i) => { s.step_number = i + 1; });

      const total = routineTotal(routineSteps, productCatalog);
      if (Number.isFinite(maxBudget) && total > maxBudget + BUDGET_TOLERANCE) {
        notices.push({
          kind: "budget",
          text: `Une routine complète (nettoyant, hydratant et protection solaire) revient au minimum à ${fmt(total)} FCFA dans notre sélection, au-dessus de votre budget (jusqu'à ${fmt(maxBudget)} FCFA). Nous vous proposons la combinaison la plus économique plutôt que de retirer un de ces trois soins : vous restez libre de commencer par ceux de votre choix.`,
        });
      }
      for (const fn of check.unavailable) {
        notices.push({
          kind: "missing",
          text: `Nous n'avons pas actuellement ${withArticle(fn, "de")} compatible avec vos réponses. Demandez conseil en boutique pour compléter votre routine.`,
        });
      }
    } else {
      routineSteps = (parsed.routine_steps || parsed.kbeauty_routine || []).slice(0, maxSteps);
    }

    if (medical.referral) {
      notices.unshift({
        kind: "referral",
        text: `Nous vous conseillons de consulter un dermatologue : ${medical.reasons.join(" ; ")}. Une routine cosmétique ne remplace pas un avis médical. En attendant, nous vous proposons uniquement des soins essentiels et doux.`,
      });
    }
    for (const caution of medical.cautions) {
      notices.push({ kind: "caution", text: `${caution.charAt(0).toUpperCase()}${caution.slice(1)}.` });
    }

    const finalResult: SkinAnalysisResult = {
      final_skin_type: parsed.skin_type_detected || parsed.final_skin_type,
      estimated_skin_age: parsed.estimated_skin_age,
      empathetic_message: parsed.skin_coach_intro || parsed.empathetic_message,
      kbeauty_routine: routineSteps as SkinAnalysisResult["kbeauty_routine"],
      metrics: qwenResult.metrics,
      melanin_phototype: qwenResult.melanin_phototype,
      ...(notices.length ? { notices } : {}),
    };

    // She asked for spots and they are postponed: say so in plain words, deterministically
    // (not left to the model), and tell her what to do next.
    if (acne.spotsDeferred) {
      finalResult.empathetic_message = `${finalResult.empathetic_message || ""}\n\n💡 Pour vos taches : nous commençons par apaiser votre acné, car traiter les taches sur une peau en poussée risque d'aggraver l'inflammation. Une fois votre peau calmée, refaites votre diagnostic pour traiter vos taches.`.trim();
    }

    // Silent save to Medusa backend
    try {
      const medusaBackendUrl =
        process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
      // The diagnostic (with the face photos) is saved by this server only: the route needs the shared
      // server token. It is saved unattached; the logged-in customer claims it from the result page.
      const saveRes = await fetch(`${medusaBackendUrl}/store/skin-scans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key":
            process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
          "x-skin-scan-token": process.env.SKIN_SCAN_TOKEN || "",
        },
        body: JSON.stringify({
          final_skin_type: finalResult.final_skin_type,
          estimated_skin_age: finalResult.estimated_skin_age,
          melanin_phototype:
            finalResult.melanin_phototype || qwenResult.melanin_phototype,
          concerns: qwenResult.clinical_observations || [],
          metrics: finalResult.metrics,
          routine: finalResult.kbeauty_routine,
          images: {
            front: images.front,
            left: images.left,
            right: images.right,
          },
          qwen_raw_summary:
            qwenResult.visual_reasoning ||
            JSON.stringify(qwenResult.clinical_observations),
          // the notices (doctor's opinion, budget, missing step) are kept with the message for the admin
          claude_raw_summary: finalResult.empathetic_message || "",
          notices,
          // the questionnaire as answered (product photos left out) and the audit trail
          responses: userResponses.map((r) => ({ questionId: r.questionId, answer: typeof r.answer === "string" ? r.answer : "[photo de produit]" })),
          analysis_log: { ...log, duration_ms: Date.now() - startedAt },
        }),
      });
      if (saveRes.ok) {
        const saved = await saveRes.json().catch(() => null);
        if (saved?.scan?.id) finalResult.scan_id = saved.scan.id;
      } else {
        console.error(`[SkinCoach] Diagnostic non enregistré (HTTP ${saveRes.status}) — SKIN_SCAN_TOKEN configuré des deux côtés ?`);
      }
    } catch (logError) {
      console.error("[SkinCoach] Erreur lors de la journalisation du scan :", logError);
    }

    return { success: true, data: finalResult };
  } catch (error: any) {
    console.error("[SkinCoach] Erreur critique dans analyzeSkin:", error);
    return failure({ ok: false, code: "UNKNOWN", error: "Une erreur technique est survenue. Vos photos et vos réponses sont conservées : réessayez.", retryable: true });
  }
}
