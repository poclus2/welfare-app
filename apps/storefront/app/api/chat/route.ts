import { NextResponse } from "next/server";
import type { ProductContext } from "@/lib/store/use-chat-store";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, productContext } = body as { 
      messages: { role: string; content: string }[], 
      productContext: ProductContext | null 
    };

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "Clé API OpenRouter manquante." }, { status: 500 });
    }

    // Build the system prompt based on context
    let systemPrompt = `Tu es l'assistant IA virtuel de "The Welfare", une boutique premium de K-Beauty basée en Afrique (Cameroun).
Ton rôle est d'aider les clients de manière polie, experte et bienveillante.
- Tes réponses doivent être concises (idéalement 1 à 3 paragraphes courts).
- Adapte tes conseils au climat d'Afrique centrale (chaud et humide) et aux spécificités des peaux noires, métisses ou caucasiennes.
- N'invente pas de prix ni de produits qui ne sont pas de la K-Beauty.
`;

    if (productContext) {
      systemPrompt += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXTE DU PRODUIT CONSULTÉ PAR LE CLIENT ACTUELLEMENT :
Nom : ${productContext.title}
Prix : ${productContext.price} FCFA
Bénéfices : ${(productContext.benefits || []).join(", ")}
Types de peau recommandés : ${(productContext.skin_types || []).join(", ")}
Description brute : ${productContext.description}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RÈGLE STRATÉGIQUE : Le client est actuellement sur la fiche de ce produit précis. 
S'il pose une question vague (ex: "comment l'utiliser ?", "est-ce bien pour moi ?"), il parle DE CE PRODUIT. Réponds en te basant sur le contexte ci-dessus.
Mets en valeur les points forts du produit pour rassurer le client, tout en restant honnête.
`;
    }

    // Prepare messages array for OpenRouter
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://thewelfare.com",
        "X-Title": "The Welfare Assistant",
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash", 
        messages: apiMessages,
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[ChatAPI] Error from OpenRouter:", err);
      return NextResponse.json({ error: "Échec de la communication avec l'IA." }, { status: 502 });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Je n'ai pas compris, pouvez-vous reformuler ?";

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("[ChatAPI] Internal Error:", error);
    return NextResponse.json({ error: "Erreur serveur inattendue." }, { status: 500 });
  }
}
