"use client";

import { motion } from "framer-motion";
import { SkinAnalysisResult } from "@/app/actions/analyze-skin";
import { ShoppingBag, ArrowCounterClockwise, CaretRight, Package, Plus, CheckCircle, Printer, LockKey, FirstAidKit, Info } from "@phosphor-icons/react";
import Link from "next/link";
import posthog from "posthog-js";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart-context";
import { useSkinCoachStore } from "@/lib/store/use-skin-coach-store";
import { sdk } from "@/lib/medusa";
import { LevelRing } from "@/components/ui/skin-coach/level-ring";
import { FaceScanFrame, type FaceMarker } from "@/components/ui/skin-coach/face-scan-frame";
import { DISPLAY_FONT, SK } from "@/components/ui/skin-coach/theme";
import { RoutineAudioPlayer } from "@/components/ui/skin-coach/routine-audio-player";
import { withoutScores } from "@/lib/coach-message";

interface Props {
  result: SkinAnalysisResult;
  onRetake: () => void;
  // not logged in: the diagnostic is shown, the routine and products stay hidden until she creates an account
  locked?: boolean;
}

// The photo analysis gives estimates, not measurements (client feedback, 2026-10-12): each indicator is shown
// as a level, without a number, and there is no overall score nor skin age.
type Tone = 0 | 1 | 2; // 0 = little of it, 2 = a lot of it

function toneOf(value: number): Tone {
  return value < 33 ? 0 : value < 66 ? 1 : 2;
}

type MetricDef = { key: string; label: string; hint: string; value: number | undefined; good?: boolean };

// level shown in the ring: for "bad" indicators the ring fills with the amount, for hydration with how good it is
function ringOf(m: MetricDef): { thirds: 1 | 2 | 3; label: string } {
  const tone = toneOf(Number(m.value));
  if (m.good) return [{ thirds: 1, label: "À renforcer" }, { thirds: 2, label: "Moyenne" }, { thirds: 3, label: "Bonne" }][tone] as { thirds: 1 | 2 | 3; label: string };
  return [{ thirds: 1, label: "Faible" }, { thirds: 2, label: "Modéré" }, { thirds: 3, label: "Marqué" }][tone] as { thirds: 1 | 2 | 3; label: string };
}

// "Peau Mixte à tendance déshydratée" → light "Peau mixte", bold "à tendance déshydratée"
function splitSkinType(type: string): [string, string] {
  const words = (type || "").trim().split(/\s+/);
  if (words.length <= 2) return ["", type];
  return [words.slice(0, 2).join(" "), words.slice(2).join(" ")];
}

// "Hydratant sans rinçage" → ["Hydratant", "sans rinçage"]: first word, then the rest on a second line
function splitStepName(name: string): [string, string] {
  const words = (name || "").trim().split(/\s+/);
  return [words[0] || "", words.slice(1).join(" ")];
}

const fmtPrice = (amount: number, currency: string) =>
  `${Math.round(amount).toLocaleString("fr-FR")} ${currency.toUpperCase() === "XAF" ? "FCFA" : currency.toUpperCase()}`;

// ─── Products of the routine, fetched once ───────────────────────────────────

type ProductInfo = { title: string; brand?: string; thumbnail?: string; handle?: string; variantId?: string; amount?: number; currency: string };

