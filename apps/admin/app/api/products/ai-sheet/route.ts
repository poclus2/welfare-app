import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  AiProductSheet,
  LayeringStep,
  SKIN_CONCERN_OPTIONS,
  SKIN_TYPE_OPTIONS,
  STEP_ICONS,
  slugify,
} from "@/lib/product-sheet";

// AI product sheet: reads photos of a product's INCI label (+ optionally its front) and proposes every
// field of the product form. Nothing is saved here: the form is pre-filled and the admin reviews it.
//
// Request: multipart form, "inci" (1-2 photos, required), "front" (0-1 photo), "context" (JSON with the
// existing brands and categories, so the model picks among them instead of inventing new ones).
//
// The response is streamed: OpenRouter can take 20-60 s to read the photos, longer than nginx's default
// 60 s proxy_read_timeout allows without traffic, so a space is written every 10 s while waiting and the
// JSON follows (leading whitespace is valid JSON).

// Sonnet: near-Opus label reading at half the price (~0.03 $ per sheet). Override with AI_SHEET_MODEL.
const MODEL = process.env.AI_SHEET_MODEL || "anthropic/claude-sonnet-5.5";
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Context = {
  collections: { id: string; title: string }[];
  categories: { id: string; name: string; parent?: string | null }[];
};

async function toDataUrl(file: File) {
  const buf = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buf.toString("base64")}`;
}

function buildPrompt(ctx: Context, inciCount: number, hasFront: boolean) {
  const brands = ctx.collections.map((c) => `- ${c.id} : ${c.title}`).join("\n") || "(aucune)";
  const cats = ctx.categories.map((c) => `- ${c.id} : ${c.parent ? `${c.parent} > ` : ""}${c.name}`).join("\n") || "(aucune)";
  return `Tu es l'expert formulation cosmétique de The Welfare Shop, boutique K-beauty au Cameroun.
Tu reçois ${inciCount} photo(s) de la liste d'ingrédients (INCI) d'un produit${hasFront ? " puis 1 photo de sa face avant" : ""}.
Remplis la fiche produit en français, en JSON strict, sans texte autour ni bloc de code.

RÈGLES
- raw_inci : transcription EXACTE de la liste INCI, dans l'ordre, ingrédients séparés par ", ". N'invente, ne corrige et ne complète rien.
  Un passage illisible s'écrit [illisible] et va dans warnings. Si aucune liste INCI n'est lisible : raw_inci = "", inci_confidence = "low".
- Si la photo est en coréen/japonais/chinois, transcris la liste INCI en anglais si elle est imprimée, sinon traduis les noms en INCI anglais standard et signale-le dans warnings.
- Les bénéfices, types de peau et préoccupations se déduisent des ingrédients réellement présents. Pas d'allégation médicale.
- title : nom commercial du produit en français, SANS la marque (ex: "Toner Facial Glutathion Niacinamide"). Si le nom n'est pas visible, propose un nom descriptif d'après le type de produit et ses actifs, et signale-le dans warnings.
- subtitle : contenance si elle est visible (ex: "150 ml", "50 g"), sinon "".
- collection_id : id de la marque dans la liste ci-dessous si elle est visible sur une photo, sinon null. brand_detected : marque lue telle qu'écrite ("" si aucune).
- category_ids : 1 à 3 ids pris UNIQUEMENT dans la liste des catégories ci-dessous (sous-catégorie la plus précise + sa catégorie parente).
- skin_types : 1 à 4 valeurs parmi ${JSON.stringify(SKIN_TYPE_OPTIONS)}.
- skin_concerns : 1 à 5 valeurs parmi ${JSON.stringify(SKIN_CONCERN_OPTIONS)}.
- search_tagline : accroche de 3 à 5 mots (ex: "Toner Équilibrant & Hydratant").
- commercial_description : 3 à 4 phrases marketing, chaleureuses, sans promesse médicale.
- description : markdown "# <titre>\\n\\n## Actifs Principaux\\n\\n* **Actif** : rôle...\\n\\n## Analyse de la formulation\\n\\n<2 paragraphes>". 4 à 7 actifs.
- inci_markdown : "### Ingrédients clés\\n- **Actif** : bénéfice en une phrase." pour 3 à 6 actifs.
- layering_steps : 3 à 5 étapes de la routine où ce produit s'insère, dans l'ordre ; l'étape du produit a highlight=true, les autres false.
  icon parmi ${JSON.stringify(STEP_ICONS)} ; timing parmi "Matin", "Soir", "Matin & Soir" ; tip court.
- inci_confidence : "high" si toute la liste est nette, "medium" si quelques mots sont incertains, "low" sinon.
- warnings : tout ce que l'admin doit vérifier (mots incertains, nom deviné, marque absente de la liste...). [] si rien.

MARQUES EXISTANTES (id : nom)
${brands}

CATÉGORIES EXISTANTES (id : parent > nom)
${cats}

