"use server";

export type UserResponse = {
  questionId: string;
  answer: string;
};

export type RoutineStep = {
  step_number: number;
  category: string;
  target_concern: string;
  explanation: string;
};

export type SkinAnalysisResult = {
  final_skin_type: string;
  estimated_skin_age: number;
  empathetic_message: string;
  kbeauty_routine: RoutineStep[];
  // Include raw metrics from Qwen for UI display if needed
  metrics?: {
    sebum_level_percentage: number;
    acne_severity_percentage: number;
    hydration_barrier_percentage: number;
    pore_visibility_percentage: number;
  };
};

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
  "metrics": {
    "sebum_level_percentage": 0-100,
    "acne_severity_percentage": 0-100,
    "hydration_barrier_percentage": 0-100,
    "pore_visibility_percentage": 0-100
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
        model: "qwen/qwen-2.5-vl-72b-instruct",
        max_tokens: 1500,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: qwenSystemPrompt
          },
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
    const qwenResult = JSON.parse(cleanedQwenContent);

    // =========================================================================
    // APPEL 2 : Le Skin Coach Prescripteur (CLAUDE)
    // =========================================================================
    const userChatJson = JSON.stringify(userResponses);
    const qwenResultJson = JSON.stringify(qwenResult);

    const claudeSystemPrompt = `Tu es le 'Skin Coach VIP' de la marque K-Beauty 'The Welfare'. Ton rôle est de concevoir la routine finale.
Voici les mesures cliniques extraites des photos du client par notre scanner : 
${qwenResultJson}

Voici les sensations physiques et besoins déclarés par le client via notre questionnaire : 
${userChatJson}

MISSION :
1. Rédige un message empathique ('empathetic_message') extrêmement humain et bienveillant, justifiant les observations visuelles avec le ressenti du client.
2. Déduis le 'final_skin_type' (ex: Mixte à tendance déshydratée).
3. Transmets l'estimation de l'âge cutané faite par le scanner dans 'estimated_skin_age'.
4. Construis une 'kbeauty_routine' en maximum 5 étapes. Chaque étape doit renvoyer la catégorie de produit exacte (ex: 'Nettoyant à l'huile', 'Sérum Acide Hyaluronique') pour que notre base de données Medusa.js puisse les chercher.

IMPORTANT : Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après.
FORMAT JSON ATTENDU :
{
  "final_skin_type": "...",
  "estimated_skin_age": 0,
  "empathetic_message": "...",
  "kbeauty_routine": [
    {
      "step_number": 1,
      "category": "...",
      "target_concern": "...",
      "explanation": "..."
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
        model: "anthropic/claude-sonnet-4.6",
        max_tokens: 1500,
        messages: [
          { role: "system", content: claudeSystemPrompt },
          { role: "user", content: "Génère la routine VIP finale." }
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
      finalResult = JSON.parse(cleanedClaudeContent);
      // Inject Qwen metrics for the UI progress bars
      finalResult.metrics = qwenResult.metrics;
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
