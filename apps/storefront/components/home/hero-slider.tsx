"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CaretLeft, CaretRight } from "@phosphor-icons/react";

// Slides come from the admin (Bannières d'accueil, API /store/home-banners): order, visuals, texts, link,
// on/off. Visuals are portrait 4:5 and always shown whole. On a phone the visual carries its own lettering,
// so the title and text are only read out by screen readers and the button stays; on a computer the
// visual without lettering (image_desktop_url, else the phone one) sits next to the title, text and button.
export type HomeBanner = {
  id: string;
  title: string;
  description: string | null;
  cta_label: string;
  cta_href: string;
  image_url: string;
  image_desktop_url?: string | null;
  image_alt: string | null;
  bg_color: string | null;
};

// Shown only if the API can't answer, so the top of the page is never empty
const FALLBACK: HomeBanner[] = [
  {
    id: "fallback",
    title: "L'intelligence artificielle au service de votre peau",
    description: "Faites votre analyse de peau gratuitement et découvrez une routine adaptée à vos besoins et à votre budget.",
    cta_label: "Commencer mon analyse gratuite",
    cta_href: "/skin-coach",
    image_url: "/ai_skin_scan_darkskin.webp",
    image_alt: "Analyse de peau par le Skin Coach AI",
    bg_color: "#EAD4D5",
  },
];

const AUTO_PLAY_MS = 2000;
const DESKTOP_QUERY = "(min-width: 768px)"; // Tailwind md, where the layout puts the texts next to the visual
const tint = (color: string | null) => `color-mix(in srgb, ${color || "#EAD4D5"} 32%, #FBF8F6)`;

const textVariants: any = {
  enter: { opacity: 0, x: -24 },
  center: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, x: 16, transition: { duration: 0.25, ease: "easeIn" } },
};

const imageVariants: any = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40, transition: { duration: 0.35, ease: "easeIn" } }),
};

