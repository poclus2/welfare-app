import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

/* ═══════════════════════════════════════════════════════════════════
   AI ENRICHMENT PIPELINE — The Welfare
   ---------------------------------------------------------------
   Enrichit les produits avec 3 champs marketing générés par IA :
     • search_tagline         → accroche 3-5 mots pour la recherche
     • commercial_description → paragraphe marketing 3-4 phrases
     • layering_steps         → JSON étapes d'utilisation (2-4 steps)

   Les données sont stockées dans le champ `metadata` de chaque
   produit Medusa (JSONB natif, aucune migration nécessaire).

   Usage :
     npx medusa exec src/scripts/enrich-products.ts

   Config (variables d'env dans apps/api/.env) :
     OPENROUTER_API_KEY=sk-or-...
     ENRICH_SAMPLE_MODE=true      ← tester sur 5 produits d'abord
     ENRICH_BATCH_SIZE=10         ← produits par lot (défaut: 10)
     ENRICH_DELAY_MS=600          ← délai entre requêtes (défaut: 600)
     ENRICH_MODEL=openai/gpt-4o-mini  ← modèle (défaut: gpt-4o-mini)
═══════════════════════════════════════════════════════════════════ */

// ─── Configuration ────────────────────────────────────────────────
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ""
const SAMPLE_MODE        = process.env.ENRICH_SAMPLE_MODE === "true"
const SAMPLE_SIZE        = 5
const BATCH_SIZE         = parseInt(process.env.ENRICH_BATCH_SIZE || "10")
const DELAY_MS           = parseInt(process.env.ENRICH_DELAY_MS   || "600")
const MODEL              = process.env.ENRICH_MODEL || "openai/gpt-4o-mini"
const OVERWRITE          = process.env.ENRICH_OVERWRITE === "true"
const OPENROUTER_URL     = "https://openrouter.ai/api/v1/chat/completions"

// ─── Prompt Système ───────────────────────────────────────────────
const SYSTEM_PROMPT = `
Role: Tu es un expert en copywriting cosmetique pour la marque premium "The Welfare", specialisee dans la K-Beauty destinee au marche africain francophone.

Tache: A partir de la fiche technique brute (Markdown) d'un produit, genere 3 elements marketing au format JSON strict.

Structure JSON attendue (respecte EXACTEMENT les noms de champs) :
{
  "search_tagline": "...",
  "commercial_description": "...",
  "inci_markdown": "### Ingrédients clés\n- **Nom de l'actif** : Explication courte.\n\n### Liste complète INCI\nIngredient 1, Ingredient 2...",
  "layering_steps": [
    {
      "step": 1,
      "label": "Nettoyage",
      "description": "Commencez sur une peau propre et legerement humide.",
      "tip": "Peau humide = meilleure absorption",
      "icon": "droplets",
      "timing": "Matin & Soir",
      "highlight": false
    }
  ]
}

Regles strictes pour chaque champ :

1. search_tagline : Accroche ultra-courte de 3 a 5 mots pour la barre de recherche. Style telegraphique, sensoriel. Ex: "Serum Apaisant & Reparateur", "Lotion Hydratation Profonde".

2. commercial_description : Paragraphe de 3 a 4 phrases. Ton elegant, rassurant, organique. Valoriser la sensorialite (texture, toucher) et le benefice visible. AUCUN ingredient chimique brut.

3. inci_markdown : Analyse des ingredients au format Markdown strict.
   - Commence EXACTEMENT par "### Ingrédients clés" suivi de 3 a 5 bullet points avec le nom de l'actif en gras (ex: "- **Niacinamide** : explication courte").
   - Saute une ligne, puis EXACTEMENT "### Liste complète INCI" suivi de la liste brute des ingredients separes par des virgules (si disponible dans la description, sinon indique "Non communiquée").

4. layering_steps : Entre 3 et 5 etapes qui racontent la ROUTINE COMPLETE dans laquelle s'integre ce produit (pas seulement les etapes d'application du produit lui-meme). Exemple pour un serum : Nettoyage -> Toner -> Ce serum -> Creme -> Protection solaire.

   Pour CHAQUE etape, respecte exactement ces champs :
   - step : numero entier (1, 2, 3...)
   - label : Nom court de l'etape, 1 ou 2 mots (ex: "Nettoyage", "Toner", "Application", "Hydratation", "Protection")
   - description : Consigne claire et sensorielle, 1 a 2 phrases maximum (ex: "Appliquez sur peau propre et legerement humide. Tapotez du bout des doigts.")
   - tip : Astuce courte et utile, sans ponctuation finale, style italique confidentiel (ex: "Peau humide = meilleure absorption", "Evitez le contour des yeux")
   - icon : Choisis UNE valeur parmi : "droplets", "wind", "star", "sun", "moon"
       droplets = nettoyage / eau / hydratation
       wind     = toner / essence legere / brume
       star     = serum / soin vedette / ce produit
       sun      = creme de jour / protection solaire / SPF
       moon     = soin de nuit / sleeping mask
   - timing : Exactement une de ces 3 valeurs : "Matin & Soir", "Matin", "Soir"
   - highlight : true UNIQUEMENT pour l'etape ou CE produit specifique est applique, false pour toutes les autres etapes

Renvoie UNIQUEMENT un objet JSON valide, sans aucun texte avant ou apres.
`.trim()