FORMAT
{"title":"","subtitle":"","collection_id":null,"brand_detected":"","category_ids":[],"raw_inci":"","inci_markdown":"","skin_types":[],"skin_concerns":[],"search_tagline":"","commercial_description":"","description":"","layering_steps":[{"step":1,"label":"","timing":"","description":"","tip":"","icon":"droplets","highlight":false}],"inci_confidence":"high","warnings":[]}`;
}

function extractJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("Réponse de l'IA illisible");
  return JSON.parse(text.slice(start, end + 1));
}

const str = (v: unknown, max = 20000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const pick = (v: unknown, allowed: readonly string[], max: number) =>
  Array.from(new Set((Array.isArray(v) ? v : []).filter((x): x is string => typeof x === "string" && allowed.includes(x)))).slice(0, max);

// Never trust the model's output shape: keep only known fields, known ids and known vocabulary.
function sanitize(raw: any, ctx: Context): AiProductSheet {
  const collectionIds = new Set(ctx.collections.map((c) => c.id));
  const categoryIds = ctx.categories.map((c) => c.id);
  const warnings = (Array.isArray(raw?.warnings) ? raw.warnings : []).map((w: unknown) => str(w, 300)).filter(Boolean).slice(0, 10);

  const steps: LayeringStep[] = (Array.isArray(raw?.layering_steps) ? raw.layering_steps : [])
    .slice(0, 6)
    .map((s: any, i: number) => ({
      step: i + 1,
      label: str(s?.label, 60),
      timing: ["Matin", "Soir", "Matin & Soir"].includes(s?.timing) ? s.timing : "Matin & Soir",
      description: str(s?.description, 400),
      tip: str(s?.tip, 160),
      icon: (STEP_ICONS as readonly string[]).includes(s?.icon) ? s.icon : "star",
      highlight: s?.highlight === true,
    }))
    .filter((s: LayeringStep) => s.label);

  const collectionId = typeof raw?.collection_id === "string" && collectionIds.has(raw.collection_id) ? raw.collection_id : null;
  const brand = str(raw?.brand_detected, 80);
  if (brand && !collectionId) warnings.push(`Marque « ${brand} » lue sur la photo mais absente de la liste des marques : à créer ou choisir.`);

  const title = str(raw?.title, 200);
  return {
    title,
    subtitle: str(raw?.subtitle, 60),
    handle: slugify(title),
    description: str(raw?.description),
    collection_id: collectionId,
    brand_detected: brand,
    category_ids: pick(raw?.category_ids, categoryIds, 4),
    raw_inci: str(raw?.raw_inci, 8000),
    inci_markdown: str(raw?.inci_markdown, 4000),
    skin_types: pick(raw?.skin_types, SKIN_TYPE_OPTIONS, 4),
    skin_concerns: pick(raw?.skin_concerns, SKIN_CONCERN_OPTIONS, 5),
    search_tagline: str(raw?.search_tagline, 80),
    commercial_description: str(raw?.commercial_description, 1500),
    layering_steps: steps,
    inci_confidence: ["high", "medium", "low"].includes(raw?.inci_confidence) ? raw.inci_confidence : "low",
    warnings,
    model: MODEL,
  };
}

async function generate(inci: File[], front: File | null, ctx: Context): Promise<AiProductSheet> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY n'est pas configurée sur l'admin");

  const content: any[] = [{ type: "text", text: buildPrompt(ctx, inci.length, !!front) }];
  for (const f of inci) content.push({ type: "image_url", image_url: { url: await toDataUrl(f) } });
  if (front) content.push({ type: "image_url", image_url: { url: await toDataUrl(front) } });

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://admin.thewelfarecm.com",
      "X-Title": "The Welfare Admin - Fiche produit IA",
    },
    // ~2 500 tokens are used in practice; OpenRouter reserves credit for max_tokens up front
    body: JSON.stringify({ model: MODEL, max_tokens: 4000, temperature: 0.2, messages: [{ role: "user", content }] }),
    signal: AbortSignal.timeout(170_000),
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    console.error(`[AI Sheet] OpenRouter ${res.status}: ${detail}`);
    if (res.status === 402) throw new Error("Crédit OpenRouter épuisé : rechargez le compte pour utiliser le générateur");
    if (res.status === 429) throw new Error("Trop de demandes en même temps, réessayez dans un instant");
    throw new Error(`Le service IA a répondu ${res.status}`);
  }
  const body: any = await res.json();
  const text = body?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text) throw new Error("Réponse de l'IA vide");
  return sanitize(extractJson(text), ctx);
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get("admin_token")?.value) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let inci: File[];
  let front: File | null;
  let ctx: Context;
  try {
    const form = await req.formData();
    inci = form.getAll("inci").filter((f): f is File => f instanceof File).slice(0, 2);
    const f = form.get("front");
    front = f instanceof File ? f : null;
    const parsed = JSON.parse(String(form.get("context") || "{}"));
    ctx = {
      collections: (Array.isArray(parsed.collections) ? parsed.collections : [])
        .filter((c: any) => typeof c?.id === "string" && typeof c?.title === "string").slice(0, 500),
      categories: (Array.isArray(parsed.categories) ? parsed.categories : [])
        .filter((c: any) => typeof c?.id === "string" && typeof c?.name === "string").slice(0, 500),
    };
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (!inci.length) return NextResponse.json({ error: "Ajoutez au moins une photo de la liste INCI" }, { status: 400 });
  for (const file of [...inci, ...(front ? [front] : [])]) {
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Format d'image non pris en charge (JPEG, PNG ou WebP)" }, { status: 400 });
    if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "Photo trop lourde (4 Mo maximum)" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const keepAlive = setInterval(() => controller.enqueue(encoder.encode(" ")), 10_000);
      try {
        const sheet = await generate(inci, front, ctx);
        controller.enqueue(encoder.encode(JSON.stringify({ sheet })));
      } catch (e: any) {
        console.error("[AI Sheet] Failed:", e);
        const message = e?.name === "TimeoutError" ? "L'IA a mis trop de temps à répondre, réessayez" : e?.message || "Erreur lors de la génération";
        controller.enqueue(encoder.encode(JSON.stringify({ error: message })));
      } finally {
        clearInterval(keepAlive);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // no-transform keeps the compression layer from buffering the keep-alive spaces
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