export function HeroSlider({ banners }: { banners?: HomeBanner[] }) {
  const slides = banners && banners.length > 0 ? banners : FALLBACK;
  const reduceMotion = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  const slide = slides[current] ?? slides[0]!;
  const count = slides.length;

  const goTo = useCallback((idx: number, dir: number) => {
    setDirection(dir);
    setCurrent(((idx % count) + count) % count);
  }, [count]);
  const next = useCallback(() => goTo(current + 1, 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1, -1), [current, goTo]);

  // Auto-play, paused on hover / keyboard focus, and off for people who asked for less motion
  const autoPlay = count > 1 && !isPaused && !reduceMotion;
  useEffect(() => {
    if (!autoPlay) return;
    const timer = setTimeout(next, AUTO_PLAY_MS);
    return () => clearTimeout(timer);
  }, [autoPlay, next]);

  // Warm the next visual (the version this screen shows) so the change is instant
  useEffect(() => {
    if (count < 2) return;
    const upcoming = slides[(current + 1) % count]!;
    const img = new window.Image();
    img.src = window.matchMedia(DESKTOP_QUERY).matches ? upcoming.image_desktop_url || upcoming.image_url : upcoming.image_url;
  }, [current, count, slides]);

  const renderDots = (className: string) =>
    count > 1 ? (
      <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i, i > current ? 1 : -1)}
            className="relative h-1.5 rounded-full overflow-hidden transition-all duration-300"
            style={{ width: i === current ? 28 : 8, background: i === current ? "#2A242440" : "#2A242425" }}
            aria-label={`Bannière ${i + 1} : ${s.title}`}
            aria-current={i === current || undefined}
          >
            {i === current && (
              <motion.span
                key={`${current}-${autoPlay}`}
                className="absolute inset-0 rounded-full origin-left bg-[#2A2424]"
                initial={{ scaleX: autoPlay ? 0 : 1 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: autoPlay ? AUTO_PLAY_MS / 1000 : 0, ease: "linear" }}
              />
            )}
          </button>
        ))}
      </div>
    ) : null;

  const renderArrows = () =>
    count > 1 ? (
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={prev}
          aria-label="Bannière précédente"
          className="w-10 h-10 rounded-full border border-[#2A2424]/15 flex items-center justify-center text-[#2A2424]/60 hover:text-[#2A2424] hover:border-[#2A2424]/40 hover:bg-white/60 transition-all active:scale-90"
        >
          <CaretLeft className="w-4 h-4" />
        </button>
        <button
          onClick={next}
          aria-label="Bannière suivante"
          className="w-10 h-10 rounded-full border border-[#2A2424]/15 flex items-center justify-center text-[#2A2424]/60 hover:text-[#2A2424] hover:border-[#2A2424]/40 hover:bg-white/60 transition-all active:scale-90"
        >
          <CaretRight className="w-4 h-4" />
        </button>
      </div>
    ) : null;

  return (
    <section
      aria-roledescription="carrousel"
      aria-label="Nos sélections"
      className="w-full overflow-hidden relative"
      style={{ background: tint(slide.bg_color), transition: "background 0.7s ease" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div className="w-full max-w-[1400px] mx-auto px-0 md:px-12 lg:px-16 py-0 md:py-10 lg:py-14 flex flex-col md:flex-row md:items-center gap-0 md:gap-10 lg:gap-16">
        {/* ── Visual (first on a phone, right on a computer). Swipe on touch screens. ── */}
        <div className="relative w-full md:w-[46%] lg:w-[44%] md:order-2 shrink-0">
          {/* width capped by the screen height too, so the whole 4:5 visual fits a laptop screen */}
          <div className="relative w-full aspect-[4/5] md:ml-auto md:max-w-[min(520px,calc((100vh-180px)*0.8))]">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={slide.id}
                custom={direction}
                variants={imageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                drag={count > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60) next();
                  else if (info.offset.x > 60) prev();
                }}
                className="absolute inset-0 md:rounded-[1.75rem] overflow-hidden md:shadow-[0_40px_80px_-40px_rgba(42,36,36,0.45)] touch-pan-y"
                style={{ background: slide.bg_color || "#EAD4D5" }}
              >
                {/* only the version for this screen is downloaded */}
                <picture>
                  {slide.image_desktop_url && <source media={DESKTOP_QUERY} srcSet={slide.image_desktop_url} />}
                  <img
                    src={slide.image_url}
                    alt={slide.image_alt || ""}
                    draggable={false}
                    loading="eager" // one slide in the page at a time: lazy would only delay it
                    fetchPriority={current === 0 ? "high" : "auto"}
                    className="w-full h-full object-cover object-top select-none"
                  />
                </picture>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Texts ── */}
        <div className="flex-1 min-w-0 px-5 md:px-0 pt-4 pb-8 md:py-0 md:order-1">
          <div className="flex md:hidden items-center justify-between gap-4 mb-5">
            {renderDots("")}
            {renderArrows()}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={slide.id} variants={textVariants} initial="enter" animate="center" exit="exit">
              {/* phone: the visual already says it, kept for screen readers only */}
              <h2 className="sr-only md:not-sr-only md:block md:text-[2.6rem] lg:text-[3.4rem] xl:text-[3.8rem] md:leading-[1.05] font-medium tracking-tight text-[#2A2424] md:mb-5 text-balance">
                {slide.title}
              </h2>
              {slide.description && (
                <p className="sr-only md:not-sr-only md:block text-[#2A2424]/65 text-lg leading-relaxed md:mb-8 max-w-[480px]">{slide.description}</p>
              )}
              <Link
                href={slide.cta_href}
                className="group flex w-full justify-center md:inline-flex md:w-auto items-center gap-2.5 bg-[#2A2424] text-white px-7 py-4 rounded-full text-[14px] font-semibold hover:bg-black transition-all hover:scale-[1.02] active:scale-95"
              >
                {slide.cta_label}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </AnimatePresence>

          <div className="hidden md:flex items-center justify-between gap-6 mt-12">
            {renderDots("max-w-[70%]")}
            {renderArrows()}
          </div>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {`Bannière ${current + 1} sur ${count} : ${slide.title}`}
      </p>
    </section>
  );
}
