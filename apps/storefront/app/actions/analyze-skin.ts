"use server";

export type UserResponse = {
  questionId: string;
  answer: string;
};

export type SkinAnalysisResult = {
  estimated_skin_age: number;
  melanin_skin_type: string;
  metrics: {
    acne_percentage: number;
    dryness_percentage: number;
    hydration_percentage: number;
    texture_quality_percentage: number;
  };
  detected_concerns: string[];
  empathetic_message: string;
  recommended_routine_steps: string[];
};

export async function analyzeSkin(
  imageBase64: string,
  userResponses: UserResponse[]
): Promise<{ success: boolean; data?: SkinAnalysisResult; error?: string }> {
  try {
    // 1. Vérification de la configuration
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("Clé API OpenRouter manquante.");
      return { success: false, error: "Configuration serveur incomplète (Clé API manquante)." };
    }

    if (!imageBase64) {
      return { success: false, error: "Aucune image n'a été fournie pour l'analyse." };
    }

    // 2. Formatage du contexte utilisateur
    const contextText = userResponses
      .map((r, index) => `- Q${index + 1} (${r.questionId}) : ${r.answer}`)
      .join("\n");

    // 3. Construction dynamique du Prompt Système avec les nouvelles métriques
    const systemPrompt = `Tu es un dermatologue virtuel expert en cosmétologie K-Beauty pour la marque 'The Welfare', spécialisé dans l'analyse des peaux mélanisées et caucasiennes. 
Tu dois analyser l'image du visage fournie ET les réponses de l'utilisateur. CECI N'EST PAS UN DIAGNOSTIC MÉDICAL.

CONTEXTE UTILISATEUR : Voici ce que le client a déclaré :
${contextText}

Instructions d'analyse visuelle :
1. Estime l'âge cutané (visuel) de la personne.
2. Évalue 4 métriques sur 100 (0 = très faible, 100 = très fort/optimal) : Acné/Imperfections, Sécheresse, Niveau d'Hydratation, Qualité de la Texture.
3. Détermine le type de peau en incluant explicitement le niveau de mélanine ou le phototype (ex: 'Grasse - Peau fortement mélanisée (Phototype V)').

Renvoie UNIQUEMENT un objet JSON valide avec cette structure stricte :
{
  "estimated_skin_age": entier,
  "melanin_skin_type": "string",
  "metrics": {
    "acne_percentage": entier,
    "dryness_percentage": entier,
    "hydration_percentage": entier,
    "texture_quality_percentage": entier
  },
  "detected_concerns": ["string", "string"],
  "empathetic_message": "string",
  "recommended_routine_steps": ["string", "string"]
}`;

    // 4. Appel de l'API OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://thewelfare.com", 
        "X-Title": "The Welfare Skin Coach"
      },
      body: JSON.stringify({
        model: "qwen/qwen3-vl-32b-instruct",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyse ce visage."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64 // L'image doit inclure le préfixe data:image/jpeg;base64,...
                }
              }
            ]
          }
        ]
      })
    });

    // 5. Gestion des erreurs HTTP de l'API
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SkinCoach] Erreur API OpenRouter (${response.status}):`, errorText);
      return { success: false, error: `Erreur lors de l'appel à l'API IA (${response.status}).` };
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;
    
    if (!rawContent) {
      return { success: false, error: "Le modèle d'IA n'a retourné aucune réponse." };
    }

    // 6. Extraction et Parsing robuste du JSON
    let parsedJson: SkinAnalysisResult;
    try {
      // Nettoyage : Certains modèles renvoient le JSON encadré par des backticks Markdown (```json ... ```)
      const cleanedContent = rawContent.replace(/```json/gi, "").replace(/```/g, "").trim();
      parsedJson = JSON.parse(cleanedContent);
      
      // Validation basique de structure (optionnel mais recommandé)
      if (typeof parsedJson.estimated_skin_age !== "number" || !parsedJson.melanin_skin_type) {
        throw new Error("Structure JSON invalide : champs manquants");
      }
      
    } catch (parseError) {
      console.error("[SkinCoach] Échec du parsing JSON:", rawContent);
      return { success: false, error: "L'IA a retourné un format illisible. Veuillez réessayer." };
    }

    // 7. Succès
    return { success: true, data: parsedJson };

  } catch (error: any) {
    console.error("[SkinCoach] Erreur critique dans analyzeSkin:", error);
    
    // Gérer spécifiquement le timeout réseau si nécessaire
    if (error.name === "AbortError" || error.message.includes("fetch")) {
        return { success: false, error: "Le délai d'attente est dépassé ou le réseau est instable." };
    }

    return { 
      success: false, 
      error: error.message || "Une erreur système inattendue est survenue." 
    };
  }
}
