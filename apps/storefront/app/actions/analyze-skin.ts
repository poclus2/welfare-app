"use server";

import { exclusionReason, needsInciCheck, readSafetyProfile } from "@/lib/skin-safety";

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

export type SkinAnalysisResult = {
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
// ACNE FIRST — brand rule from the owner: when someone has active acne AND wants to treat spots, the
// routine must calm the acne first. Treating spots on skin that is still in an inflammatory flare risks
// making it worse. Decided here in code (not left to the model) from three signals: the goal chosen in
// the questionnaire, the "active pimples?" answer, and the photo scan's acne score.
// =========================================================================

// acne_severity_percentage (0-100, from the visual scan) at or above which acne counts as active.
// A first guess: tune it against real scans (the decision is logged as "[SkinCoach] Acne-first").
const ACNE_SCAN_THRESHOLD = 30;

const SPOT_RE = /tache|pigment|m[ée]lasma|dark spot/i;
const ACNE_GOAL_RE = /acn[ée]|imperfection/i;

function answerFor(responses: UserResponse[], questionId: string): string {
  const r = responses.find((x) => x.questionId === questionId);
  return typeof r?.answer === "string" ? r.answer : "";
}

function decideAcnePriority(responses: UserResponse[], scanAcnePct: unknown) {
  const goal = answerFor(responses, "q_main_goal");
  const goalIsAcne = ACNE_GOAL_RE.test(goal);
  const declaredActive = /^oui/i.test(answerFor(responses, "q_active_acne").trim());
  const pct = Number(scanAcnePct);
  const detectedActive = Number.isFinite(pct) && pct >= ACNE_SCAN_THRESHOLD;
  const acneFirst = goalIsAcne || declaredActive || detectedActive;
  return {
    acneFirst,
    // she asked for something else (spots, glow...) but the acne takes priority
    redirected: acneFirst && !goalIsAcne,
    // specifically: she asked for spots and they are postponed
    spotsDeferred: acneFirst && SPOT_RE.test(goal),
    goal,
    goalIsAcne,
    declaredActive,
    detectedActive,
    scanAcnePct: Number.isFinite(pct) ? pct : null,
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
// MAIN ACTION
// =========================================================================

export async function analyzeSkin(
  images: { front: string; left: string; right: string },
  userResponses: UserResponse[],
  photoConsent: boolean
): Promise<{ success: boolean; data?: SkinAnalysisResult; error?: string }> {
  try {
    // The face photos are analysed and stored only with the consent given on the scan intro screen
    if (photoConsent !== true) {
      return { success: false, error: "Votre accord pour l'analyse de vos photos est nécessaire." };
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.error("Clé API OpenRouter manquante.");
      return { success: false, error: "Configuration serveur incomplète (Clé API manquante)." };
    }

    if (!images.front || !images.left || !images.right) {
      return { success: false, error: "Les 3 angles d'images (Face, Gauche, Droite) sont requis." };
    }

    // =========================================================================
    // APPEL 0 : Lecture de la configuration IA Admin
    // =========================================================================
    const aiConfig = await fetchAIConfig();
    console.log(`[SkinCoach] Mode IA: ${aiConfig.mode} | Stock seuil: ${aiConfig.min_stock_threshold}`);

    // =========================================================================
    // APPEL 1 : Le Diagnostic Visuel Brut (QWEN VL)
    // =========================================================================
    const qwenSystemPrompt = `Tu es un algorithme dermatologique clinique de haute précision. Analyse ces 3 vues (face, profil gauche, profil droit) du visage.
MISSION : Traque en profondeur les micro-détails cutanés. Cherche les micro-comédons, l'acné kystique, l'hyperpigmentation post-inflammatoire (PIH), le niveau de sébum (réflectance), la desquamation, et la dilatation des pores. Tu dois également estimer avec la plus grande précision l'âge cutané ('estimated_skin_age') en analysant les rides, ridules et la perte d'élasticité.
OBLIGATION : Tu dois générer un champ 'visual_reasoning' où tu décris cliniquement ce que tu vois sur chaque zone (Front, Joues, Menton) avant de donner tes notes.
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
  }
}`;

    const qwenResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://thewelfare.com",
        "X-Title": "The Welfare Skin Coach",
      },
      body: JSON.stringify({
        model: "qwen/qwen3-vl-235b-a22b-instruct",
        max_tokens: 4000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: qwenSystemPrompt },
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
      }),
    });

    if (!qwenResponse.ok) {
      console.error(`[Appel 1 Qwen] Erreur:`, await qwenResponse.text());
      return { success: false, error: "Échec de l'analyse visuelle par l'IA." };
    }

    const qwenData = await qwenResponse.json();
    const qwenRawContent = qwenData.choices?.[0]?.message?.content;
    const cleanedQwenContent =
      qwenRawContent?.replace(/```json/gi, "")?.replace(/```/g, "")?.trim() || "{}";

    let qwenResult;
    try {
      qwenResult = JSON.parse(cleanedQwenContent);
    } catch (e) {
      console.error("[Appel 1 Qwen] Parsing error:", qwenRawContent);
      return { success: false, error: "Erreur de formatage de l'analyse visuelle." };
    }

    if (qwenResult.has_glasses) {
      return {
        success: false,
        error:
          "Veuillez retirer vos lunettes pour que l'IA puisse analyser précisément votre peau et recommencez.",
      };
    }

    // =========================================================================
    // APPEL 1.5 : RAG — Catalogue filtré selon la config Admin
    // =========================================================================
    const acne = decideAcnePriority(userResponses, qwenResult.metrics?.acne_severity_percentage);
    console.log(
      `[SkinCoach] Acne-first: ${acne.acneFirst} (goal: "${acne.goal}", goal is acne: ${acne.goalIsAcne}, declared active: ${acne.declaredActive}, scan acne: ${acne.scanAcnePct}%, threshold ${ACNE_SCAN_THRESHOLD}%)`
    );

    const observations: string[] = qwenResult.clinical_observations || [];
    const rawCatalog = await fetchProductCatalogForSkin(
      qwenResult.visual_reasoning || "",
      // acne first: search for acne products and don't let spot keywords steer the search
      acne.acneFirst ? ["acné", ...observations.filter((o) => !SPOT_RE.test(o))] : observations,
      aiConfig
    );

    // acne first: spot treatments are kept out of what the model can choose from
    const excludedProductIds = new Set<string>();
    const acneCatalog = acne.acneFirst
      ? rawCatalog.filter((p) => {
          if (isSpotTreatment(p)) {
            excludedProductIds.add(p.id);
            return false;
          }
          return true;
        })
      : rawCatalog;
    if (excludedProductIds.size) {
      console.log(`[SkinCoach] Acne-first: ${excludedProductIds.size} spot-treatment products excluded from the catalog`);
    }

    // Allergies and pregnancy: unsafe products are removed here, from their INCI list (lib/skin-safety.ts)
    const safety = readSafetyProfile(answerFor(userResponses, "q_allergies_list"), answerFor(userResponses, "q_pregnancy"));
    const safetyExclusions = new Map<string, number>();
    const productCatalog = acneCatalog.filter((p) => {
      const reason = exclusionReason(p, safety);
      if (reason) safetyExclusions.set(reason, (safetyExclusions.get(reason) || 0) + 1);
      return !reason;
    });
    if (needsInciCheck(safety) || safety.otherAllergy) {
      console.log(
        `[SkinCoach] Safety: allergies [${safety.allergies.map((a) => a.name).join(", ")}]${safety.otherAllergy ? ` + other "${safety.otherAllergy}"` : ""}, pregnant: ${safety.pregnant} — ${acneCatalog.length - productCatalog.length}/${acneCatalog.length} products excluded ${JSON.stringify(Object.fromEntries(safetyExclusions))}`
      );
    }

    const hasCatalog = productCatalog.length > 0;

    // Build catalog text with stock hints and full AI descriptions (for precise AI prioritization)
    const miniCatalogText = hasCatalog
      ? productCatalog
          .map(
            (p) =>
              `[${p.category}] ${p.title} (medusa_product_id: "${p.id}", stock: ${p.stock_total}, PRIX: ${p.price || 15000} FCFA)\n  COMPOSITION ET FICHE IA: ${(p.description || "Aucune description").replace(/\n/g, "  ")}\n` +
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

    const catalogConstraint = hasCatalog
      ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATALOGUE THE WELFARE DISPONIBLE (Mode: ${modeLabel})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Les produits suivants sont TOUS disponibles en stock. Tu DOIS choisir tes recommandations UNIQUEMENT dans cette liste. Ne propose AUCUN produit hors de cette liste.

${miniCatalogText}

RÈGLE DE PRIORISATION (The Welfare Strategy) & BUDGET :
- BUDGET (RÈGLE STRICTE) : Vérifie le budget souhaité par la cliente dans le questionnaire. La somme totale des prix des produits recommandés NE DOIT SOUS AUCUN PRÉTEXTE dépasser ce budget.
  - Si le budget est limité (ex: 25k-35k FCFA), tu DOIS impérativement supprimer des étapes (par exemple, retirer le toner ou le sérum) pour ne garder que l'essentiel (ex: Nettoyant + Hydratant/Solaire) afin de rester strictement sous le budget. Le respect du budget est ABSOLU et prioritaire sur le fait d'avoir une routine longue.
- En cas d'hésitation entre deux produits cutanément équivalents et qui respectent le budget, donne TOUJOURS la priorité au produit avec le stock le plus élevé (indiqué entre parenthèses après "stock:").
- Si le mode est "Sélection éditoriale manuelle", ces produits ont été choisis par notre équipe : leur recommandation est FORTEMENT encouragée si pertinente au budget.
- Pour chaque étape, copie EXACTEMENT le medusa_product_id du produit choisi.
- Si aucun produit de la liste ne convient ou ne rentre dans le budget pour une étape, N'AJOUTE PAS cette étape (skinimalisme).`
      : `Note: Le catalogue produit n'est pas disponible pour le moment. Génère une routine K-Beauty générique et minimaliste (3 à 5 étapes maximum). Laisse medusa_product_id à null pour chaque étape.`;

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
    ].filter(Boolean);
    const safetyBlock = safetyLines.length
      ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ SÉCURITÉ DE LA CLIENTE (prioritaire sur tout le reste)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${safetyLines.join("\n")}`
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

${safetyBlock}

${acnePriorityBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TA MISSION (4 points obligatoires)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. MESSAGE EMPATHIQUE ('empathetic_message') :
   Rédige un message extrêmement humain, chaleureux et bienveillant, en vouvoyant la cliente.
   Ce message DOIT faire le lien entre ce que voit objectivement l'IA (métriques visuelles) et ce que ressent subjectivement la cliente (ses déclarations dans le questionnaire).
   Il doit valider ses inquiétudes et la rassurer avec bienveillance.

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

🌿 SKINIMALISME STRICT & BUDGET (${aiConfig.max_routine_steps} étapes MAXIMUM) :
   RÈGLE ABSOLUE : Tu ne DOIS SOUS AUCUN PRÉTEXTE dépasser le budget de la cliente, même si cela implique de ne recommander que 2 produits.
   Le tableau "routine_steps" doit contenir MAXIMUM ${aiConfig.max_routine_steps} éléments.
   Ne surcharge JAMAIS la routine. Le respect strict du budget passe avant tout.
   Si le budget ne permet que 2 ou 3 produits (ex: 25k-35k FCFA), propose uniquement 2 produits. Qualité et respect du budget > Quantité.

🚨 CAS CLINIQUES SÉVÈRES (Acné grave, pathologies) :
   Si le diagnostic révèle une pathologie cutanée poussée (acné kystique sévère, rosacée, dermatite, etc.), propose une routine EXTRÊMEMENT minimaliste (apaisement et barrière uniquement) et recommande IMPÉRATIVEMENT dans ton 'empathetic_message' de consulter un spécialiste ou un dermatologue. Ne joue pas au médecin.

🚫 ANTI-REDONDANCE :
   Évite les doublons fonctionnels. Si un toner hydrate déjà bien, n'ajoute pas d'essence par-dessus.

🎓 PÉDAGOGIE & TOLÉRANCE :
   Ne sois JAMAIS dictatorial sur les ingrédients actifs. Présente-les comme des OPTIONS selon la tolérance.
   ❌ À FUIR : "Il vous faut ABSOLUMENT un sérum à la niacinamide."
   ✅ BON : "Je vous recommande un sérum traitant. Selon votre tolérance, il peut contenir de la niacinamide ou de la vitamine C pour unifier le teint."

🔗 COHÉRENCE & JUSTIFICATION :
   Dans 'explanation_for_client', justifie TOUJOURS pourquoi CE produit précis a été sélectionné pour ELLE aujourd'hui.
   Fais le lien entre ses préoccupations spécifiques (acné, pores, éclat...) et les bénéfices du produit choisi.

🌍 CONTEXTE AFRICAIN :
   Tiens compte du climat chaud et humide d'Afrique centrale. Privilégie les textures légères en journée.
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
      "step_name": "Double Nettoyage - Huile",
      "explanation_for_client": "L'explication nuancée, justifiant le choix du produit...",
      "medusa_product_id": "prod_01H8X...",
      "product_name": "Nom du produit"
    }
  ]
}`;

    const claudeResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://thewelfare.com",
          "X-Title": "The Welfare Skin Coach",
        },
        body: JSON.stringify({
          model: "anthropic/claude-opus-4.8",
          max_tokens: 4000,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: claudeSystemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Génère la routine VIP finale en te basant sur le diagnostic et les images des produits s'il y en a.",
                },
                ...userResponses
                  .filter(
                    (r) => typeof r.answer !== "string" && r.answer.type === "image"
                  )
                  .map((r) => ({
                    type: "image_url",
                    image_url: {
                      url: (r.answer as { type: "image"; base64: string }).base64,
                    },
                  })),
              ],
            },
          ],
        }),
      }
    );

    if (!claudeResponse.ok) {
      console.error(`[Appel 2 Claude] Erreur:`, await claudeResponse.text());
      return { success: false, error: "Échec de la prescription par le Skin Coach." };
    }

    const claudeData = await claudeResponse.json();
    const claudeRawContent = claudeData.choices?.[0]?.message?.content;
    const cleanedClaudeContent =
      claudeRawContent?.replace(/```json/gi, "")?.replace(/```/g, "")?.trim() || "{}";

    let finalResult: SkinAnalysisResult;
    try {
      const parsed = JSON.parse(cleanedClaudeContent);

      // Normalize: support both routine_steps (new) and kbeauty_routine (legacy)
      let routineSteps = parsed.routine_steps || parsed.kbeauty_routine || [];

      // Only products from the catalog given to the model may be recommended (in manual mode, the
      // admin's per-step selection): the prompt asks for it, this enforces it.
      if (hasCatalog) {
        const allowedIds = new Set(productCatalog.map((p) => p.id));
        const offCatalog = routineSteps.filter((s: any) => !allowedIds.has(s.medusa_product_id));
        if (offCatalog.length) {
          console.warn(
            `[SkinCoach] ${offCatalog.length} step(s) dropped: product not in the catalog (${offCatalog.map((s: any) => s.medusa_product_id || s.product_name).join(", ")})`
          );
          routineSteps = routineSteps.filter((s: any) => allowedIds.has(s.medusa_product_id));
          routineSteps.forEach((s: any, i: number) => { s.step_number = i + 1; });
        }
      }

      // Acne first: whatever the model returned, a spot treatment never ends up in the routine
      if (acne.acneFirst && excludedProductIds.size > 0) {
        routineSteps = routineSteps.filter((s: any) => !excludedProductIds.has(s.medusa_product_id));
        routineSteps.forEach((s: any, i: number) => { s.step_number = i + 1; });
      }

      // Sécurité absolue : forcer la limite du tableau
      if (routineSteps.length > aiConfig.max_routine_steps) {
        routineSteps = routineSteps.slice(0, aiConfig.max_routine_steps);
      }

      // ─── FILTRAGE BUDGET STRICT EN TYPESCRIPT ───
      try {
        let maxBudget = Infinity;
        const budgetQuestion = userResponses.find(r => r.answer && typeof r.answer === 'string' && r.answer.includes("FCFA"));
        if (budgetQuestion) {
          const ans = String(budgetQuestion.answer);
          if (ans.includes("25k")) maxBudget = 35000;
          else if (ans.includes("35k")) maxBudget = 45000;
          else if (ans.includes("50k")) maxBudget = Infinity;
        }

        if (maxBudget < Infinity && routineSteps.length > 0) {
          const prices = new Map<string, number>();
          (hasCatalog ? productCatalog : []).forEach(p => {
            const price = p.price || 15000;
            prices.set(p.id, price);
          });

          const getImportance = (name: string) => {
            const n = name.toLowerCase();
            if (n.includes("solaire") || n.includes("spf")) return 1;
            if (n.includes("nettoyant") || n.includes("cleanser") || n.includes("démaquillant")) return 2;
            if (n.includes("hydratant") || n.includes("crème") || n.includes("cream")) return 3;
            if (n.includes("sérum") || n.includes("serum") || n.includes("traitement") || n.includes("ampoule")) return 4;
            return 5;
          };

          const scored = routineSteps.map((step: any, idx: number) => ({
            step,
            idx,
            imp: getImportance(step.step_name || ""),
            price: step.medusa_product_id ? (prices.get(step.medusa_product_id) || 0) : 0
          }));

          scored.sort((a: any, b: any) => a.imp - b.imp);

          let total = 0;
          const kept = new Set<number>();
          for (const item of scored) {
            // Tolérance de 5000 FCFA
            if (total + item.price <= maxBudget + 5000) {
              kept.add(item.idx);
              total += item.price;
            }
          }

          if (kept.size === 0 && scored.length > 0) {
            kept.add(scored[0].idx); // Au moins 1 produit
          }

          routineSteps = routineSteps.filter((_: any, i: number) => kept.has(i));
          
          // Re-numéroter les étapes proprement
          routineSteps.forEach((s: any, i: number) => { s.step_number = i + 1; });
        }
      } catch (err) {
        console.error("Erreur filtrage budget:", err);
      }

      finalResult = {
        final_skin_type: parsed.skin_type_detected || parsed.final_skin_type,
        estimated_skin_age: parsed.estimated_skin_age,
        empathetic_message: parsed.skin_coach_intro || parsed.empathetic_message,
        kbeauty_routine: routineSteps,
        metrics: qwenResult.metrics,
        melanin_phototype: qwenResult.melanin_phototype,
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
            claude_raw_summary: finalResult.empathetic_message || "",
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
    } catch (e) {
      console.error("[Appel 2 Claude] Parsing error:", claudeRawContent);
      return { success: false, error: "Erreur de formatage de la routine finale." };
    }

    return { success: true, data: finalResult };
  } catch (error: any) {
    console.error("[SkinCoach] Erreur critique dans analyzeSkin:", error);

    if (error.name === "AbortError" || error.message.includes("fetch")) {
      return {
        success: false,
        error: "Le délai d'attente est dépassé. La requête est trop lourde.",
      };
    }

    return {
      success: false,
      error: error.message || "Une erreur système inattendue est survenue.",
    };
  }
}
