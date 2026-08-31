"use server";

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
      `${medusaUrl}/store/products?${query}&limit=${ids.length}`,
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
    return (data.products || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      handle: p.handle,
      thumbnail: p.thumbnail,
      stock_total: (p.variants || []).reduce(
        (acc: number, v: any) =>
          acc + (v.inventory_quantity || v.metadata?.stock_total || 0),
        0
      ),
      category,
    }));
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
// MAIN ACTION
// =========================================================================

export async function analyzeSkin(
  images: { front: string; left: string; right: string },
  userResponses: UserResponse[]
): Promise<{ success: boolean; data?: SkinAnalysisResult; error?: string }> {
  try {
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
    const productCatalog = await fetchProductCatalogForSkin(
      qwenResult.visual_reasoning || "",
      qwenResult.clinical_observations || [],
      aiConfig
    );

    const hasCatalog = productCatalog.length > 0;

    // Build catalog text with stock hints and full AI descriptions (for precise AI prioritization)
    const miniCatalogText = hasCatalog
      ? productCatalog
          .map(
            (p) =>
              `[${p.category}] ${p.title} (medusa_product_id: "${p.id}", stock: ${p.stock_total})\n  COMPOSITION ET FICHE IA: ${(p.description || "Aucune description").replace(/\n/g, "  ")}\n`
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

RÈGLE DE PRIORISATION (The Welfare Strategy) :
- En cas d'hésitation entre deux produits cutanément équivalents, donne TOUJOURS la priorité au produit avec le stock le plus élevé (indiqué entre parenthèses après "stock:").
- Si le mode est "Sélection éditoriale manuelle", ces produits ont été choisis par notre équipe : leur recommandation est FORTEMENT encouragée si pertinente.
- Pour chaque étape, copie EXACTEMENT le medusa_product_id du produit choisi.
- Si aucun produit de la liste ne convient pour une étape, N'AJOUTE PAS cette étape (skinimalisme).`
      : `Note: Le catalogue produit n'est pas disponible pour le moment. Génère une routine K-Beauty générique et minimaliste (3 à 5 étapes maximum). Laisse medusa_product_id à null pour chaque étape.`;

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

🌿 SKINIMALISME STRICT (${aiConfig.max_routine_steps} étapes MAXIMUM) :
   RÈGLE ABSOLUE : Tu ne DOIS SOUS AUCUN PRÉTEXTE dépasser ${aiConfig.max_routine_steps} étapes.
   Le tableau "routine_steps" doit contenir MAXIMUM ${aiConfig.max_routine_steps} éléments.
   Ne surcharge JAMAIS la routine. Chaque produit doit être indispensable.
   Si 3 produits suffisent, reste à 3. Qualité > Quantité.

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
      
      // Sécurité absolue : forcer la limite du tableau
      if (routineSteps.length > aiConfig.max_routine_steps) {
        routineSteps = routineSteps.slice(0, aiConfig.max_routine_steps);
      }

      finalResult = {
        final_skin_type: parsed.skin_type_detected || parsed.final_skin_type,
        estimated_skin_age: parsed.estimated_skin_age,
        empathetic_message: parsed.skin_coach_intro || parsed.empathetic_message,
        kbeauty_routine: routineSteps,
        metrics: qwenResult.metrics,
        melanin_phototype: qwenResult.melanin_phototype,
      };

      // Silent save to Medusa backend
      try {
        const medusaBackendUrl =
          process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
        await fetch(`${medusaBackendUrl}/store/skin-scans`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-publishable-api-key":
              process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
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
