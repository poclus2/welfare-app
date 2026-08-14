"use client";

import { motion, Variants } from "framer-motion";
import { SkinAnalysisResult } from "@/app/actions/analyze-skin";
import { Sparkles, Droplets, Eye, Zap, Sun, ShoppingBag, RotateCcw, ChevronRight, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  result: SkinAnalysisResult;
  onRetake: () => void;
}

function computeOverallScore(metrics?: SkinAnalysisResult["metrics"]): number {
  if (!metrics) return 72;
  const { acne_severity_percentage, sebum_level_percentage, pore_visibility_percentage, eye_contour_fatigue_percentage, hydration_barrier_percentage } = metrics;
  const score = Math.round(
    (100 - acne_severity_percentage) * 0.25 +
    (100 - sebum_level_percentage) * 0.2 +
    (100 - pore_visibility_percentage) * 0.2 +
    (100 - eye_contour_fatigue_percentage) * 0.15 +
    hydration_barrier_percentage * 0.2
  );
  return Math.min(100, Math.max(0, score));
}

function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Excellent", color: "#10b981" };
  if (score >= 65) return { label: "Bon", color: "#34d399" };
  if (score >= 50) return { label: "Moyen", color: "#f59e0b" };
  return { label: "À améliorer", color: "#f87171" };
}

// ─── Individual Metric Card ─────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: number;
  type: "good" | "bad";
  icon: React.ReactNode;
  delay: number;
}

const MetricCard = ({ label, value, type, icon, delay }: MetricCardProps) => {
  let barColor: string;
  let displayValue = type === "bad" ? 100 - value : value;

  if (displayValue >= 70) barColor = "#10b981";
  else if (displayValue >= 45) barColor = "#f59e0b";
  else barColor = "#f87171";

  const status = displayValue >= 70 ? "Bon" : displayValue >= 45 ? "Moyen" : "À traiter";
  const statusColor = displayValue >= 70 ? "text-emerald-500" : displayValue >= 45 ? "text-amber-500" : "text-rose-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: "white", border: "1px solid rgba(200,134,138,0.15)", boxShadow: "0 2px 10px rgba(200,134,138,0.08)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(200,134,138,0.1)", border: "1px solid rgba(200,134,138,0.18)" }}>
            {icon}
          </div>
          <span className="text-xs font-semibold leading-tight" style={{ color: "rgba(61,43,45,0.6)" }}>{label}</span>
        </div>
        <span className={`text-xs font-bold ${statusColor}`}>{status}</span>
      </div>
      <div>
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-2xl font-black" style={{ color: "#3D2B2D" }}>{displayValue}</span>
          <span className="text-xs font-medium" style={{ color: "rgba(61,43,45,0.3)" }}>/100</span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(200,134,138,0.1)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${displayValue}%` }}
            transition={{ duration: 1.4, ease: "easeOut", delay: delay + 0.2 }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${barColor}88, ${barColor})` }}
          />
        </div>
      </div>
    </motion.div>
  );
};

// ─── Routine Step ────────────────────────────────────────────────────────────

