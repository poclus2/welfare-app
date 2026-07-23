"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

/* ─────────────────────────────────────────
   SLIDES DATA
───────────────────────────────────────── */
const slides = [
  {
    id: 0,
    tag: "Essentiel",
    heading: ["Le SPF ultime.", "Fini invisible,", "protection totale."],
    sub: "L'étape indispensable pour prévenir l'hyperpigmentation. Découvrez nos solaires coréens nouvelle génération : aucune trace blanche, 100% éclat.",
    cta: { label: "Découvrir nos SPF", href: "/shop?category=Protections Solaires" },
    ctaSecondary: { label: "Guide Solaire", href: "/shop" },
    accent: "#E5B6B9",
    bg: "#F4EAEB",
    image: "/slide1_creme.png",
    imagePosition: "object-top",
    stat: { value: "SPF 50+", label: "Très Haute Protection" },
    badge: "Bouclier Quotidien",
  },
  {
    id: 1,
    tag: "Incontournable",
    heading: ["Double nettoyage.", "Le secret d'un", "teint parfait."],
    sub: "Éliminez impuretés, sébum et résidus en douceur. Adoptez l'étape fondamentale du K-Beauty pour une peau visiblement transformée.",
    cta: { label: "Nos Nettoyants", href: "/shop?category=Nettoyants" },
    ctaSecondary: { label: "Le Rituel", href: "/shop" },
    accent: "#E5B6B9",
    bg: "#F4EAEB",
    image: "/slide2_cleaner.png",
    imagePosition: "object-center",
    stat: { value: "N°1", label: "Étape K-Beauty" },
    badge: "Purification Profonde",
  },
  {
    id: 2,
    tag: "Technologie",
    heading: ["La science IA", "au service de", "votre peau."],
    sub: "Ne devinez plus. Notre scanner facial analyse vos besoins spécifiques pour concevoir un protocole K-Beauty 100% sur-mesure.",
    cta: { label: "Faire le Diagnostic", href: "/shop" },
    ctaSecondary: { label: "Comment ça marche ?", href: "/shop" },
    accent: "#E5B6B9",
    bg: "#F4EAEB",
    image: "/ai_skin_scan_darkskin.png",
    imagePosition: "object-top",
    stat: { value: "98%", label: "Précision prouvée" },
    badge: "Intelligence Artificielle",
  },
];

/* ─────────────────────────────────────────
   ANIMATION VARIANTS
───────────────────────────────────────── */
const textVariants: any = {
  enter: { opacity: 0, x: -32, y: 0 },
  center: { opacity: 1, x: 0, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as any } },
  exit: { opacity: 0, x: 20, y: 0, transition: { duration: 0.3, ease: "easeIn" } },
};

