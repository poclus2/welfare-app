"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight, Package, Sparkles, Clock, CheckCircle2, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

/* ─────────────────────────────────────────
   BRAND TOKENS – SEKORIA RED
───────────────────────────────────────── */
const S = {
  red:      "#C0392B",   // Sekoria signature crimson
  redLight: "#E74C3C",   // hover / accent
  redDim:   "rgba(192,57,43,0.12)",
  redGlow:  "rgba(192,57,43,0.35)",
  dark:     "#0F0A09",   // near-black
  offWhite: "#FAF8F7",   // section bg
  sand:     "#F2EDE9",   // card bg
};

/* ─────────────────────────────────────────
   LIVE COUNTDOWN
───────────────────────────────────────── */
function useCountdown(targetH: number) {
  const [secs, setSecs] = useState(targetH * 3600);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return { h: p(h), m: p(m), s: p(s) };
}

function LiveCountdown() {
  const t = useCountdown(72);
  const units = [
    { v: t.h, l: "Heures" },
    { v: t.m, l: "Mins" },
    { v: t.s, l: "Secs" },
  ];
  return (
    <div className="flex items-end gap-2">
      {units.map(({ v, l }, i) => (
        <div key={l} className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <span
              className="tabular-nums font-black text-3xl md:text-4xl leading-none px-4 py-2 rounded-xl text-white"
              style={{ background: S.red, boxShadow: `0 4px 24px ${S.redGlow}` }}
            >
              {v}
            </span>
            <span className="text-[9px] font-bold tracking-[0.15em] uppercase mt-1.5" style={{ color: `${S.red}99` }}>
              {l}
            </span>
          </div>
          {i < 2 && (
            <span className="font-black text-2xl mb-5" style={{ color: S.red }}>:</span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   ANIMATION HELPERS
───────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay },
});

/* ─────────────────────────────────────────
   SEKORIA PRODUCT DATA
───────────────────────────────────────── */
const AVAILABILITY = "15 Octobre 2026";

const sekoriaProducts = [
  {
    id: 1,
    name: "Éclat Fondateur",
    subtitle: "Sérum Lumière Absolue",
    price: "28 500 FCFA",
    image: "/sekoria_serum.png",
    bg: "#FFFFFF",
    note: "Révèle l'éclat naturel des peaux africaines.",
  },
  {
    id: 2,
    name: "Voile Protecteur",
    subtitle: "Fluide Solaire SPF 50+",
    price: "19 500 FCFA",
    image: "/sekoria_sunscreen.png",
    bg: S.sand,
    note: "Zéro trace blanche. Toutes carnations.",
  },
  {
    id: 3,
    name: "Essence Réparatrice",
    subtitle: "Toner Barrière Apaisant",
    price: "16 500 FCFA",
    image: "/sekoria_toner.png",
    bg: "#FFFFFF",
    note: "Réhydrate & apaise les peaux sensibles.",
  },
  {
    id: 4,
    name: "Masque de Minuit",
    subtitle: "Soin Nuit Régénérant",
    price: "24 000 FCFA",
    image: "/sekoria_night_cream.png",
    bg: S.dark,
    isDark: true,
    note: "Active la réparation cellulaire nocturne.",
  },
];

/* ─────────────────────────────────────────
   SUCCESS TOAST
───────────────────────────────────────── */
function Toast({ visible, name }: { visible: boolean; name: string }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-4 text-white pl-5 pr-7 py-4 rounded-2xl shadow-2xl"
          style={{
            background: S.dark,
            boxShadow: `0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)`,
            minWidth: 300,
          }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: S.redDim, border: `1px solid ${S.red}50` }}
          >
            <CheckCircle2 className="w-5 h-5" style={{ color: S.red }} />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">Précommande confirmée !</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
              {name} · Livraison estimée : {AVAILABILITY}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────
   PREORDER BADGE
───────────────────────────────────────── */
function PreorderBadge({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold tracking-[0.15em] uppercase rounded-full ${
        small ? "text-[8px] px-2 py-0.5" : "text-[9px] px-2.5 py-1"
      }`}
      style={{
        background: S.redDim,
        color: S.red,
        border: `1px solid ${S.red}30`,
      }}
    >
      <Package className={small ? "w-2 h-2" : "w-2.5 h-2.5"} />
      Précommande
    </span>
  );
}

/* ─────────────────────────────────────────
   PRODUCT CARD (Desktop)
───────────────────────────────────────── */
function ProductCard({ p, onPreorder }: { p: typeof sekoriaProducts[0]; onPreorder: (n: string) => void }) {
  const isDark = !!(p as any).isDark;
  const textCol = isDark ? "text-white" : "text-[#0F0A09]";
  const subCol  = isDark ? "text-white/40" : "text-[#0F0A09]/50";
  const noteCol = isDark ? "text-white/30" : "text-[#0F0A09]/40";
  // mix-blend-mode trick: multiply removes white bg on light cards, screen removes dark bg on dark card
  const blendMode = isDark ? "screen" : "multiply";

  return (
    <motion.div
      {...fadeUp(0.05 * p.id)}
      className="md:col-span-1 md:row-span-1 rounded-[1.5rem] overflow-hidden relative group flex flex-col p-6 gap-3"
      style={{
        background: (p as any).bg,
        boxShadow: "0 2px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
        minHeight: 230,
      }}
    >
      {/* Top row: badge + dot */}
      <div className="flex items-center justify-between shrink-0">
        <PreorderBadge small />
        <span className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ background: S.red }} />
      </div>

      {/* Middle: text + image side by side */}
      <div className="flex items-end justify-between flex-1 gap-2">
        {/* Text block */}
        <div className="flex flex-col justify-end min-w-0 flex-1">
          <p className={`text-[10px] font-semibold tracking-[0.12em] uppercase mb-1 truncate ${subCol}`}>{p.subtitle}</p>
          <h3 className={`text-[1.05rem] font-bold leading-snug mb-1 ${textCol}`}>{p.name}</h3>
          <p className={`text-[10px] leading-relaxed mb-3 line-clamp-2 ${noteCol}`}>{p.note}</p>
          <p className={`text-base font-black leading-none ${textCol}`}>{p.price}</p>
          <p className={`text-[9px] mt-1 ${noteCol}`}>📦 {AVAILABILITY}</p>
        </div>

        {/* Product image */}
        <div className="shrink-0 w-36 h-36 flex items-end justify-center">
          <img
            src={p.image}
            alt={p.name}
            className="w-full h-full object-contain group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-500 ease-out"
            style={{ mixBlendMode: blendMode as any }}
          />
        </div>
      </div>

      {/* Hover CTA */}
      <motion.button
        onClick={() => onPreorder(p.name)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 active:scale-95 shrink-0"
        style={{ background: S.red, boxShadow: `0 4px 20px ${S.redGlow}` }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <Package className="w-3.5 h-3.5" />
        Précommander
      </motion.button>
    </motion.div>
  );
}


/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export function PromotionsBento() {
  const [toast, setToast] = useState({ visible: false, name: "" });

  const handlePreorder = (name: string) => {
    setToast({ visible: true, name });
    setTimeout(() => setToast({ visible: false, name: "" }), 4000);
  };

  return (
    <section className="w-full py-16 md:py-24 lg:py-32 overflow-hidden" style={{ background: "#F5DDD9" }}>
      <Toast visible={toast.visible} name={toast.name} />

      <div className="w-full max-w-[1600px] mx-auto px-5 md:px-8 lg:px-12">

        {/* ── HEADER ── */}
        <motion.div {...fadeUp()} className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 md:mb-14 lg:mb-16">
          <div>
            <h2
              className="text-[2rem] md:text-[2.8rem] lg:text-[3.8rem] leading-[1.05] font-black tracking-[-0.03em]"
              style={{ color: S.dark }}
            >
              Collection{" "}
              <span
                className="inline-block"
                style={{
                  background: `linear-gradient(135deg, ${S.red} 0%, ${S.redLight} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Sekoria
              </span>
              <br />
              <span className="font-medium" style={{ color: `${S.dark}70` }}>
                Précommandes ouvertes
              </span>
            </h2>

            <p className="mt-4 text-sm md:text-base max-w-md leading-relaxed" style={{ color: `${S.dark}60` }}>
              La première marque K-Beauty conçue pour les peaux africaines. Réservez votre routine avant le lancement officiel du <strong style={{ color: S.dark }}>{AVAILABILITY}</strong>.
            </p>
          </div>

          {/* Right side: countdown + CTA */}
          <div className="flex flex-col items-start lg:items-end gap-4 shrink-0">
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: `${S.dark}40` }}>
                Lancement dans
              </p>
              <LiveCountdown />
            </div>
            <Link
              href="/precommande"
              className="hidden lg:inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95"
              style={{ background: S.red, boxShadow: `0 8px 32px ${S.redGlow}` }}
            >
              Voir toute la collection <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* ══════════════════════════════════
            DESKTOP GRID  (hidden on mobile)
            ══════════════════════════════════ */}
        <div className="hidden md:grid md:grid-cols-4 md:grid-rows-[1fr_1fr_auto] gap-4">

          {/* ── HERO CARD — col-span-2, row-span-2 ── */}
          <motion.div
            {...fadeUp(0)}
            className="md:col-span-2 md:row-span-2 rounded-[1.75rem] overflow-hidden relative group flex flex-col justify-between"
            style={{ minHeight: 500, background: S.dark }}
          >
            {/* Ambient red glow */}
            <div
              className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${S.red}30 0%, transparent 70%)` }}
            />
            {/* Model image */}
            <div className="absolute inset-0">
              <img
                src="/sekoria_hero_banner.png"
                alt="Collection Sekoria"
                className="w-full h-full object-cover opacity-60 group-hover:scale-[1.03] transition-transform duration-1000 ease-out"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to top, ${S.dark} 0%, ${S.dark}80 40%, transparent 70%)`,
                }}
              />
            </div>

            {/* Top: badges */}
            <div className="relative z-10 flex items-start justify-between p-7 pt-8">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-md"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <Clock className="w-3.5 h-3.5 text-white/60" />
                <span className="text-white text-xs font-bold tabular-nums">72:00:00</span>
                <span className="text-white/40 text-[10px]">restants</span>
              </div>
            </div>
            <div className="relative z-10 p-7 pb-8">
              {/* Brand mark */}
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-0.5 h-10 rounded-full" style={{ background: S.red }} />
                <div>
                  <p className="text-xs font-black tracking-[0.3em] uppercase" style={{ color: S.red }}>Sekoria</p>
                  <p className="text-[10px] tracking-[0.15em] uppercase text-white/30">Made in Cameroun</p>
                </div>
              </div>

              <h3 className="text-[2.5rem] lg:text-[3rem] font-black text-white leading-[1.0] tracking-[-0.03em] mb-3">
                Coffret Rituels<br />
                <span style={{ color: S.redLight }}>Édition Fondatrice</span>
              </h3>

              <p className="text-white/50 text-sm mb-1 leading-relaxed max-w-sm">
                4 soins iconiques pensés pour révéler l'éclat naturel des peaux africaines.
              </p>
              <p className="text-white/30 text-xs mb-6">📦 Disponibilité estimée : <span className="text-white/60 font-semibold">{AVAILABILITY}</span></p>

              {/* Price + CTA */}
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-white/30 text-xs mb-0.5">Coffret 4 soins</p>
                  <p className="text-4xl font-black text-white tracking-tight">85 000 <span className="text-lg font-medium text-white/40">FCFA</span></p>
                  <p className="text-white/20 text-[10px] mt-0.5">Sans avance de frais</p>
                </div>
                <motion.button
                  onClick={() => handlePreorder("Coffret Rituels Sekoria")}
                  className="flex items-center gap-2.5 text-white font-black py-4 px-7 rounded-2xl text-sm shrink-0 active:scale-95"
                  style={{ background: S.red, boxShadow: `0 8px 32px ${S.redGlow}` }}
                  whileHover={{ scale: 1.04, boxShadow: `0 12px 48px ${S.redGlow}` }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Package className="w-4 h-4" />
                  Précommander le coffret
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* ── 4 PRODUCT CARDS ── */}
          {sekoriaProducts.map((p) => (
            <ProductCard key={p.id} p={p} onPreorder={handlePreorder} />
          ))}

          {/* ── BOTTOM BANNER — col-span-4 ── */}
          <motion.div
            {...fadeUp(0.25)}
            className="md:col-span-4 rounded-[1.75rem] overflow-hidden relative group flex flex-col md:flex-row items-center justify-between gap-8 px-8 md:px-12 py-9"
            style={{
              background: S.dark,
              boxShadow: `0 0 0 1px rgba(255,255,255,0.04)`,
            }}
          >
            {/* Background noise texture via gradient orbs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div
                className="absolute -top-24 -left-24 w-80 h-80 rounded-full"
                style={{ background: `radial-gradient(circle, ${S.red}20 0%, transparent 70%)` }}
              />
              <div
                className="absolute -bottom-24 right-32 w-64 h-64 rounded-full"
                style={{ background: `radial-gradient(circle, ${S.red}15 0%, transparent 70%)` }}
              />
            </div>

            {/* Left: brand story */}
            <div className="relative z-10 flex-1">
              <h3 className="text-xl lg:text-2xl font-black text-white leading-tight mb-2 tracking-[-0.02em]">
                Rejoignez les{" "}
                <span style={{ color: S.redLight }}>247 fondatrices</span>
                {" "}qui ont déjà<br />
                réservé leur routine Sekoria.
              </h3>
              <p className="text-white/40 text-sm">
                Réservation sans engagement financier · Annulation gratuite avant le {AVAILABILITY}.
              </p>
            </div>

            {/* Center: stat pill */}
            <div
              className="relative z-10 flex flex-col items-center gap-1 shrink-0 px-8 py-5 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-white/30 text-[9px] tracking-widest uppercase">Places restantes</p>
              <p className="text-5xl font-black" style={{ color: S.red }}>53</p>
              <p className="text-white/20 text-[10px]">sur 300 spots fondateurs</p>
            </div>

            {/* Right: CTA */}
            <div className="relative z-10 flex flex-col items-end gap-3 shrink-0">
              <motion.button
                onClick={() => handlePreorder("Collection Complète Sekoria")}
                className="flex items-center gap-2.5 text-white font-black py-4 px-8 rounded-2xl text-sm active:scale-95"
                style={{ background: S.red, boxShadow: `0 8px 32px ${S.redGlow}` }}
                whileHover={{ scale: 1.04, boxShadow: `0 12px 48px ${S.redGlow}` }}
                whileTap={{ scale: 0.97 }}
              >
                <Package className="w-4 h-4" />
                Réserver ma place
                <ArrowRight className="w-4 h-4" />
              </motion.button>
              <p className="text-white/20 text-[10px]">📦 Livraison estimée : {AVAILABILITY}</p>
            </div>
          </motion.div>
        </div>

        {/* ══════════════════════════════════
            MOBILE LAYOUT  (hidden on md+)
            ══════════════════════════════════ */}
        <div className="flex flex-col gap-4 md:hidden">

          {/* Mobile Hero */}
          <motion.div
            {...fadeUp(0)}
            className="relative rounded-[1.5rem] overflow-hidden flex flex-col justify-between"
            style={{ minHeight: 400, background: S.dark }}
          >
            <div
              className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${S.red}25 0%, transparent 70%)` }}
            />
            <div className="absolute inset-0">
              <img
                src="/sekoria_hero_banner.png"
                alt="Collection Sekoria"
                className="w-full h-full object-cover opacity-50"
              />
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(to top, ${S.dark} 0%, ${S.dark}60 50%, transparent 100%)` }}
              />
            </div>

            <div className="relative z-10 flex items-center p-5">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <Clock className="w-3 h-3 text-white/50" />
                <span className="text-white text-xs font-bold">72h restantes</span>
              </div>
            </div>

            <div className="relative z-10 p-5">
              <p className="text-xs font-black tracking-[0.25em] uppercase mb-1" style={{ color: S.red }}>Sekoria · Édition Fondatrice</p>
              <h3 className="text-2xl font-black text-white leading-tight mb-1">Coffret Rituels<br />
                <span style={{ color: S.redLight }}>Collection Complète</span>
              </h3>
              <p className="text-white/30 text-xs mb-4">📦 Disponibilité estimée : {AVAILABILITY}</p>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xl font-black text-white">85 000 FCFA</p>
                  <p className="text-white/30 text-[10px]">Sans engagement</p>
                </div>
                <button
                  onClick={() => handlePreorder("Coffret Rituels Complet")}
                  className="flex items-center gap-2 font-bold py-3 px-5 rounded-full text-sm text-white active:scale-95 shrink-0"
                  style={{ background: S.red, boxShadow: `0 4px 20px ${S.redGlow}` }}
                >
                  <Package className="w-4 h-4" />
                  Précommander
                </button>
              </div>
            </div>
          </motion.div>

          {/* Mobile product grid — 2 columns */}
          <div className="grid grid-cols-2 gap-3">
            {sekoriaProducts.map((p, i) => {
              const isDark = !!(p as any).isDark;
              const blendMode = isDark ? "screen" : "multiply";
              return (
                <motion.div
                  key={p.id}
                  {...fadeUp(i * 0.06)}
                  className="relative rounded-[1.25rem] overflow-hidden flex flex-col p-4 gap-2"
                  style={{ background: (p as any).bg, minHeight: 220 }}
                >
                  {/* Badge */}
                  <PreorderBadge small />

                  {/* Image centered */}
                  <div className="flex items-center justify-center flex-1 py-1">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-32 h-32 object-contain"
                      style={{ mixBlendMode: blendMode as any }}
                    />
                  </div>

                  {/* Text bottom */}
                  <div>
                    <h3 className={`text-sm font-bold leading-tight mb-0.5 ${isDark ? "text-white" : "text-[#0F0A09]"}`}>{p.name}</h3>
                    <p className={`text-[9px] mb-2 ${isDark ? "text-white/40" : "text-[#0F0A09]/50"}`}>{p.subtitle}</p>
                    <p className={`text-sm font-black ${isDark ? "text-white" : "text-[#0F0A09]"}`}>{p.price}</p>
                    <p className={`text-[8px] mt-0.5 ${isDark ? "text-white/25" : "text-[#0F0A09]/35"}`}>📦 {AVAILABILITY}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>


          {/* Mobile bottom CTA */}
          <motion.div
            {...fadeUp(0.2)}
            className="relative rounded-[1.5rem] overflow-hidden p-6 flex flex-col gap-4"
            style={{ background: S.dark }}
          >
            <div
              className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${S.red}20 0%, transparent 70%)` }}
            />
            <div className="relative z-10">
              <p className="text-white/30 text-[10px] tracking-widest uppercase mb-1">Places restantes</p>
              <p className="text-4xl font-black" style={{ color: S.red }}>53</p>
              <p className="text-white/40 text-sm mt-1">sur 300 spots fondateurs</p>
            </div>
            <button
              onClick={() => handlePreorder("Collection Complète Sekoria")}
              className="relative z-10 flex items-center justify-center gap-2 w-full font-bold py-3.5 rounded-2xl text-sm text-white active:scale-95"
              style={{ background: S.red, boxShadow: `0 4px 20px ${S.redGlow}` }}
            >
              <Package className="w-4 h-4" />
              Réserver ma place <ArrowRight className="w-4 h-4" />
            </button>
            <p className="relative z-10 text-white/20 text-[10px] text-center">📦 Livraison estimée : {AVAILABILITY}</p>
          </motion.div>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
}