const stepColors = [
  { bg: "rgba(99,102,241,0.07)", border: "rgba(99,102,241,0.18)", num: "#6366f1" },
  { bg: "rgba(20,184,166,0.07)", border: "rgba(20,184,166,0.18)", num: "#14b8a6" },
  { bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.18)", num: "#f59e0b" },
  { bg: "rgba(239,68,68,0.07)", border: "rgba(239,68,68,0.18)", num: "#ef4444" },
  { bg: "rgba(139,92,246,0.07)", border: "rgba(139,92,246,0.18)", num: "#8b5cf6" },
];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SkinAnalysisResultView({ result, onRetake }: Props) {
  const router = useRouter();

  const overallScore = computeOverallScore(result.metrics);
  const { label: overallLabel, color: overallColor } = scoreLabel(overallScore);

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
    { label: "Acné & Imperfections", value: metrics.acne_severity_percentage, type: "bad" as const, icon: <Zap className="w-3.5 h-3.5" style={iconStyle} /> },
    { label: "Niveau de Sébum", value: metrics.sebum_level_percentage, type: "bad" as const, icon: <Droplets className="w-3.5 h-3.5" style={iconStyle} /> },
    { label: "Dilatation des Pores", value: metrics.pore_visibility_percentage, type: "bad" as const, icon: <Sun className="w-3.5 h-3.5" style={iconStyle} /> },
    { label: "Contour des Yeux", value: metrics.eye_contour_fatigue_percentage, type: "bad" as const, icon: <Eye className="w-3.5 h-3.5" style={iconStyle} /> },
    { label: "Barrière d'Hydratation", value: metrics.hydration_barrier_percentage, type: "good" as const, icon: <TrendingUp className="w-3.5 h-3.5" style={iconStyle} /> },
  ] : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-[100dvh] relative w-full flex flex-col font-sans"
      style={{ background: "#FDF8F7" }}
    >
      {/* Background soft orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-96 h-96 rounded-full opacity-30"
          style={{ background: "#E5B6B9", filter: "blur(120px)" }} />
        <div className="absolute bottom-[20%] right-[-15%] w-80 h-80 rounded-full opacity-20"
          style={{ background: "#C8868A", filter: "blur(120px)" }} />
      </div>

      <div className="relative z-10 flex-1 pb-36 overflow-y-auto">

        {/* ─── HEADER ─── */}
        <motion.div
          variants={containerVariants} initial="hidden" animate="show"
          className="px-5 pt-12 pb-6"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6 text-[11px] font-bold uppercase tracking-widest"
            style={{ background: "rgba(200,134,138,0.1)", border: "1px solid rgba(200,134,138,0.25)", color: "#B06068" }}>
            <Sparkles className="w-3 h-3" />
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

              {/* Overall Score */}
              <div className="flex items-end gap-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(61,43,45,0.35)" }}>
                    Score Global
                  </p>
                  <div className="flex items-baseline gap-1">
                    <motion.span
                      className="text-6xl font-black"
                      style={{ color: overallColor, letterSpacing: "-0.04em" }}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", bounce: 0.4, delay: 0.3 }}
                    >
                      {overallScore}
                    </motion.span>
                    <span className="text-xl font-bold" style={{ color: "rgba(61,43,45,0.2)" }}>/100</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: overallColor }}>{overallLabel}</span>
                </div>

                {/* Semi-circular arc gauge */}
                <div className="flex-1 flex justify-end">
                  <svg width="90" height="55" viewBox="0 0 90 55">
                    <path
                      d="M 10 50 A 35 35 0 0 1 80 50"
                      fill="none"
                      stroke="rgba(200,134,138,0.12)"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    <motion.path
                      d="M 10 50 A 35 35 0 0 1 80 50"
                      fill="none"
                      stroke={overallColor}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="110"
                      initial={{ strokeDashoffset: 110 }}
                      animate={{ strokeDashoffset: 110 - (110 * overallScore / 100) }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
                    />
                    {result.estimated_skin_age && (
                      <>
                        <text x="45" y="44" textAnchor="middle" fill="#3D2B2D" fontSize="13" fontWeight="800">{result.estimated_skin_age}</text>
                        <text x="45" y="54" textAnchor="middle" fill="rgba(61,43,45,0.35)" fontSize="7" fontWeight="600">ANS</text>
                      </>
                    )}
                  </svg>
                </div>
              </div>

              {result.estimated_skin_age && (
                <p className="text-[11px] mt-3" style={{ color: "rgba(61,43,45,0.35)" }}>
                  Âge cutané estimé par l&apos;IA · {result.estimated_skin_age} ans
                </p>
              )}
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
              <h2 className="text-sm font-bold" style={{ color: "#3D2B2D" }}>Indices Cutanés</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {metricDefs.map((m, i) => (
                <MetricCard key={m.label} label={m.label} value={m.value} type={m.type} icon={m.icon} delay={i * 0.1} />
              ))}
            </div>
          </motion.div>

          {/* ─── EMPATHETIC MESSAGE ─── */}
          <motion.div variants={itemVariants}
            className="rounded-3xl p-6"
            style={{ background: "white", border: "1px solid rgba(200,134,138,0.15)", boxShadow: "0 4px 16px rgba(200,134,138,0.08)" }}>
            <div className="flex gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(200,134,138,0.1)", border: "1px solid rgba(200,134,138,0.18)" }}>
                <Sparkles className="w-4 h-4" style={{ color: "#C8868A" }} />
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
              {Array.from(new Set(result.kbeauty_routine.map(s => s.target_concern))).map((concern, idx) => (
                <span key={idx} className="text-[12px] font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(200,134,138,0.08)", border: "1px solid rgba(200,134,138,0.2)", color: "#B06068" }}>
                  {concern}
                </span>
              ))}
            </div>
          </motion.div>

          {/* ─── ROUTINE ─── */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full" style={{ background: "#C8868A" }} />
              <h2 className="text-sm font-bold" style={{ color: "#3D2B2D" }}>Votre Routine Sur-Mesure</h2>
            </div>
            <div className="space-y-3">
              {result.kbeauty_routine.map((step, idx) => {
                const colors = stepColors[idx % stepColors.length] ?? stepColors[0]!
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + idx * 0.08, type: "spring", bounce: 0.2 }}
                    className="rounded-2xl p-4 flex gap-4 items-start"
                    style={{ background: colors.bg, border: `1px solid ${colors.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
                  >
                    <div className="text-2xl font-black shrink-0 w-8 text-center leading-none pt-0.5"
                      style={{ color: colors.num, fontFeatureSettings: '"tnum"' }}>
                      {String(step.step_number).padStart(2, "0")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold mb-1 leading-snug" style={{ color: "#3D2B2D" }}>{step.category}</p>
                      <p className="text-[13px] leading-relaxed" style={{ color: "rgba(61,43,45,0.55)" }}>{step.explanation}</p>
                      <button className="inline-flex items-center gap-1 text-[12px] font-bold mt-2 transition-opacity hover:opacity-70"
                        onClick={() => router.push("/shop")}
                        style={{ color: colors.num }}>
                        Voir la sélection <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ─── STICKY BOTTOM ─── */}
      <motion.div
        initial={{ y: 120 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.8, type: "spring", bounce: 0.2 }}
        className="fixed bottom-0 left-0 right-0 z-50 px-5 pb-8 pt-4"
        style={{ background: "linear-gradient(to top, #FDF8F7 60%, transparent)" }}
      >
        <button
          onClick={() => router.push('/shop')}
          className="w-full py-4 px-6 rounded-2xl font-bold text-[15px] flex justify-center items-center gap-2.5 mb-3 transition-all active:scale-[0.98] shadow-lg"
          style={{ background: "linear-gradient(135deg, #C8868A, #E5B6B9)", color: "white", boxShadow: "0 8px 30px rgba(200,134,138,0.35)" }}
        >
          <ShoppingBag className="w-5 h-5" />
          Découvrir ma sélection de soins
        </button>
        <button
          onClick={onRetake}
          className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold transition-colors"
          style={{ color: "rgba(61,43,45,0.4)" }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Refaire le diagnostic
        </button>
      </motion.div>
    </motion.div>
  );
}
