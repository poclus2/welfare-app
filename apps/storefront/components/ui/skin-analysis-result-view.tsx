"use client";

import { motion } from "framer-motion";
import { SkinAnalysisResult } from "@/app/actions/analyze-skin";
import { ShoppingBag, ArrowCounterClockwise, CaretRight, Package, Plus, CheckCircle, FilePdf, CircleNotch, LockKey, FirstAidKit, Info, WhatsappLogo, Moon } from "@phosphor-icons/react";
import { ADVISOR_WHATSAPP } from "@/lib/contact";
import Link from "next/link";
import posthog from "posthog-js";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/lib/cart-context";
import { useSkinCoachStore } from "@/lib/store/use-skin-coach-store";
import { sdk } from "@/lib/medusa";
import { LevelRing } from "@/components/ui/skin-coach/level-ring";
import { FaceScanFrame, type FaceMarker } from "@/components/ui/skin-coach/face-scan-frame";
import { DISPLAY_FONT, SK } from "@/components/ui/skin-coach/theme";
import { RoutineAudioPlayer } from "@/components/ui/skin-coach/routine-audio-player";
import { withoutScores } from "@/lib/coach-message";
import { faceMarkersOf, metricDefsOf, ringOf } from "@/lib/skin-levels";
import { useRoutineProducts, type ProductInfo } from "@/lib/routine-products";

interface Props {
  result: SkinAnalysisResult;
  onRetake: () => void;
  // not logged in: the diagnostic is shown, the routine and products stay hidden until she creates an account
  locked?: boolean;
}

