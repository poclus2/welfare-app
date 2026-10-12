"use client";

import { motion, Variants } from "framer-motion";
import { SkinAnalysisResult, RoutineStep } from "@/app/actions/analyze-skin";
import {  Drop, Eye, Lightning, Sun, ShoppingBag, ArrowCounterClockwise, CaretRight, TrendUp, Package, Plus, CheckCircle, Printer, LockKey, FirstAidKit, Info } from "@phosphor-icons/react";
import Link from "next/link";
import posthog from "posthog-js";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart-context";
import { IconIA } from "@/components/ui/icons/IconIA";

interface Props {
  result: SkinAnalysisResult;
  onRetake: () => void;
  // not logged in: the diagnostic is shown, the routine and products stay hidden until she creates an account
  locked?: boolean;
}

// The photo analysis gives estimates, not measurements (client feedback, 2026-10-12): each indicator is shown
// as a level, without a number, and there is no overall score nor skin age.
type Level = { label: string; tone: 0 | 1 | 2 }; // 0 = fine, 2 = to take care of

function levelOf(value: number, type: "good" | "bad"): Level {
  if (type === "good") return value >= 66 ? { label: "Bonne", tone: 0 } : value >= 33 ? { label: "Moyenne", tone: 1 } : { label: "Faible", tone: 2 };
  return value < 33 ? { label: "Faible", tone: 0 } : value < 66 ? { label: "Modéré", tone: 1 } : { label: "Marqué", tone: 2 };
}

const TONE_COLOR = ["#10b981", "#f59e0b", "#f87171"];

interface MetricCardProps {
  label: string;
  value: number;
  type: "good" | "bad";
  icon: React.ReactNode;
  delay: number;
}

const MetricCard = ({ label, value, type, icon, delay }: MetricCardProps) => {
  const level = levelOf(value, type);
  const filled = type === "good" ? 3 - level.tone : level.tone + 1; // segments lit: how much of it there is
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: "white", border: "1px solid rgba(200,134,138,0.15)", boxShadow: "0 2px 10px rgba(200,134,138,0.08)" }}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(200,134,138,0.1)", border: "1px solid rgba(200,134,138,0.18)" }}>
          {icon}
        </div>
        <span className="text-xs font-semibold leading-tight" style={{ color: "rgba(61,43,45,0.6)" }}>{label}</span>
      </div>
      <div>
        <span className="text-lg font-black" style={{ color: TONE_COLOR[level.tone] }}>{level.label}</span>
        <div className="flex gap-1 mt-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full"
              style={{ background: i < filled ? TONE_COLOR[level.tone] : "rgba(200,134,138,0.12)" }} />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Product Card (fetches real Medusa data) ─────────────────────────────────

interface ProductInfo {
  title: string;
  brand?: string;
  thumbnail?: string;
  price?: string;
  handle?: string;
  variantId?: string;
}

function useProductInfo(productId?: string): ProductInfo | null {
  const [product, setProduct] = useState<ProductInfo | null>(null);

  useEffect(() => {
    if (!productId) return;
    const url = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://api.thewelfare.store";
    const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

    fetch(`${url}/store/products/${productId}?fields=*variants,*variants.prices`, {
      headers: { "x-publishable-api-key": key },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const p = data?.product;
        if (!p) return;
        const variant = p.variants?.[0];
        
        // calculated_price requires a region — fall back to raw prices array
        const calculatedAmount = variant?.calculated_price?.calculated_amount;
        const rawPrice = variant?.prices?.[0];
        const amount = calculatedAmount ?? rawPrice?.amount;
        const currency = (variant?.calculated_price?.currency_code || rawPrice?.currency_code || "XAF").toUpperCase();
        
        // Thumbnail: prefer product.thumbnail, fallback to first image
        const thumbnail = p.thumbnail || p.images?.[0]?.url;
        
        setProduct({
          title: p.title,
          brand: p.collection?.title,
          thumbnail,
          handle: p.handle,
          variantId: variant?.id,
          // Convert from cents if > 10000 (Medusa stores some currencies in subunits)
          price: amount != null ? `${Number(amount).toLocaleString("fr-FR")} ${currency}` : undefined,
        });
      })
      .catch((e) => {
        console.warn(`[ProductCard] Failed to fetch product ${productId}:`, e);
      });
  }, [productId]);

  return product;
}

