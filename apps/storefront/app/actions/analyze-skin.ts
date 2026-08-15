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
// RAG HELPER : Pré-filtrage Meilisearch → Mini-Catalogue
// =========================================================================

type MeiliProduct = {
  id: string;
  title: string;
  description?: string;
  category: string;
};

async function fetchProductCatalogForSkin(
  skinType: string,
  concerns: string[]
): Promise<MeiliProduct[]> {
  const host = process.env.MEILISEARCH_HOST;
  const searchKey = process.env.MEILISEARCH_SEARCH_KEY;

  if (!host || !searchKey) {
    console.warn("[RAG] Variables Meilisearch manquantes, mode dégradé activé.");
    return [];
  }

  // Determine keywords from skin type and concerns to enrich queries
  const skinKeywords = buildSkinKeywords(skinType, concerns);

  // 5 K-Beauty category searches in parallel
  const categories = [
    { name: "Nettoyant", queries: ["nettoyant", "cleanser", "cleansing", "mousse"] },
    { name: "Toner / Essence", queries: ["toner", "essence", "lotion", "eau de soin"] },
    { name: "Sérum", queries: ["sérum", "serum", "ampoule", "concentré"] },
    { name: "Hydratant", queries: ["crème", "hydratant", "moisturizer", "gel crème"] },
    { name: "Solaire", queries: ["solaire", "spf", "sunscreen", "protection solaire"] },
  ];

  const results = await Promise.allSettled(
    categories.map(async (cat) => {
      // Build a combined query: category terms + skin-specific keywords
      const query = [...cat.queries, ...skinKeywords].slice(0, 3).join(" ");
      try {
        const res = await fetch(`${host}/indexes/products/search`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${searchKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: query,
            limit: 3,
            attributesToRetrieve: ["id", "title", "description"],
          }),
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.hits || []).map((hit: any) => ({
          id: hit.id,
          title: hit.title,
          description: hit.description,
          category: cat.name,
        }));
      } catch {
        return [];
      }
    })
  );

  const allProducts: MeiliProduct[] = [];
  results.forEach((r) => {
    if (r.status === "fulfilled") allProducts.push(...r.value);
  });

  console.log(`[RAG] ${allProducts.length} produits récupérés depuis Meilisearch`);
  return allProducts;
}