// The photo analysis gives estimates, not measurements: each indicator is shown as a level (lib/skin-levels.ts)

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
  // What is "added" comes from the real cart: a product she removes from the cart can be added again.
  // `adding` holds the variants on their way to the cart, shown as added at once (back if it fails);
  // the ref stops a second tap from adding them twice before the state is updated.
  const [adding, setAdding] = useState<Set<string>>(new Set());
  const addingRef = useRef<Set<string>>(new Set());
  const [addingAll, setAddingAll] = useState(false);
  const inCart = new Set(cart.items.map((i) => i.variantId));
  const isAdded = (variantId: string) => inCart.has(variantId) || adding.has(variantId);
  const markAdding = (ids: string[], on: boolean) => {
    ids.forEach((id) => (on ? addingRef.current.add(id) : addingRef.current.delete(id)));
    setAdding(new Set(addingRef.current));
  };
  const [selectedStep, setSelectedStep] = useState(0);

  const routine = result.kbeauty_routine;
  const productIds = locked ? [] : routine.map((s) => s.medusa_product_id).filter((id): id is string => !!id);
  const products = useRoutineProducts(productIds);

  const metrics = result.metrics;
  const metricDefs = metricDefsOf(metrics);

  // zones drawn on her photo, with the same levels as the rings below
  const faceMarkers: FaceMarker[] = faceMarkersOf(metrics);

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
    if (addingRef.current.has(variantId)) return;
    if (inCart.has(variantId)) return cart.openCart(); // already there: show it rather than add a second one
    markAdding([variantId], true);
    posthog.capture("skin_coach_add_to_cart", { variant_id: variantId, scan_id: result.scan_id });
    await cart.addMissingItems([variantId], lineMetadata);
    markAdding([variantId], false);
  };

  // "Ajouter la routine" and its total: what she needs to buy, not the products she already has
  const routineProducts = routine
    .filter((s) => !s.already_owned)
    .map((s) => (s.medusa_product_id ? products[s.medusa_product_id] : null))
    .filter((p): p is ProductInfo => !!p && !!p.variantId);
  const total = routineProducts.reduce((sum, p) => sum + (p.amount || 0), 0);
  const currency = routineProducts[0]?.currency || "XAF";
  const hasLinkedProducts = routine.some((s) => s.medusa_product_id);

  // the same product can come back in two steps: one of each
  const routineVariantIds = Array.from(new Set(routineProducts.map((p) => p.variantId!)));
  const allAdded = routineVariantIds.length > 0 && routineVariantIds.every(isAdded);
  // the button adds what is missing from the cart: its price is the price of that
  const missingTotal = routineProducts.filter((p, i, all) => !isAdded(p.variantId!) && all.findIndex((q) => q.variantId === p.variantId) === i)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const handleAddAllToCart = async () => {
    // what is missing from the cart only, so the products still there are not added twice
    const variantIds = routineVariantIds.filter((id) => !inCart.has(id) && !addingRef.current.has(id));
    if (addingAll || variantIds.length === 0) return;
    setAddingAll(true);
    markAdding(variantIds, true);
    posthog.capture("skin_coach_add_routine", { products: variantIds.length, scan_id: result.scan_id });
    await cart.addMissingItems(variantIds, lineMetadata);
    markAdding(variantIds, false);
    setAddingAll(false);
  };

  // ─── PDF of the diagnostic (components/ui/skin-coach/diagnostic-pdf.tsx, loaded on the first tap) ───
  const [pdfState, setPdfState] = useState<"idle" | "busy" | "error">("idle");
  const plainSpaces = (s: string) => s.replace(/[\u202f\u00a0]/g, " "); // the PDF fonts have no narrow space
  const handleDownloadPdf = async () => {
    if (pdfState === "busy") return;
    setPdfState("busy");
    posthog.capture("skin_coach_pdf_requested", { scan_id: thisScanId });
    try {
      const [{ downloadDiagnosticPdf }, me] = await Promise.all([
        import("@/components/ui/skin-coach/diagnostic-pdf"),
        sdk.store.customer.retrieve().catch(() => null),
      ]);
      await downloadDiagnosticPdf({
        firstName: (me as any)?.customer?.first_name || undefined,
        date: (result as any).created_at ? new Date((result as any).created_at) : new Date(),
        skinType: result.final_skin_type,
        phototype: result.melanin_phototype,
        concerns,
        levels: metricDefs.map((m) => {
          const r = ringOf(m);
          return { label: m.label, level: r.label, thirds: r.thirds, hint: m.hint };
        }),
        message: withoutScores(result.empathetic_message),
        notices: result.notices || [],
        reviewed: result.review?.status,
        face: facePhoto && faceMap && faceMarkers.length ? { photo: facePhoto, map: faceMap, markers: faceMarkers } : undefined,
        routine: routine.map((s) => {
          const p = s.medusa_product_id ? products[s.medusa_product_id] : null;
          return {
            stepName: s.evening_only && !/soir/i.test(s.step_name) ? `${s.step_name} (le soir)` : s.step_name,
            productTitle: p?.title || s.product_name || "Produit recommandé",
            brand: p?.brand,
            price: p?.amount != null ? plainSpaces(fmtPrice(p.amount, p.currency)) : undefined,
            imageUrl: p?.thumbnail,
            why: s.explanation_for_client || s.explanation,
          };
        }),
        total: total > 0 ? plainSpaces(fmtPrice(total, currency)) : undefined,
      });
      setPdfState("idle");
    } catch (e) {
      console.error("[SkinCoach] PDF failed", e);
      setPdfState("error");
    }
  };

  // Advisor's opinion on WhatsApp (client request, 2026-10-18): the scan was given to an advisor, who already
  // has it in her space (/conseillere), so the message only carries its reference. Her number comes with the
  // analysis, then from the server once the scan is in her account (it may go to her usual advisor then);
  // the shop's number when no advisor is active.
  const [advisorWhatsapp, setAdvisorWhatsapp] = useState(result.advisor?.whatsapp || ADVISOR_WHATSAPP);
  useEffect(() => {
    if (locked || !thisScanId) return;
    let cancelled = false;
    const load = async (attempt: number) => {
      try {
        const data: any = await sdk.client.fetch(`/store/skin-scans/${thisScanId}/advisor`, { method: "GET" });
        if (!cancelled && data?.advisor?.whatsapp) setAdvisorWhatsapp(data.advisor.whatsapp);
      } catch {
        // not attached to her account yet: once more after the claim
        if (!cancelled && attempt === 0) setTimeout(() => load(1), 3000);
      }
    };
    load(0);
    return () => { cancelled = true; };
  }, [locked, thisScanId]);
  const advisorText = [
    "Bonjour, j'aimerais l'avis d'une conseillère sur la routine proposée par le Skin Coach.",
    ...(thisScanId ? [`Diagnostic n° ${thisScanId}`] : []),
  ].join("\n");
  const advisorUrl = `https://wa.me/${advisorWhatsapp}?text=${encodeURIComponent(advisorText)}`;

  const step = routine[Math.min(selectedStep, routine.length - 1)];
  const stepProduct = step?.medusa_product_id ? products[step.medusa_product_id] : null;
  const stepLoading = !!step?.medusa_product_id && !(step.medusa_product_id in products);
  const stepAdded = stepProduct?.variantId ? isAdded(stepProduct.variantId) : false;

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
                      <img src={stepProduct.thumbnail} alt={stepProduct.title} width={200} height={200} decoding="async" className="h-[200px] w-[200px] object-contain" />
                    ) : (
                      <Package className="w-12 h-12" style={{ color: SK.muted }} />
                    )}
                    <span className="absolute top-3.5 left-3.5 px-3 py-1.5 rounded-full text-[12px] font-bold text-white" style={{ background: SK.accent }}>
                      Étape {Math.min(selectedStep, routine.length - 1) + 1} · {step.step_name}
                    </span>
                  </div>
                  <div className="px-5 pt-[18px] pb-5 flex flex-col gap-2.5">
                    {step.already_owned && (
                      <span className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold" style={{ background: SK.tint, color: SK.ink }}>
                        <CheckCircle className="w-3.5 h-3.5" weight="fill" style={{ color: SK.accent }} /> Déjà dans votre routine
                      </span>
                    )}
                    {step.evening_only && (
                      <span className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold" style={{ background: SK.ground, border: `1px solid ${SK.line}`, color: SK.ink }}>
                        <Moon className="w-3.5 h-3.5" weight="fill" style={{ color: SK.accent }} /> Le soir, avant le nettoyant (double nettoyage)
                      </span>
                    )}
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
                            aria-busy={adding.has(stepProduct.variantId)}
                            className="h-[46px] px-[18px] rounded-full text-[14px] font-bold flex items-center gap-1.5 active:scale-[0.97] transition-transform"
                            style={stepAdded ? { background: SK.tint, color: SK.ink } : { background: SK.surface, border: `1px solid ${SK.ink}`, color: SK.ink }}
                          >
                            {stepAdded ? <>{adding.has(stepProduct.variantId) ? <CircleNotch className="w-4 h-4 animate-spin" style={{ color: SK.accent }} /> : <CheckCircle className="w-4 h-4" style={{ color: SK.accent }} />} Ajouté</> : <><Plus className="w-4 h-4" /> Ajouter</>}
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

          {/* ─── ADVISOR ON WHATSAPP ─── */}
          {!locked && routine.length > 0 && (
            <div className="rounded-[26px] p-5 flex flex-col gap-3 print:hidden" style={{ background: SK.surface, border: `1px solid ${SK.lineSoft}` }}>
              <p style={{ fontFamily: DISPLAY_FONT, fontSize: 22, lineHeight: 1.15, fontWeight: 300, margin: 0 }}>
                Un doute sur <span style={{ fontWeight: 700 }}>votre routine ?</span>
              </p>
              <p className="text-[14px] leading-relaxed" style={{ color: SK.muted }}>
                Une conseillère The Welfare relit votre diagnostic et vous répond sur WhatsApp.
              </p>
              <a
                href={advisorUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => posthog.capture("skin_coach_advisor_whatsapp", { scan_id: thisScanId })}
                className="h-[52px] rounded-full flex items-center justify-center gap-2 text-[15px] font-bold active:scale-[0.98] transition-transform"
                style={{ border: `1px solid ${SK.ink}`, color: SK.ink }}
              >
                <WhatsappLogo className="w-5 h-5" weight="fill" style={{ color: "#25D366" }} />
                Demander l&apos;avis d&apos;une conseillère
              </a>
            </div>
          )}

          {/* ─── MEDICAL DISCLAIMER ─── */}
          <p className="text-[12px] leading-relaxed text-center px-2" style={{ color: SK.muted }}>
            Ce diagnostic est établi par une intelligence artificielle à partir de vos photos et de vos réponses. Il ne constitue pas un avis médical et ne remplace pas la consultation d&apos;un dermatologue. En cas de lésions, de douleur, d&apos;irritation persistante, de grossesse ou de traitement en cours, demandez conseil à un professionnel de santé avant de commencer une nouvelle routine.
          </p>

          {!locked && (
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={handleDownloadPdf}
                disabled={pdfState === "busy"}
                className="h-[52px] px-6 rounded-full flex items-center justify-center gap-2 text-[15px] font-bold disabled:opacity-70"
                style={{ background: SK.tint, color: SK.ink }}
              >
                {pdfState === "busy" ? <CircleNotch className="w-5 h-5 animate-spin" /> : <FilePdf className="w-5 h-5" style={{ color: SK.accent }} />}
                {pdfState === "busy" ? "Préparation du PDF…" : "Télécharger mon diagnostic (PDF)"}
              </button>
              {pdfState === "error" && <p className="text-[13px]" style={{ color: SK.accent }}>Le PDF n'a pas pu être préparé. Réessayez.</p>}
            </div>
          )}

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
                  {addingAll ? (
                    <><CircleNotch className="w-5 h-5 animate-spin" /> Ajout en cours…</>
                  ) : allAdded ? (
                    <><CheckCircle className="w-5 h-5" /> Routine ajoutée</>
                  ) : routine.every((s) => !s.medusa_product_id || s.already_owned) ? (
                    <><CheckCircle className="w-5 h-5" /> Vous avez déjà tout</>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5 shrink-0" />
                      <span className="flex flex-col items-start leading-tight">
                        <span className="text-[16px] font-bold whitespace-nowrap">Ajouter la routine</span>
                        {missingTotal > 0 && <span className="text-[13px] font-semibold whitespace-nowrap" style={{ opacity: 0.9 }}>{fmtPrice(missingTotal, currency)}</span>}
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
                onClick={handleDownloadPdf}
                disabled={pdfState === "busy"}
                aria-label="Télécharger mon diagnostic en PDF"
                className="w-[60px] h-[60px] shrink-0 flex items-center justify-center rounded-full disabled:opacity-70"
                style={{ background: SK.surface, border: `1px solid ${SK.line}`, color: SK.ink }}
              >
                {pdfState === "busy" ? <CircleNotch className="w-6 h-6 animate-spin" /> : <FilePdf className="w-6 h-6" />}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