function useRoutineProducts(ids: string[]): Record<string, ProductInfo | null> {
  const [products, setProducts] = useState<Record<string, ProductInfo | null>>({});
  const key = ids.join(",");
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://api.thewelfarecm.com";
    const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";
    let cancelled = false;
    Promise.all(
      ids.map((id) =>
        // prices and collection are not in the default store fields: without them no price was shown
        fetch(`${url}/store/products/${id}?fields=*variants,*variants.prices,*collection`, { headers: { "x-publishable-api-key": pk } })
          .then((r) => (r.ok ? r.json() : null))
          .then((data): [string, ProductInfo | null] => {
            const p = data?.product;
            if (!p) return [id, null];
            const variant = p.variants?.[0];
            const amount = variant?.calculated_price?.calculated_amount ?? variant?.prices?.[0]?.amount;
            return [id, {
              title: p.title,
              brand: p.collection?.title,
              thumbnail: p.thumbnail || p.images?.[0]?.url,
              handle: p.handle,
              variantId: variant?.id,
              amount: amount != null ? Number(amount) : undefined,
              currency: variant?.calculated_price?.currency_code || variant?.prices?.[0]?.currency_code || "XAF",
            }];
          })
          .catch((): [string, ProductInfo | null] => [id, null])
      )
    ).then((entries) => {
      if (!cancelled) setProducts(Object.fromEntries(entries));
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return products;
}

const sectionTitle = (light: string, bold: string) => (
  <h2 style={{ fontFamily: DISPLAY_FONT, fontSize: 30, lineHeight: 1.05, fontWeight: 300, color: SK.ink, margin: 0 }}>
    {light} <span style={{ fontWeight: 700, color: SK.accent }}>{bold}</span>
  </h2>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SkinAnalysisResultView({ result, onRetake, locked = false }: Props) {
  const router = useRouter();
  const cart = useCart();
  const storedPhoto = useSkinCoachStore((s) => s.facePhoto);
  const storedMap = useSkinCoachStore((s) => s.faceMap);
  const faceScanId = useSkinCoachStore((s) => s.faceScanId);
  const setFace = useSkinCoachStore((s) => s.setFace);
  // the face shown must be the one of THIS diagnostic (another scan may still be in memory)
  const thisScanId: string | null = result.scan_id || (result as any).id || null;
  const faceIsThisScan = !!thisScanId && faceScanId === thisScanId;
  const facePhoto = faceIsThisScan ? storedPhoto : null;
  const faceMap = faceIsThisScan ? storedMap : null;

  // reopened diagnostic (account history, reload): her photo and face map come back from the server
  // while her photos are kept; a just-finished scan may still be attaching to her account, so one retry
  useEffect(() => {
    if (locked || !thisScanId || faceIsThisScan) return;
    let cancelled = false;
    const load = async (attempt: number) => {
      try {
        const data: any = await sdk.client.fetch(`/store/skin-scans/${thisScanId}/face`, { method: "GET" });
        if (!cancelled && data?.photo && data?.map) setFace(data.photo, data.map, thisScanId);
      } catch {
        if (!cancelled && attempt === 0) setTimeout(() => load(1), 3000);
      }
    };
    load(0);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, thisScanId, faceIsThisScan]);
  const [addedToCart, setAddedToCart] = useState<Set<string>>(new Set());
  const [addingAll, setAddingAll] = useState(false);
  const [allAdded, setAllAdded] = useState(false);
  const [selectedStep, setSelectedStep] = useState(0);

  const routine = result.kbeauty_routine;
  const productIds = locked ? [] : routine.map((s) => s.medusa_product_id).filter((id): id is string => !!id);
  const products = useRoutineProducts(productIds);

  const metrics = result.metrics;
  const metricDefs: MetricDef[] = metrics
    ? [
        { key: "sebum", label: "Sébum", hint: "Brillance de la peau", value: metrics.sebum_level_percentage },
        { key: "hydration", label: "Hydratation", hint: "Confort et barrière", value: metrics.hydration_barrier_percentage, good: true },
        { key: "acne", label: "Imperfections", hint: "Boutons et points noirs", value: metrics.acne_severity_percentage },
        { key: "pores", label: "Pores", hint: "Visibilité des pores", value: metrics.pore_visibility_percentage },
        { key: "eyes", label: "Contour des yeux", hint: "Cernes et fatigue", value: metrics.eye_contour_fatigue_percentage },
      ].filter((m) => Number.isFinite(Number(m.value)))
    : [];

  // zones drawn on her photo, with the same levels as the rings below
  const faceMarkers: FaceMarker[] = metrics
    ? [
        { zone: "forehead" as const, title: "Zone T", text: ["Peu de brillance", "Brillance modérée", "Brillance marquée"][toneOf(metrics.sebum_level_percentage)]! },
        { zone: "nose" as const, title: "Nez", text: ["Pores discrets", "Pores visibles", "Pores très visibles"][toneOf(metrics.pore_visibility_percentage)]! },
        { zone: "cheekA" as const, title: "Joues", text: ["Hydratation à renforcer", "Hydratation moyenne", "Bonne hydratation"][toneOf(metrics.hydration_barrier_percentage)]! },
      ]
    : [];

  const [skinLight, skinBold] = splitSkinType(result.final_skin_type);
  const concerns = Array.from(new Set(routine.map((s) => s.target_concern).filter(Boolean))) as string[];

  // Kept on the order line, so sales coming from the Skin Coach can be counted
  const lineMetadata = { source: "skin_coach", ...(result.scan_id ? { scan_id: result.scan_id } : {}) };

  useEffect(() => {
    posthog.capture("skin_coach_result_viewed", {
      locked,
      scan_id: result.scan_id,
      steps: routine.length,
      linked_products: routine.filter((s) => s.medusa_product_id).length,
      face_filter: !!(facePhoto && faceMap),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, result]);

  const handleAddToCart = async (variantId: string) => {
    if (addedToCart.has(variantId)) return;
    setAddedToCart((prev) => new Set([...prev, variantId]));
    posthog.capture("skin_coach_add_to_cart", { variant_id: variantId, scan_id: result.scan_id });
    await cart.addItem(variantId, 1, undefined, undefined, undefined, lineMetadata);
  };

  const routineProducts = routine
    .map((s) => (s.medusa_product_id ? products[s.medusa_product_id] : null))
    .filter((p): p is ProductInfo => !!p && !!p.variantId);
  const total = routineProducts.reduce((sum, p) => sum + (p.amount || 0), 0);
  const currency = routineProducts[0]?.currency || "XAF";
  const hasLinkedProducts = routine.some((s) => s.medusa_product_id);

  const handleAddAllToCart = async () => {
    setAddingAll(true);
    const variantIds = routineProducts.map((p) => p.variantId!).filter((id) => !addedToCart.has(id));
    if (variantIds.length > 0) {
      posthog.capture("skin_coach_add_routine", { products: variantIds.length, scan_id: result.scan_id });
      for (const vId of variantIds) {
        await cart.addItem(vId, 1, undefined, undefined, undefined, lineMetadata);
      }
      setAddedToCart((prev) => new Set([...prev, ...variantIds]));
    }
    setAllAdded(true);
    setAddingAll(false);
  };

  const step = routine[Math.min(selectedStep, routine.length - 1)];
  const stepProduct = step?.medusa_product_id ? products[step.medusa_product_id] : null;
  const stepLoading = !!step?.medusa_product_id && !(step.medusa_product_id in products);
  const stepAdded = stepProduct?.variantId ? addedToCart.has(stepProduct.variantId) : false;

  const fadeUp = (delay: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.45, ease: "easeOut" as const } });

  return (
    <div className="min-h-[100dvh] relative w-full flex flex-col font-sans print:h-auto print:block" style={{ background: SK.ground, color: SK.ink }}>
      <div id="pdf-report-content" className="relative flex-1 pb-40 print:pb-10">
        <div className="w-full max-w-md mx-auto px-5 pt-6 flex flex-col gap-7">

          {/* ─── HERO ─── */}
          <motion.div {...fadeUp(0)} className="flex flex-col gap-3.5">
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: SK.muted }}>Votre diagnostic</p>
            <h1 style={{ fontFamily: DISPLAY_FONT, fontSize: 44, lineHeight: 1.02, fontWeight: 300, letterSpacing: "-0.02em", margin: 0 }}>
              {skinLight && <>{skinLight}<br /></>}
              <span style={{ fontWeight: 700, color: SK.accent }}>{skinBold}</span>
            </h1>
            <div className="flex flex-wrap gap-2">
              {result.melanin_phototype && (
                <span className="px-3.5 py-2 rounded-full text-[13px] font-semibold" style={{ background: SK.surface, border: `1px solid ${SK.line}` }}>
                  Phototype · {result.melanin_phototype}
                </span>
              )}
              {concerns.map((c) => (
                <span key={c} className="px-3.5 py-2 rounded-full text-[13px] font-semibold" style={{ background: SK.surface, border: `1px solid ${SK.line}` }}>
                  {c}
                </span>
              ))}
            </div>
            <p className="text-[13px]" style={{ color: SK.muted }}>D&apos;après vos photos et vos réponses au questionnaire</p>
          </motion.div>

          {/* ─── HER PHOTO WITH THE ANALYSIS FILTER (memory after the scan, from the server when reopened) ─── */}
          {facePhoto && faceMap && faceMarkers.length > 0 && (
            <motion.div {...fadeUp(0.1)} className="flex flex-col gap-2.5 print:hidden">
              <FaceScanFrame photo={facePhoto} map={faceMap} markers={faceMarkers} />
              <p className="text-[12px] leading-relaxed text-center" style={{ color: SK.muted }}>
                Zones indicatives : la lumière et les ombres peuvent tromper la photo.
              </p>
            </motion.div>
          )}

          {/* ─── REVIEW BY A SKIN ADVISOR (pilot) ─── */}
          {result.review && (
            <motion.div {...fadeUp(0.15)} className="rounded-[22px] p-4 flex gap-3" style={{ background: "#F2FBF6", border: "1px solid rgba(16,185,129,0.35)" }}>
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#0f9f6e" }} />
              <div>
                <p className="text-[14px] font-bold mb-1" style={{ color: "#0B7A55" }}>
                  {result.review.status === "corrected" ? "Routine revue par une conseillère The Welfare" : "Routine validée par une conseillère The Welfare"}
                </p>
                {result.review.status === "corrected" && (result.review.corrections || []).map((c, idx) => (
                  <p key={idx} className="text-[13px] leading-relaxed">
                    {c.from ? <>{c.from} → <strong>{c.to}</strong></> : <strong>{c.to}</strong>} : {c.reason}
                  </p>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── LEVELS ─── */}
          {metricDefs.length > 0 && (
            <motion.div {...fadeUp(0.2)} className="flex flex-col gap-4">
              {sectionTitle("Ce que montrent", "vos photos")}
              <div className="grid grid-cols-2 gap-3">
                {metricDefs.map((m, i) => {
                  const ring = ringOf(m);
                  const wide = metricDefs.length % 2 === 1 && i === metricDefs.length - 1;
                  return (
                    <div
                      key={m.key}
                      role="img"
                      aria-label={`${m.label} : ${ring.label}`}
                      className={`rounded-[26px] pt-4 pb-[18px] px-3.5 flex flex-col items-center gap-2.5 ${wide ? "col-span-2" : ""}`}
                      style={{ background: SK.surface, border: `1px solid ${SK.lineSoft}` }}
                    >
                      <div className="self-start text-[13px] font-semibold" style={{ color: SK.muted }}>{m.label}</div>
                      <LevelRing thirds={ring.thirds} label={ring.label} delay={i * 0.1} />
                      <div className="text-[12px] leading-snug text-center" style={{ color: SK.muted }}>{m.hint}</div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: SK.muted }}>
                Estimations visuelles faites d&apos;après vos photos, à titre indicatif : ce ne sont pas des mesures, et elles peuvent varier
                avec la lumière ou la qualité des photos. Votre routine tient aussi compte de vos réponses au questionnaire.
              </p>
            </motion.div>
          )}

          {/* ─── COACH MESSAGE ─── */}
          {result.empathetic_message && (
            <motion.div {...fadeUp(0.25)} className="rounded-[26px] p-5 flex flex-col gap-2.5" style={{ background: SK.tint }}>
              <svg width="30" height="24" viewBox="0 0 30 24" aria-hidden="true">
                <path d="M0 24V14C0 6 4 1.5 12 0l1.4 3.4C8.8 4.8 6.8 7.6 6.6 11H12v13H0zm17 0V14c0-8 4-12.5 12-14l1 3.4C25.8 4.8 23.8 7.6 23.6 11H29v13H17z" fill={SK.accent} />
              </svg>
              <p style={{ fontFamily: DISPLAY_FONT, fontSize: 20, lineHeight: 1.35, fontWeight: 400, margin: 0, whiteSpace: "pre-line" }}>
                {withoutScores(result.empathetic_message)}
              </p>
              <div className="text-[13px] font-semibold" style={{ color: SK.muted }}>Votre Skin Coach</div>
              {/* the message read aloud (accounts only, like the routine) */}
              {!locked && result.audio && <RoutineAudioPlayer audio={result.audio} scanId={result.scan_id} />}
            </motion.div>
          )}

          {/* ─── NOTICES (decided in code: doctor's opinion, treatment, budget, missing step) ─── */}
          {result.notices && result.notices.length > 0 && (
            <div className="flex flex-col gap-3">
              {result.notices.map((notice, idx) => {
                const strong = notice.kind === "referral";
                return (
                  <div key={idx} className="rounded-[22px] p-4 flex gap-3" style={{ background: strong ? SK.tint : SK.surface, border: `1px solid ${strong ? SK.accent : SK.line}` }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: strong ? SK.accent : SK.tint }}>
                      {strong ? <FirstAidKit className="w-4 h-4 text-white" /> : <Info className="w-4 h-4" style={{ color: SK.accent }} />}
                    </div>
                    <div>
                      {strong && <p className="text-[14px] font-bold mb-1">Avis dermatologique recommandé</p>}
                      <p className="text-[14px] leading-relaxed">{notice.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── ROUTINE ─── */}
          <motion.div {...fadeUp(0.3)} className="flex flex-col gap-4">
            <div className="flex items-end justify-between gap-3">
              {sectionTitle("Votre", "routine")}
              <span className="text-[13px] font-semibold shrink-0" style={{ color: SK.muted }}>
                {routine.length} étape{routine.length > 1 ? "s" : ""}
              </span>
            </div>

            {locked ? (
              // Free preview: the steps are named, the products and explanations stay for account holders
              <div className="rounded-[26px] p-5 flex flex-col gap-3" style={{ background: SK.surface, border: `1px solid ${SK.lineSoft}` }}>
                {routine.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[16px] font-semibold" style={{ background: SK.tint, fontFamily: DISPLAY_FONT }}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold truncate">{s.step_name}</p>
                      <div className="mt-1.5 h-2.5 rounded-full w-2/3" style={{ background: SK.lineSoft }} />
                    </div>
                    <LockKey className="w-5 h-5 shrink-0" style={{ color: SK.muted }} />
                  </div>
                ))}
                <p className="text-[14px] leading-relaxed pt-3" style={{ borderTop: `1px solid ${SK.lineSoft}` }}>
                  Votre routine de {routine.length} étape{routine.length > 1 ? "s" : ""} est prête. Créez votre compte gratuit pour découvrir
                  les produits choisis pour vous, leurs conseils d&apos;utilisation, et retrouver ce diagnostic à tout moment.
                </p>
              </div>
            ) : routine.length > 0 && step ? (
              <>

                {/* steps */}
                <div className="flex gap-2 overflow-x-auto pb-1 print:hidden">
                  {routine.map((s, i) => {
                    const active = i === Math.min(selectedStep, routine.length - 1);
                    const [first, rest] = splitStepName(s.step_name);
                    const p = s.medusa_product_id ? products[s.medusa_product_id] : null;
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedStep(i)}
                        aria-pressed={active}
                        className="flex-1 min-w-[96px] min-h-[96px] rounded-[20px] px-2 py-2.5 flex flex-col items-center justify-center gap-1"
                        style={{ background: active ? SK.accent : SK.surface, border: active ? "none" : `1px solid ${SK.line}`, color: active ? "#FFFFFF" : SK.ink }}
                      >
                        <span style={{ fontFamily: DISPLAY_FONT, fontSize: 22, fontWeight: 600, lineHeight: 1 }}>{i + 1}</span>
                        <span className="text-[12px] leading-tight text-center">
                          <span className="block font-bold">{first}</span>
                          {rest && <span className="block font-medium line-clamp-1">{rest}</span>}
                        </span>
                        {p?.amount != null && (
                          <span className="text-[12px] font-bold whitespace-nowrap" style={{ color: active ? "#FFFFFF" : SK.accent }}>
                            {fmtPrice(p.amount, p.currency)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* product of the selected step */}
                <div className="rounded-[30px] overflow-hidden print:hidden" style={{ background: SK.surface, border: `1px solid ${SK.lineSoft}` }}>
                  <div className="relative h-[240px] flex items-center justify-center" style={{ background: `radial-gradient(90% 90% at 50% 40%, #FFFFFF 0%, ${SK.tint} 100%)` }}>
                    {stepLoading ? (
                      <div className="w-40 h-40 rounded-3xl animate-pulse" style={{ background: SK.lineSoft }} />
                    ) : stepProduct?.thumbnail ? (
                      <img src={stepProduct.thumbnail} alt={stepProduct.title} className="h-[200px] w-[200px] object-contain" />
                    ) : (
                      <Package className="w-12 h-12" style={{ color: SK.muted }} />
                    )}
                    <span className="absolute top-3.5 left-3.5 px-3 py-1.5 rounded-full text-[12px] font-bold text-white" style={{ background: SK.accent }}>
                      Étape {Math.min(selectedStep, routine.length - 1) + 1} · {step.step_name}
                    </span>
                  </div>
                  <div className="px-5 pt-[18px] pb-5 flex flex-col gap-2.5">
                    {stepProduct?.brand && (
                      <p className="text-[12px] font-bold uppercase tracking-[0.08em]" style={{ color: SK.muted }}>{stepProduct.brand}</p>
                    )}
                    <p style={{ fontFamily: DISPLAY_FONT, fontSize: 22, lineHeight: 1.2, fontWeight: 600, margin: 0 }}>
                      {stepProduct?.title || step.product_name || "Produit recommandé"}
                    </p>
                    {(step.explanation_for_client || step.explanation) && (
                      <p className="text-[14px] leading-relaxed" style={{ color: "#3F3331" }}>
                        <span className="font-bold">Pourquoi pour vous : </span>
                        {step.explanation_for_client || step.explanation}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-3 mt-1">
                      <div style={{ fontFamily: DISPLAY_FONT, fontSize: 24, fontWeight: 600 }}>
                        {stepProduct?.amount != null ? fmtPrice(stepProduct.amount, stepProduct.currency) : ""}
                      </div>
                      <div className="flex gap-2">
                        {stepProduct?.handle && (
                          <button
                            onClick={() => router.push(`/shop/${stepProduct.handle}`)}
                            aria-label="Voir la fiche produit"
                            className="w-[46px] h-[46px] rounded-full flex items-center justify-center"
                            style={{ border: `1px solid ${SK.line}` }}
                          >
                            <CaretRight className="w-4 h-4" />
                          </button>
                        )}
                        {stepProduct?.variantId ? (
                          <button
                            onClick={() => handleAddToCart(stepProduct.variantId!)}
                            className="h-[46px] px-[18px] rounded-full text-[14px] font-bold flex items-center gap-1.5"
                            style={stepAdded ? { background: SK.tint, color: SK.ink } : { background: SK.surface, border: `1px solid ${SK.ink}`, color: SK.ink }}
                          >
                            {stepAdded ? <><CheckCircle className="w-4 h-4" style={{ color: SK.accent }} /> Ajouté</> : <><Plus className="w-4 h-4" /> Ajouter</>}
                          </button>
                        ) : !stepLoading ? (
                          <button
                            onClick={() => router.push("/shop")}
                            className="h-[46px] px-[18px] rounded-full text-[14px] font-bold"
                            style={{ border: `1px solid ${SK.line}` }}
                          >
                            Voir la boutique
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                {/* printed report: every step */}
                <div className="hidden print:flex flex-col gap-3">
                  {routine.map((s, i) => {
                    const p = s.medusa_product_id ? products[s.medusa_product_id] : null;
                    return (
                      <div key={i} className="rounded-2xl p-4" style={{ border: `1px solid ${SK.line}` }}>
                        <p className="font-bold">{i + 1}. {s.step_name} — {p?.title || s.product_name}</p>
                        <p className="text-[13px] mt-1">{s.explanation_for_client || s.explanation}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
          </motion.div>

          {/* ─── MEDICAL DISCLAIMER ─── */}
          <p className="text-[12px] leading-relaxed text-center px-2" style={{ color: SK.muted }}>
            Ce diagnostic est établi par une intelligence artificielle à partir de vos photos et de vos réponses. Il ne constitue pas un avis médical et ne remplace pas la consultation d&apos;un dermatologue. En cas de lésions, de douleur, d&apos;irritation persistante, de grossesse ou de traitement en cours, demandez conseil à un professionnel de santé avant de commencer une nouvelle routine.
          </p>

          {/* out of the sticky bar: it hid too much of the page on phones */}
          <button
            onClick={onRetake}
            className="self-center h-12 px-5 rounded-full flex items-center justify-center gap-2 text-[14px] font-semibold print:hidden"
            style={{ color: SK.ink, border: `1px solid ${SK.line}`, background: SK.surface }}
          >
            <ArrowCounterClockwise className="w-4 h-4" />
            Refaire le diagnostic
          </button>
        </div>
      </div>

      {/* ─── STICKY BOTTOM ─── */}
      <motion.div
        initial={{ y: 120 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.6, type: "spring", bounce: 0.2 }}
        className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-4 print:hidden"
        style={{ background: `linear-gradient(to top, ${SK.ground} 75%, rgba(251,248,249,0))` }}
      >
        <div className="w-full max-w-md mx-auto flex flex-col gap-2">
          {locked ? (
            <>
              <Link
                href="/account/register?redirect=/skin-coach/result"
                onClick={() => posthog.capture("skin_coach_signup_clicked", { scan_id: result.scan_id })}
                className="w-full h-[60px] rounded-full font-bold text-[16px] flex justify-center items-center gap-2.5 active:scale-[0.98] transition-transform"
                style={{ background: SK.accent, color: "#FFFFFF" }}
              >
                <LockKey className="w-5 h-5" /> Découvrir ma routine
              </Link>
              <Link
                href="/account/login?redirect=/skin-coach/result"
                onClick={() => posthog.capture("skin_coach_login_clicked", { scan_id: result.scan_id })}
                className="w-full h-[52px] flex items-center justify-center text-[15px] font-semibold rounded-full"
                style={{ background: SK.surface, border: `1px solid ${SK.line}`, color: SK.ink }}
              >
                J&apos;ai déjà un compte
              </Link>
            </>
          ) : (
            <div className="flex gap-2">
              {hasLinkedProducts ? (
                <button
                  onClick={handleAddAllToCart}
                  disabled={addingAll || allAdded || routineProducts.length === 0}
                  className="flex-1 h-[60px] px-5 rounded-full font-bold text-[16px] flex justify-center items-center gap-2.5 active:scale-[0.98] transition-transform disabled:opacity-80"
                  style={{ background: allAdded ? SK.ink : SK.accent, color: "#FFFFFF" }}
                >
                  {allAdded ? (
                    <><CheckCircle className="w-5 h-5" /> Routine ajoutée</>
                  ) : addingAll ? (
                    <>Ajout en cours…</>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5 shrink-0" />
                      <span className="flex flex-col items-start leading-tight">
                        <span className="text-[16px] font-bold whitespace-nowrap">Ajouter la routine</span>
                        {total > 0 && <span className="text-[13px] font-semibold whitespace-nowrap" style={{ opacity: 0.9 }}>{fmtPrice(total, currency)}</span>}
                      </span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => router.push("/shop")}
                  className="flex-1 h-[60px] px-5 rounded-full font-bold text-[16px] flex justify-center items-center gap-2.5"
                  style={{ background: SK.accent, color: "#FFFFFF" }}
                >
                  <ShoppingBag className="w-5 h-5" /> Découvrir ma sélection
                </button>
              )}
              <button
                onClick={() => window.print()}
                aria-label="Imprimer ou enregistrer le rapport en PDF"
                className="w-[60px] h-[60px] shrink-0 flex items-center justify-center rounded-full"
                style={{ background: SK.surface, border: `1px solid ${SK.line}`, color: SK.ink }}
              >
                <Printer className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