// ─── Types ────────────────────────────────────────────────────────
interface LayeringStep {
  step: number
  label: string
  description: string
  tip: string
  icon: "droplets" | "wind" | "star" | "sun" | "moon"
  timing: "Matin & Soir" | "Matin" | "Soir"
  highlight: boolean
}

interface EnrichmentResult {
  search_tagline: string
  commercial_description: string
  inci_markdown: string
  layering_steps: LayeringStep[]
}

// ─── Sleep helper ─────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// ─── OpenRouter API Call ──────────────────────────────────────────
async function enrichWithAI(
  brand: string,
  name: string,
  description: string
): Promise<EnrichmentResult | null> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set in .env")
  }

  const userPrompt = `
Marque : ${brand || "Marque inconnue"}
Nom du produit : ${name}
Fiche technique (Markdown) :
${description || "Aucune description disponible."}
`.trim()

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://the-welfare.com",
        "X-Title": "The Welfare - AI Enrichment",
      },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user",   content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`  ❌ OpenRouter API Error ${response.status}: ${errorText}`)
      return null
    }

    const data = await response.json() as any
    const rawContent = data?.choices?.[0]?.message?.content

    if (!rawContent) {
      console.error("  ❌ Empty response from OpenRouter")
      return null
    }

    const parsed = JSON.parse(rawContent) as EnrichmentResult

    // Validation basique
    if (!parsed.search_tagline || !parsed.commercial_description || !Array.isArray(parsed.layering_steps)) {
      console.error("  ❌ Invalid JSON structure returned by AI")
      return null
    }

    return parsed
  } catch (err: any) {
    console.error(`  ❌ AI call failed: ${err.message}`)
    return null
  }
}