// ─── Routine Step Card ───────────────────────────────────────────────────────

const stepColors = [
  { bg: "rgba(99,102,241,0.07)", border: "rgba(99,102,241,0.18)", num: "#6366f1" },
  { bg: "rgba(20,184,166,0.07)", border: "rgba(20,184,166,0.18)", num: "#14b8a6" },
  { bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.18)", num: "#f59e0b" },
  { bg: "rgba(239,68,68,0.07)", border: "rgba(239,68,68,0.18)", num: "#ef4444" },
  { bg: "rgba(139,92,246,0.07)", border: "rgba(139,92,246,0.18)", num: "#8b5cf6" },
];

function RoutineStepCard({
  step,
  idx,
  onAddToCart,
  addedToCart,
}: {
  step: RoutineStep;
  idx: number;
  onAddToCart: (variantId: string) => void;
  addedToCart: Set<string>;
}) {
  const router = useRouter();
  const colors = stepColors[idx % stepColors.length] ?? stepColors[0]!;
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const isAdded = productInfo?.variantId ? addedToCart.has(productInfo.variantId) : false;

  const stepName = step.step_name || step.category || "";
  const explanation = step.explanation_for_client || step.explanation || "";

  // Fetch product info directly inside the card for better control
  useEffect(() => {
    if (!step.medusa_product_id) return;
    
    console.log("[SkinCoach] Fetching product:", step.medusa_product_id);
    setLoadingProduct(true);
    
    const url = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://api.thewelfare.store";
    const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

    fetch(`${url}/store/products/${step.medusa_product_id}`, {
      headers: { "x-publishable-api-key": key },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} for ${step.medusa_product_id}`);
        return r.json();
      })
      .then((data) => {
        const p = data?.product;
        if (!p) {
          console.warn("[SkinCoach] No product in response for:", step.medusa_product_id);
          return;
        }
        const variant = p.variants?.[0];
        const calculatedAmount = variant?.calculated_price?.calculated_amount;
        const rawPrice = variant?.prices?.[0];
        const amount = calculatedAmount ?? rawPrice?.amount;
        const currency = (variant?.calculated_price?.currency_code || rawPrice?.currency_code || "XAF").toUpperCase();
        const thumbnail = p.thumbnail || p.images?.[0]?.url;
        
        console.log("[SkinCoach] Product loaded:", p.title, "thumbnail:", thumbnail, "price:", amount, currency);
        
        setProductInfo({
          title: p.title,
          brand: p.collection?.title,
          thumbnail,
          handle: p.handle,
          variantId: variant?.id,
          price: amount != null ? `${Number(amount).toLocaleString("fr-FR")} ${currency}` : undefined,
        });
      })
      .catch((e) => {
        console.warn("[SkinCoach] Product fetch error:", e.message);
      })
      .finally(() => {
        setLoadingProduct(false);
      });
  }, [step.medusa_product_id]);

  // Immediate display name from Claude (while product loads or if fetch fails)
  const displayName = productInfo?.title || step.product_name || "Produit recommandé";

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + idx * 0.08, type: "spring", bounce: 0.2 }}
      className="rounded-2xl overflow-hidden mb-4"
      style={{ border: `1px solid ${colors.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}
    >
      <div className="p-4 flex gap-4 items-start" style={{ background: colors.bg }}>
        <div className="text-2xl font-black shrink-0 w-8 text-center leading-none pt-0.5"
          style={{ color: colors.num, fontFeatureSettings: '"tnum"' }}>
          {String(step.step_number).padStart(2, "0")}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold mb-1 leading-snug" style={{ color: "#3D2B2D" }}>{stepName}</p>
          <p className="text-[13px] leading-relaxed" style={{ color: "rgba(61,43,45,0.65)" }}>{explanation}</p>
        </div>
      </div>

      {/* Product block — always shown if medusa_product_id present, with loading state */}
      {step.medusa_product_id && (
        <div className="bg-white p-4 flex gap-4">
          {/* Thumbnail */}
          <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center relative"
            style={{ border: "1px solid rgba(200,134,138,0.15)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", background: "rgba(253,248,247,1)" }}>
            {loadingProduct ? (
              <div className="w-full h-full animate-pulse" style={{ background: "rgba(200,134,138,0.1)" }} />
            ) : productInfo?.thumbnail ? (
              <img src={productInfo.thumbnail} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-6 h-6" style={{ color: "rgba(61,43,45,0.2)" }} />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            {/* Brand */}
            {loadingProduct ? (
              <div className="h-3 w-16 rounded-full mb-1 animate-pulse" style={{ background: "rgba(200,134,138,0.15)" }} />
            ) : productInfo?.brand ? (
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(176,96,104,0.7)" }}>
                {productInfo.brand}
              </p>
            ) : null}

            {/* Title — show Claude's product_name immediately */}
            <p className="text-[13px] font-bold leading-snug line-clamp-2 mb-1.5" style={{ color: "#3D2B2D" }}>
              {displayName}
            </p>

            {/* Price */}
            {loadingProduct ? (
              <div className="h-4 w-24 rounded-full animate-pulse" style={{ background: "rgba(200,134,138,0.12)" }} />
            ) : productInfo?.price ? (
              <p className="text-[14px] font-black" style={{ color: "#C8868A" }}>{productInfo.price}</p>
            ) : null}

            {/* Action buttons */}
            <div className="flex gap-2 mt-2.5">
              {productInfo?.variantId ? (
                <button
                  onClick={() => onAddToCart(productInfo.variantId!)}
                  className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl text-[11px] font-bold transition-all"
                  style={{
                    background: isAdded ? "#10b981" : "rgba(200,134,138,0.08)",
                    color: isAdded ? "white" : "#C8868A",
                  }}
                >
                  {isAdded ? (
                    <><CheckCircle className="w-3.5 h-3.5" /> Ajouté</>
                  ) : (
                    <><Plus className="w-3.5 h-3.5" /> Ajouter</>
                  )}
                </button>
              ) : !loadingProduct ? (
                <button
                  onClick={() => router.push("/shop")}
                  className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl text-[11px] font-bold transition-all"
                  style={{ background: "rgba(200,134,138,0.06)", color: "rgba(61,43,45,0.5)" }}
                >
                  Voir la boutique <CaretRight className="w-3 h-3" />
                </button>
              ) : null}
              {productInfo?.handle && (
                <button
                  onClick={() => router.push(`/shop/${productInfo.handle}`)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(61,43,45,0.04)", color: "rgba(61,43,45,0.6)" }}
                >
                  <CaretRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {!step.medusa_product_id && (
        <div className="bg-white px-4 pb-3">
          <button
            className="inline-flex items-center gap-1 text-[12px] font-bold mt-1 transition-opacity hover:opacity-70"
            onClick={() => router.push("/shop")}
            style={{ color: colors.num }}
          >
            Voir la sélection <CaretRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SkinAnalysisResultView({ result, onRetake, locked = false }: Props) {
  const router = useRouter();
  const cart = useCart();
  const [addedToCart, setAddedToCart] = useState<Set<string>>(new Set());
  const [addingAll, setAddingAll] = useState(false);
  const [allAdded, setAllAdded] = useState(false);


  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.25 } }
  };

  const metrics = result.metrics;
  const iconStyle = { color: "#C8868A" };
  const metricDefs = metrics ? [
    { label: "Acné & Imperfections", value: metrics.acne_severity_percentage, type: "bad" as const, icon: <Lightning className="w-3.5 h-3.5" style={iconStyle} /> },
    { label: "Niveau de Sébum", value: metrics.sebum_level_percentage, type: "bad" as const, icon: <Drop className="w-3.5 h-3.5" style={iconStyle} /> },
    { label: "Dilatation des Pores", value: metrics.pore_visibility_percentage, type: "bad" as const, icon: <Sun className="w-3.5 h-3.5" style={iconStyle} /> },
    { label: "Contour des Yeux", value: metrics.eye_contour_fatigue_percentage, type: "bad" as const, icon: <Eye className="w-3.5 h-3.5" style={iconStyle} /> },
    { label: "Barrière d'Hydratation", value: metrics.hydration_barrier_percentage, type: "good" as const, icon: <TrendUp className="w-3.5 h-3.5" style={iconStyle} /> },
  ] : [];

  // Kept on the order line, so sales coming from the Skin Coach can be counted
  const lineMetadata = { source: "skin_coach", ...(result.scan_id ? { scan_id: result.scan_id } : {}) };

  useEffect(() => {
    posthog.capture("skin_coach_result_viewed", {
      locked,
      scan_id: result.scan_id,
      steps: result.kbeauty_routine.length,
      linked_products: result.kbeauty_routine.filter((s) => s.medusa_product_id).length,
    });
  }, [locked, result]);

  const handleAddToCart = async (variantId: string) => {
    if (addedToCart.has(variantId)) return;
    setAddedToCart((prev) => new Set([...prev, variantId]));
    posthog.capture("skin_coach_add_to_cart", { variant_id: variantId, scan_id: result.scan_id });
    await cart.addItem(variantId, 1, undefined, undefined, undefined, lineMetadata);
  };

  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const exportReportToPDF = async () => {
    window.print();
  };

  const handleAddAllToCart = async () => {
    setAddingAll(true);
    const url = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
    const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

    const variantIds: string[] = [];
    for (const step of result.kbeauty_routine) {
      if (!step.medusa_product_id) continue;
      try {
        const res = await fetch(`${url}/store/products/${step.medusa_product_id}`, {
          headers: { "x-publishable-api-key": key },
        });
        const data = await res.json();
        const variantId = data?.product?.variants?.[0]?.id;
        if (variantId && !addedToCart.has(variantId)) {
          variantIds.push(variantId);
        }
      } catch {}
    }

    if (variantIds.length > 0) {
      posthog.capture("skin_coach_add_routine", { products: variantIds.length, scan_id: result.scan_id });
      // Instead of manual addAllToCart, use cart.addItem one by one for reliability
      // and so it stays synced with context, opening cart at the end
      for (const vId of variantIds) {
        await cart.addItem(vId, 1, undefined, undefined, undefined, lineMetadata);
      }
      setAddedToCart(prev => new Set([...prev, ...variantIds]));
      setAllAdded(true);
    } else if (variantIds.length === 0) {
       // Everything was already added
       setAllAdded(true);
    }
    setAddingAll(false);
  };

  const hasLinkedProducts = result.kbeauty_routine.some((s) => s.medusa_product_id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-[100dvh] relative w-full flex flex-col font-sans print:h-auto print:block"
      style={{ background: "#FDF8F7" }}
    >
      {/* Background soft orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-96 h-96 rounded-full opacity-30"
          style={{ background: "#E5B6B9", filter: "blur(120px)" }} />
        <div className="absolute bottom-[20%] right-[-15%] w-80 h-80 rounded-full opacity-20"
          style={{ background: "#C8868A", filter: "blur(120px)" }} />
      </div>

      <div id="pdf-report-content" className="relative z-10 flex-1 pb-44 overflow-y-auto bg-[#FDF8F7] print:overflow-visible print:h-auto print:block print:pb-10">
        {/* Background soft orbs (for PDF) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-96 h-96 rounded-full opacity-30"
            style={{ background: "#E5B6B9", filter: "blur(120px)" }} />
          <div className="absolute bottom-[20%] right-[-15%] w-80 h-80 rounded-full opacity-20"
            style={{ background: "#C8868A", filter: "blur(120px)" }} />
        </div>
        
        {/* ─── HEADER ─── */}
        <motion.div
          variants={containerVariants} initial="hidden" animate="show"
          className="px-5 pt-12 pb-6"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6 text-[11px] font-bold uppercase tracking-widest"
            style={{ background: "rgba(200,134,138,0.1)", border: "1px solid rgba(200,134,138,0.25)", color: "#B06068" }}>
            <IconIA className="w-3 h-3" />
            Diagnostic IA Finalisé
          </motion.div>

          {/* ─── HERO CARD ─── */}
          <motion.div variants={itemVariants} className="rounded-3xl overflow-hidden relative mb-5"
            style={{ background: "linear-gradient(135deg, #FFF0F1 0%, #FDF8F7 100%)", border: "1px solid rgba(200,134,138,0.2)", boxShadow: "0 4px 24px rgba(200,134,138,0.12)" }}>

            {/* Glowing corner accent */}
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(229,182,185,0.3) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />

            <div className="p-7">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(176,96,104,0.6)" }}>
                Votre Profil Cutané
              </p>
              <h1 className="text-2xl font-extrabold leading-tight mb-1" style={{ color: "#3D2B2D", letterSpacing: "-0.02em" }}>
                {result.final_skin_type}
              </h1>
              {result.melanin_phototype && (
                <p className="text-sm mb-6" style={{ color: "rgba(61,43,45,0.4)" }}>
                  Phototype · {result.melanin_phototype}
                </p>
              )}

              <p className="text-[11px]" style={{ color: "rgba(61,43,45,0.4)" }}>
                D&apos;après vos photos et vos réponses au questionnaire
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* ─── METRICS GRID ─── */}
        <motion.div
          variants={containerVariants} initial="hidden" animate="show"
          className="px-5 space-y-5"
        >
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full" style={{ background: "#C8868A" }} />
              <h2 className="text-sm font-bold" style={{ color: "#3D2B2D" }}>Ce que montrent vos photos</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {metricDefs.map((m, i) => (
                <MetricCard key={m.label} label={m.label} value={m.value} type={m.type} icon={m.icon} delay={i * 0.1} />
              ))}
            </div>
            <p className="text-[11px] leading-relaxed mt-3" style={{ color: "rgba(61,43,45,0.45)" }}>
              Estimations visuelles faites d&apos;après vos photos, à titre indicatif : ce ne sont pas des mesures, et elles peuvent varier
              avec la lumière ou la qualité des photos. Votre routine tient aussi compte de vos réponses au questionnaire.
            </p>
          </motion.div>

          {/* ─── EMPATHETIC MESSAGE ─── */}
          <motion.div variants={itemVariants}
            className="rounded-3xl p-6"
            style={{ background: "white", border: "1px solid rgba(200,134,138,0.15)", boxShadow: "0 4px 16px rgba(200,134,138,0.08)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(176,96,104,0.7)" }}>
              Mot de votre Skin Coach
            </p>
            <div className="flex gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(200,134,138,0.1)", border: "1px solid rgba(200,134,138,0.18)" }}>
                <IconIA className="w-4 h-4" style={{ color: "#C8868A" }} />
              </div>
              <p className="text-sm leading-relaxed font-medium" style={{ color: "rgba(61,43,45,0.7)" }}>
                &ldquo;{result.empathetic_message}&rdquo;
              </p>
            </div>

            {/* Concern chips */}
            <div className="flex flex-wrap gap-2 pt-4" style={{ borderTop: "1px solid rgba(200,134,138,0.1)" }}>
              <p className="w-full text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(61,43,45,0.3)" }}>
                Points d&apos;attention
              </p>
              {Array.from(new Set(result.kbeauty_routine.map((s) => s.target_concern).filter(Boolean))).map((concern, idx) => (
                <span key={idx} className="text-[12px] font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(200,134,138,0.08)", border: "1px solid rgba(200,134,138,0.2)", color: "#B06068" }}>
                  {concern}
                </span>
              ))}
            </div>
          </motion.div>

          {/* ─── REVIEW BY A SKIN ADVISOR (pilot) ─── */}
          {result.review && (
            <motion.div variants={itemVariants} className="rounded-2xl p-4 flex gap-3"
              style={{ background: "#F2FBF6", border: "1px solid rgba(16,185,129,0.35)" }}>
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#10b981" }} />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "#0f9f6e" }}>
                  {result.review.status === "corrected" ? "Routine revue par une conseillère The Welfare" : "Routine validée par une conseillère The Welfare"}
                </p>
                {result.review.status === "corrected" && (result.review.corrections || []).map((c, idx) => (
                  <p key={idx} className="text-[13px] leading-relaxed" style={{ color: "rgba(61,43,45,0.8)" }}>
                    {c.from ? <>{c.from} → <strong>{c.to}</strong></> : <strong>{c.to}</strong>} : {c.reason}
                  </p>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── NOTICES (decided in code: doctor's opinion, treatment, budget, missing step) ─── */}
          {result.notices && result.notices.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-3">
              {result.notices.map((notice, idx) => {
                const strong = notice.kind === "referral";
                const tone = notice.kind === "caution" || notice.kind === "referral";
                return (
                  <div key={idx} className="rounded-2xl p-4 flex gap-3"
                    style={{
                      background: strong ? "#FFF4F2" : tone ? "#FFFBF0" : "white",
                      border: `1px solid ${strong ? "rgba(176,96,104,0.45)" : tone ? "rgba(217,164,65,0.4)" : "rgba(200,134,138,0.2)"}`,
                    }}>
                    <div className="shrink-0 mt-0.5">
                      {strong ? <FirstAidKit className="w-5 h-5" style={{ color: "#B06068" }} /> : <Info className="w-5 h-5" style={{ color: tone ? "#B7862B" : "#C8868A" }} />}
                    </div>
                    <div>
                      {strong && (
                        <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "#B06068" }}>
                          Avis dermatologique recommandé
                        </p>
                      )}
                      <p className="text-[13px] leading-relaxed" style={{ color: "rgba(61,43,45,0.8)" }}>{notice.text}</p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* ─── ROUTINE ─── */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full" style={{ background: "#C8868A" }} />
                <h2 className="text-sm font-bold" style={{ color: "#3D2B2D" }}>Votre Routine Sur-Mesure</h2>
              </div>
              {hasLinkedProducts && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{ background: "rgba(200,134,138,0.1)", color: "#B06068", border: "1px solid rgba(200,134,138,0.2)" }}>
                  Produits sélectionnés
                </span>
              )}
            </div>
            {locked ? (
              // Free preview: the steps are named, the products and explanations stay for account holders
              <div className="rounded-3xl p-5 space-y-3"
                style={{ background: "white", border: "1px solid rgba(200,134,138,0.15)", boxShadow: "0 4px 16px rgba(200,134,138,0.08)" }}>
                {result.kbeauty_routine.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{ background: "rgba(200,134,138,0.1)", color: "#B06068" }}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#3D2B2D" }}>{step.step_name}</p>
                      <div className="mt-1.5 h-2.5 rounded-full w-2/3" style={{ background: "rgba(200,134,138,0.12)" }} />
                    </div>
                    <LockKey className="w-4 h-4 shrink-0" style={{ color: "rgba(176,96,104,0.5)" }} />
                  </div>
                ))}
                <p className="text-[13px] leading-relaxed pt-2" style={{ color: "rgba(61,43,45,0.7)", borderTop: "1px solid rgba(200,134,138,0.1)" }}>
                  Votre routine de {result.kbeauty_routine.length} étape{result.kbeauty_routine.length > 1 ? "s" : ""} est prête.
                  Créez votre compte gratuit pour découvrir les produits choisis pour vous, leurs conseils d&apos;utilisation,
                  et retrouver ce diagnostic à tout moment.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {result.kbeauty_routine.map((step, idx) => (
                  <RoutineStepCard
                    key={idx}
                    step={step}
                    idx={idx}
                    onAddToCart={handleAddToCart}
                    addedToCart={addedToCart}
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* ─── MEDICAL DISCLAIMER ─── */}
          <motion.p
            variants={itemVariants}
            className="text-[11px] leading-relaxed text-center px-2"
            style={{ color: "rgba(61,43,45,0.5)" }}
          >
            Ce diagnostic est établi par une intelligence artificielle à partir de vos photos et de vos réponses. Il ne constitue pas un avis médical et ne remplace pas la consultation d'un dermatologue. En cas de lésions, de douleur, d'irritation persistante, de grossesse ou de traitement en cours, demandez conseil à un professionnel de santé avant de commencer une nouvelle routine.
          </motion.p>
        </motion.div>
      </div>

      {/* ─── STICKY BOTTOM ─── */}
      <motion.div
        initial={{ y: 120 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.8, type: "spring", bounce: 0.2 }}
        className="fixed bottom-0 left-0 right-0 z-50 px-5 pb-8 pt-4 print:hidden"
        style={{ background: "linear-gradient(to top, #FDF8F7 60%, transparent)" }}
      >
        {locked ? (
          <div className="flex flex-col gap-2 mb-3">
            <Link
              href="/account/register?redirect=/skin-coach/result"
              onClick={() => posthog.capture("skin_coach_signup_clicked", { scan_id: result.scan_id })}
              className="w-full py-4 px-6 rounded-2xl font-bold text-[15px] flex justify-center items-center gap-2.5 transition-all active:scale-[0.98] shadow-lg"
              style={{ background: "linear-gradient(135deg, #C8868A, #E5B6B9)", color: "white", boxShadow: "0 8px 30px rgba(200,134,138,0.35)" }}
            >
              <LockKey className="w-5 h-5" /> Découvrir ma routine
            </Link>
            <Link
              href="/account/login?redirect=/skin-coach/result"
              onClick={() => posthog.capture("skin_coach_login_clicked", { scan_id: result.scan_id })}
              className="w-full py-3 text-center text-[14px] font-semibold rounded-2xl bg-white border border-[#EDE0E0]"
              style={{ color: "#3D2B2D" }}
            >
              J&apos;ai déjà un compte
            </Link>
          </div>
        ) : (
        <div className="flex gap-2 mb-3">
          {hasLinkedProducts ? (
            <button
              onClick={handleAddAllToCart}
              disabled={addingAll || allAdded}
              className="flex-1 py-4 px-6 rounded-2xl font-bold text-[15px] flex justify-center items-center gap-2.5 transition-all active:scale-[0.98] shadow-lg disabled:opacity-70"
              style={{
                background: allAdded
                  ? "linear-gradient(135deg, #10b981, #34d399)"
                  : "linear-gradient(135deg, #C8868A, #E5B6B9)",
                color: "white",
                boxShadow: allAdded
                  ? "0 8px 30px rgba(16,185,129,0.35)"
                  : "0 8px 30px rgba(200,134,138,0.35)"
              }}
            >
              {allAdded ? (
                <><CheckCircle className="w-5 h-5" /> Routine ajoutée</>
              ) : addingAll ? (
                <><span className="animate-spin">⏳</span> Ajout...</>
              ) : (
                <><ShoppingBag className="w-5 h-5" /> Ajouter la routine</>
              )}
            </button>
          ) : (
            <button
              onClick={() => router.push("/shop")}
              className="flex-1 py-4 px-6 rounded-2xl font-bold text-[15px] flex justify-center items-center gap-2.5 transition-all active:scale-[0.98] shadow-lg"
              style={{ background: "linear-gradient(135deg, #C8868A, #E5B6B9)", color: "white", boxShadow: "0 8px 30px rgba(200,134,138,0.35)" }}
            >
              <ShoppingBag className="w-5 h-5" />
              Découvrir ma sélection
            </button>
          )}

          <button
            onClick={exportReportToPDF}
            disabled={isExportingPDF}
            className="w-14 shrink-0 flex items-center justify-center rounded-2xl bg-white border border-[#EDE0E0] shadow-sm text-[#3D2B2D] hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Exporter le rapport en PDF"
          >
            {isExportingPDF ? (
              <span className="animate-spin text-xl">⏳</span>
            ) : (
              <Printer className="w-6 h-6" />
            )}
          </button>
        </div>
        )}

        <button
          onClick={onRetake}
          className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold transition-colors"
          style={{ color: "rgba(61,43,45,0.4)" }}
        >
          <ArrowCounterClockwise className="w-3.5 h-3.5" />
          Refaire le diagnostic
        </button>
      </motion.div>
    </motion.div>
  );
}