const imageVariants: any = {
  enter: (dir: number) => ({ clipPath: dir > 0 ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)", scale: 1.08 }),
  center: { clipPath: "inset(0 0% 0 0)", scale: 1, transition: { duration: 0.9, ease: [0.77, 0, 0.175, 1] as any } },
  exit: (dir: number) => ({ clipPath: dir > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)", scale: 1, transition: { duration: 0.6, ease: [0.77, 0, 0.175, 1] as any } }),
};

const staggerChildren: any = {
  center: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};

const childFade: any = {
  enter: { opacity: 0, x: -32, y: 0 },
  center: { opacity: 1, x: 0, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as any } },
  exit: { opacity: 0, x: 20, y: 0 },
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const AUTO_PLAY_MS = 6000;

  const slide = slides[current]!;

  const goTo = useCallback((idx: number, dir: number) => {
    setDirection(dir);
    setCurrent(idx);
  }, []);

  const next = useCallback(() => {
    goTo((current + 1) % slides.length, 1);
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length, -1);
  }, [current, goTo]);

  // Auto-play
  useEffect(() => {
    if (isPaused || isSearchOpen) return;
    intervalRef.current = setInterval(next, AUTO_PLAY_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [next, isPaused, isSearchOpen]);

  // Search Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      className="w-full flex flex-col overflow-hidden relative"
      style={{ background: slide.bg, transition: "background 0.7s ease", minHeight: "calc(100vh - 120px)" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col lg:flex-row items-stretch w-full max-w-[1600px] mx-auto px-6 md:px-12 pb-10 gap-8 lg:gap-0 min-h-0">

        {/* ── LEFT: Text Panel ── */}
        <div className="flex flex-col justify-center flex-shrink-0 w-full lg:w-[48%] pr-0 lg:pr-16 py-0 lg:py-16">

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              variants={staggerChildren}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col lg:block"
            >


              {/* Heading */}
              <motion.h1
                variants={childFade}
                className="order-3 lg:order-none text-[3.2rem] md:text-[4.5rem] lg:text-[5rem] xl:text-[5.5rem] leading-[1.0] font-medium tracking-tight text-[#2A2424] mb-6 pt-4 lg:pt-0"
              >
                {slide.heading.map((line, i) => (
                  <span key={i} className="block">
                    {i === 1 ? (
                      <span style={{ color: slide.accent }}>{line}</span>
                    ) : line}
                  </span>
                ))}
              </motion.h1>

              {/* ── MOBILE: Full-bleed Image (Medicube style) ── */}
              <motion.div variants={childFade} className="order-1 lg:order-none block lg:hidden -mx-5 relative w-screen">
                {/* Full width image */}
                <div className="relative w-full" style={{ aspectRatio: "1/1" }}>
                  <img
                    src={slide.image}
                    alt={slide.badge}
                    className={`w-full h-full object-cover ${slide.imagePosition || "object-center"}`}
                  />
                  {/* Subtle gradient at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
                </div>
              </motion.div>

              {/* Slide nav dots + arrows (Mobile, below image) */}
              <motion.div variants={childFade} className="order-2 lg:order-none flex lg:hidden items-center justify-between px-1 pt-3 pb-2 mb-4">
                {/* Dots */}
                <div className="flex items-center gap-2">
                  {slides.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => goTo(i, i > current ? 1 : -1)}
                      className="relative h-[3px] rounded-full overflow-hidden transition-all duration-300"
                      style={{ width: i === current ? 24 : 6, background: i === current ? "#2A2424" : "#2A2424" + "25" }}
                      aria-label={`Slide ${i + 1}`}
                    >
                      {i === current && !isPaused && (
                        <motion.span
                          className="absolute inset-0 rounded-full origin-left"
                          style={{ background: slide.accent }}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: AUTO_PLAY_MS / 1000 - 0.2, ease: "linear" }}
                          key={current}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Counter + Arrows */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={prev}
                    className="w-8 h-8 rounded-full border border-[#2A2424]/20 flex items-center justify-center text-[#2A2424]/60 hover:text-[#2A2424] hover:border-[#2A2424]/40 transition-all active:scale-90"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-medium text-[#2A2424]/40 tabular-nums">
                    {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                  </span>
                  <button
                    onClick={next}
                    className="w-8 h-8 rounded-full border border-[#2A2424]/20 flex items-center justify-center text-[#2A2424]/60 hover:text-[#2A2424] hover:border-[#2A2424]/40 transition-all active:scale-90"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>

              {/* Sub */}
              <motion.p variants={childFade} className="order-4 lg:order-none text-[#2A2424]/55 text-base md:text-lg leading-relaxed mb-8 max-w-[460px]">
                {slide.sub}
              </motion.p>

              {/* CTAs */}
              <motion.div variants={childFade} className="order-5 lg:order-none flex flex-wrap items-center gap-4 mb-14">
                <Link
                  href={slide.cta.href}
                  className="group flex items-center gap-2.5 bg-[#2A2424] text-white px-7 py-4 rounded-full text-[14px] font-semibold hover:bg-black transition-all hover:scale-[1.02] active:scale-95"
                >
                  {slide.cta.label}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href={slide.ctaSecondary.href}
                  className="flex items-center gap-2 border border-[#2A2424]/20 text-[#2A2424] px-7 py-4 rounded-full text-[14px] font-semibold hover:bg-black/5 transition-all hover:scale-[1.02] active:scale-95"
                >
                  {slide.ctaSecondary.label}
                </Link>
              </motion.div>

              {/* Stat (Desktop) */}
              <motion.div variants={childFade} className="hidden lg:flex items-center gap-5">
                <div
                  className="flex flex-col items-start px-5 py-3 rounded-2xl border"
                  style={{ background: `${slide.accent}25`, borderColor: `${slide.accent}50` }}
                >
                  <span className="text-2xl font-bold text-[#2A2424] leading-none">{slide.stat.value}</span>
                  <span className="text-[11px] text-[#2A2424]/55 mt-0.5 font-medium">{slide.stat.label}</span>
                </div>

                {/* Slide nav dots */}
                <div className="flex items-center gap-2.5 ml-auto">
                  {slides.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => goTo(i, i > current ? 1 : -1)}
                      className="relative h-1.5 rounded-full overflow-hidden transition-all duration-300"
                      style={{ width: i === current ? 32 : 8, background: i === current ? "#2A2424" : "#2A2424" + "30" }}
                      aria-label={`Slide ${i + 1}`}
                    >
                      {i === current && !isPaused && (
                        <motion.span
                          className="absolute inset-0 rounded-full origin-left"
                          style={{ background: slide.accent }}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: AUTO_PLAY_MS / 1000 - 0.2, ease: "linear" }}
                          key={current}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Arrow controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={prev}
                    className="w-9 h-9 rounded-full border border-[#2A2424]/15 flex items-center justify-center text-[#2A2424]/50 hover:text-[#2A2424] hover:border-[#2A2424]/40 hover:bg-white/60 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={next}
                    className="w-9 h-9 rounded-full border border-[#2A2424]/15 flex items-center justify-center text-[#2A2424]/50 hover:text-[#2A2424] hover:border-[#2A2424]/40 hover:bg-white/60 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>

            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── RIGHT: Image Bento (Desktop only) ── */}
        <div className="hidden lg:flex flex-1 items-center justify-center min-h-0 py-10">
          <div className="relative w-full h-full min-h-0 max-h-[680px]">

            {/* Main image with clip-path reveal */}
            <AnimatePresence mode="sync" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                variants={imageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 rounded-[2rem] overflow-hidden shadow-2xl"
              >
                <img
                  src={slide.image}
                  alt={slide.badge}
                  className={`w-full h-full object-cover ${slide.imagePosition || "object-center"}`}
                  style={{ willChange: "transform" }}
                />
                {/* Subtle vignette */}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/25" />

                {/* Floating slide count badge */}
                <div className="absolute top-5 right-5 bg-white/20 backdrop-blur-md border border-white/25 rounded-full px-4 py-1.5 flex items-center gap-2">
                  <span className="text-white text-xs font-bold tracking-widest">
                    {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                  </span>
                </div>

                {/* Bottom left tag */}
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                  <div
                    className="backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2"
                    style={{ background: `${slide.accent}CC` }}
                  >
                    <span className="text-[#2A2424] text-[11px] font-bold tracking-[0.15em] uppercase">{slide.badge}</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Decorative background blob */}
            <div
              className="absolute -bottom-6 -right-6 w-2/3 h-2/3 rounded-[2rem] -z-10 transition-colors duration-700"
              style={{ background: `${slide.accent}35` }}
            />
            <div
              className="absolute -top-4 -left-4 w-1/2 h-1/2 rounded-full -z-10 blur-3xl transition-colors duration-700"
              style={{ background: `${slide.accent}50` }}
            />
          </div>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2A2424]/10">
        {!isPaused && (
          <motion.div
            key={current}
            className="h-full origin-left"
            style={{ background: slide.accent }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: AUTO_PLAY_MS / 1000 - 0.2, ease: "linear" }}
          />
        )}
      </div>
    </div>
  );
}