// ─── Main Medusa Script ───────────────────────────────────────────
export default async function enrichProducts({ container }: ExecArgs) {
  const productModule = container.resolve(Modules.PRODUCT)

  // ── Validation clé API
  if (!OPENROUTER_API_KEY) {
    console.error("❌ OPENROUTER_API_KEY non définie dans .env")
    console.error("   Ajoutez : OPENROUTER_API_KEY=sk-or-xxxx dans apps/api/.env")
    return
  }

  console.log("╔══════════════════════════════════════════════════════╗")
  console.log("║   The Welfare — AI Enrichment Pipeline               ║")
  console.log("╚══════════════════════════════════════════════════════╝")
  console.log(`  Modèle      : ${MODEL}`)
  console.log(`  Délai       : ${DELAY_MS}ms entre requêtes`)
  console.log(`  Mode        : ${SAMPLE_MODE ? `TEST (${SAMPLE_SIZE} produits)` : "PRODUCTION (tous les produits)"}`)
  console.log("")

  // ── Récupération des produits
  console.log("📦 Chargement des produits depuis Medusa...")
  const allProducts = await productModule.listProducts({}, {
    take: 1000,
    relations: ["collection"],
  })

  // ── Filtrer les produits a traiter
  // OVERWRITE=true : tout regénérer (écrase l'ancien contenu)
  // OVERWRITE=false (défaut) : sauter les produits déjà enrichis avec la nouvelle structure
  const toProcess = allProducts
    .filter(p => {
      const meta = (p as any).metadata || {}
      if (OVERWRITE) return true // Tout re-traiter
      // Sauter si déjà enrichi avec la nouvelle structure (label vs title)
      const steps = meta.layering_steps
      const alreadyNewFormat = Array.isArray(steps) && steps.length > 0 && steps[0].label !== undefined
      return !alreadyNewFormat
    })
    .slice(0, SAMPLE_MODE ? SAMPLE_SIZE : undefined)

  const skipped = allProducts.length - toProcess.length
  console.log(`  Total en base     : ${allProducts.length} produits`)
  console.log(`  Déjà enrichis     : ${skipped} (skippés)`)
  console.log(`  À traiter         : ${toProcess.length} produits`)
  console.log("")

  if (toProcess.length === 0) {
    console.log("✅ Tous les produits sont déjà enrichis !")
    return
  }

  // ── Traitement par lots
  let successCount = 0
  let errorCount   = 0
  let totalCost    = 0

  for (let i = 0; i < toProcess.length; i++) {
    const product = toProcess[i]
    const brand   = (product as any).collection?.title || ""
    const name    = product.title || "Produit sans nom"

    console.log(`[${i + 1}/${toProcess.length}] ${brand ? brand + " — " : ""}${name}`)

    // ── Appel IA
    const enrichment = await enrichWithAI(brand, name, product.description || "")

    if (!enrichment) {
      errorCount++
      console.log(`  ⚠️  Skipping after error\n`)
      await sleep(DELAY_MS)
      continue
    }

    // ── Afficher le résultat
    console.log(`  ✦ Tagline  : ${enrichment.search_tagline}`)
    console.log(`  ✦ Steps    : ${enrichment.layering_steps.length} étapes`)

    // ── Mise à jour Medusa (metadata JSONB)
    try {
      const existingMeta = (product as any).metadata || {}
      await productModule.updateProducts(product.id, {
        metadata: {
          ...existingMeta,
          search_tagline:        enrichment.search_tagline,
          commercial_description: enrichment.commercial_description,
          inci_markdown:         enrichment.inci_markdown,
          layering_steps:        enrichment.layering_steps,
          enriched_at:           new Date().toISOString(),
          enriched_by:           MODEL,
        },
      })
      successCount++
      console.log(`  ✅ Sauvegardé\n`)
    } catch (updateErr: any) {
      errorCount++
      console.error(`  ❌ Erreur update Medusa: ${updateErr.message}\n`)
    }

    // ── Pause anti-rate-limit
    if (i < toProcess.length - 1) {
      await sleep(DELAY_MS)
    }

    // ── Rapport intermédiaire tous les 50 produits
    if ((i + 1) % 50 === 0) {
      console.log("─────────────────────────────────────────────────────")
      console.log(`  Progression : ${i + 1}/${toProcess.length}`)
      console.log(`  Succès      : ${successCount} | Erreurs : ${errorCount}`)
      console.log("─────────────────────────────────────────────────────\n")
    }
  }

  // ── Rapport final
  console.log("╔══════════════════════════════════════════════════════╗")
  console.log("║   Enrichissement terminé !                           ║")
  console.log("╚══════════════════════════════════════════════════════╝")
  console.log(`  ✅ Succès  : ${successCount} produits enrichis`)
  console.log(`  ❌ Erreurs : ${errorCount} produits non traités`)
  console.log(`  📦 Total   : ${toProcess.length} produits traités`)

  if (SAMPLE_MODE) {
    console.log("")
    console.log("  ℹ️  Mode TEST activé. Pour lancer sur TOUS les produits :")
    console.log("     Supprimez ou mettez ENRICH_SAMPLE_MODE=false dans .env")
    console.log("     puis relancez : npx medusa exec src/scripts/enrich-products.ts")
  }
}