function buildSkinKeywords(skinType: string, concerns: string[]): string[] {
  const keywords: string[] = [];
  const st = skinType.toLowerCase();

  if (st.includes("grasse") || st.includes("mixte")) keywords.push("pore", "sébum", "matifiant");
  if (st.includes("sèche") || st.includes("déshydratée")) keywords.push("hydratation", "nourrissant");
  if (st.includes("sensible")) keywords.push("apaisant", "calmant", "centella");
  if (st.includes("terne") || st.includes("éclat")) keywords.push("vitamine c", "éclat", "luminosité");

  // Add concern-based keywords (take first 2 concerns)
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
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://thewelfare.com",
        "X-Title": "The Welfare Skin Coach"
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
              { type: "image_url", image_url: { url: images.right } }
            ]
          }
        ]
      })
    });

    if (!qwenResponse.ok) {
      console.error(`[Appel 1 Qwen] Erreur:`, await qwenResponse.text());
      return { success: false, error: "Échec de l'analyse visuelle par l'IA." };
    }

    const qwenData = await qwenResponse.json();
    const qwenRawContent = qwenData.choices?.[0]?.message?.content;
    const cleanedQwenContent = qwenRawContent?.replace(/```json/gi, "")?.replace(/```/g, "")?.trim() || "{}";

    let qwenResult;
    try {
      qwenResult = JSON.parse(cleanedQwenContent);
    } catch (e) {
      console.error("[Appel 1 Qwen] Parsing error:", qwenRawContent);
      return { success: false, error: "Erreur de formatage de l'analyse visuelle." };
    }

    if (qwenResult.has_glasses) {
      return { success: false, error: "Veuillez retirer vos lunettes pour que l'IA puisse analyser précisément votre peau et recommencez." };
    }

    // =========================================================================
    // APPEL 1.5 : RAG — Pré-filtrage Meilisearch (mini-catalogue)
    // =========================================================================
    const productCatalog = await fetchProductCatalogForSkin(
      qwenResult.visual_reasoning || "",
      qwenResult.clinical_observations || []
    );

    const hasCatalog = productCatalog.length > 0;
    const miniCatalogText = hasCatalog
      ? productCatalog
          .map((p) => `[${p.category}] ${p.title} (medusa_product_id: "${p.id}") — ${(p.description || "").slice(0, 100)}`)
          .join("\n")
      : "Aucun produit spécifique disponible pour le moment.";

    // =========================================================================
    // APPEL 2 : Le Skin Coach Prescripteur (CLAUDE) — avec catalogue injecté
    // =========================================================================

    const sanitizedUserResponses = userResponses.map((r) => ({
      ...r,
      answer: typeof r.answer === "string" ? r.answer : "[Image de produit attachée par l'utilisateur]"
    }));

    const userChatJson = JSON.stringify(sanitizedUserResponses);
    const qwenResultJson = JSON.stringify(qwenResult);

    const catalogConstraint = hasCatalog
      ? `CONTRAINTE ABSOLUE SUR LES PRODUITS :
Tu ne peux PAS inventer de produits. Tu dois OBLIGATOIREMENT choisir parmi le catalogue ci-dessous.
Pour chaque étape, copie exactement le medusa_product_id du produit sélectionné.
Si aucun produit du catalogue ne convient parfaitement pour une étape, laisse medusa_product_id à null.

CATALOGUE EN STOCK :
${miniCatalogText}`
      : `Note: Le catalogue produit n'est pas disponible pour le moment. Génère une routine K-Beauty générique de qualité. Laisse medusa_product_id à null pour chaque étape.`;

    const claudeSystemPrompt = `Tu es le "Skin Coach", l'expert K-Beauty premium de la marque The Welfare. Tu viens de recevoir l'analyse biométrique du visage de la cliente (générée par Qwen) ainsi que ses réponses au questionnaire.

Analyse biométrique :
${qwenResultJson}

Réponses au questionnaire :
${userChatJson}

TA MISSION :
Rédiger une routine de Layering coréen sur-mesure pour cette cliente, en sélectionnant UNIQUEMENT des produits parmi le catalogue fourni en contexte.

LE TON ET LA PERSONNALITÉ (TRÈS IMPORTANT) :
1. Vouvoiement obligatoire, ton chaleureux, bienveillant, rassurant et expert.
2. Utilise le vocabulaire K-Beauty : Glow, barrière cutanée, hydratation, apaisement, layering.
3. SOIS PÉDAGOGIQUE ET NUANCÉ. Ne sois jamais rigide ou dictatorial sur les ingrédients. 
   - Mauvais exemple : "Il vous faut absolument un nettoyant à l'acide salicylique ou au charbon."
   - Bon exemple : "Je vous recommande un nettoyant moussant doux pour réguler l'excès de sébum. Ensuite, selon la tolérance de votre peau, des actifs comme l'acide salicylique, le zinc ou le charbon pourront être intégrés pour purifier en profondeur."
Explique toujours *l'objectif* de l'étape avant de parler des ingrédients.

RÈGLES D'EXPERTISE K-BEAUTY (MINIMALISME ET COHÉRENCE) :
1. Principe de minimalisme (Anti-surcharge) : Ne surcharge JAMAIS la routine avec des produits superflus. Limite la routine aux étapes strictement essentielles (généralement 3 à 5 étapes maximum). Un utilisateur ne doit jamais se sentir submergé.
2. Évite les redondances : Si les besoins de la peau sont déjà couverts par une étape, n'en ajoute pas une autre similaire (par exemple, n'ajoute pas une essence si un toner hydratant ou un sérum remplit déjà ce rôle de préparation/hydratation).
3. Harmonisation et Justification : Pour chaque produit sélectionné (surtout lorsqu'il s'agit de choisir entre un toner, une essence ou une ampoule), tu dois justifier CLAIREMENT dans ton explication pourquoi CE produit spécifique a été choisi pour elle aujourd'hui. Cela permet d'éviter les incohérences de diagnostic.

CONTRAINTE ABSOLUE SUR LES PRODUITS (RAG) :
Voici notre catalogue actuel de produits en stock :
${hasCatalog ? miniCatalogText : "Le catalogue produit n'est pas disponible pour le moment. Génère une routine K-Beauty générique de qualité. Laisse medusa_product_id à null pour chaque étape."}

Pour chaque étape de la routine, tu dois sélectionner le produit le plus adapté dans CETTE liste et renvoyer son \`medusa_product_id\` exact. 
Si aucun produit du catalogue ne convient parfaitement pour une étape, laisse \`medusa_product_id\` à null.

FORMAT DE SORTIE (JSON STRICT) :
{
  "skin_type_detected": "Ex: Mixte à Grasse",
  "estimated_skin_age": 0,
  "skin_coach_intro": "Un petit paragraphe (2-3 phrases) d'introduction chaleureuse qui résume l'analyse globale de sa peau.",
  "routine_steps": [
    {
      "step_number": 1,
      "step_name": "Ex: Double Nettoyage - Huile",
      "explanation_for_client": "L'explication nuancée et pédagogique. Explique pourquoi cette étape précise est intégrée (justification logique) et pourquoi ce produit va l'aider, en parlant d'actifs comme des options selon sa tolérance.",
      "medusa_product_id": "prod_01H8X...", 
      "product_name": "Nom exact du produit"
    }
  ]
}`;

    const claudeResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://thewelfare.com",
        "X-Title": "The Welfare Skin Coach"
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
              { type: "text", text: "Génère la routine VIP finale en te basant sur le diagnostic et les images des produits s'il y en a." },
              ...userResponses
                .filter((r) => typeof r.answer !== "string" && r.answer.type === "image")
                .map((r) => ({
                  type: "image_url",
                  image_url: { url: (r.answer as { type: "image"; base64: string }).base64 }
                }))
            ]
          }
        ]
      })
    });

    if (!claudeResponse.ok) {
      console.error(`[Appel 2 Claude] Erreur:`, await claudeResponse.text());
      return { success: false, error: "Échec de la prescription par le Skin Coach." };
    }

    const claudeData = await claudeResponse.json();
    const claudeRawContent = claudeData.choices?.[0]?.message?.content;
    const cleanedClaudeContent = claudeRawContent?.replace(/```json/gi, "")?.replace(/```/g, "")?.trim() || "{}";

    let finalResult: SkinAnalysisResult;
    try {
      const parsed = JSON.parse(cleanedClaudeContent);

      // Normalize: support both routine_steps (new) and kbeauty_routine (legacy)
      const routineSteps = parsed.routine_steps || parsed.kbeauty_routine || [];

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
        const medusaBackendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
        await fetch(`${medusaBackendUrl}/store/skin-scans`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
          },
          body: JSON.stringify({
            final_skin_type: finalResult.final_skin_type,
            estimated_skin_age: finalResult.estimated_skin_age,
            melanin_phototype: finalResult.melanin_phototype || qwenResult.melanin_phototype,
            concerns: qwenResult.clinical_observations || [],
            metrics: finalResult.metrics,
            routine: finalResult.kbeauty_routine,
            images: {
              front: images.front,
              left: images.left,
              right: images.right,
            },
            qwen_raw_summary: qwenResult.visual_reasoning || JSON.stringify(qwenResult.clinical_observations),
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
      return { success: false, error: "Le délai d'attente est dépassé. La requête est trop lourde." };
    }

    return {
      success: false,
      error: error.message || "Une erreur système inattendue est survenue."
    };
  }
}
