"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════ */
// The user can add more panels and use .mp4 or .gif here.
const PANELS = [
  {
    id: "01",
    brand: "ANUA",
    title: "L'apaisement absolu au Heartleaf.",
    subtitle: "ANUA · SOIN APAISANT",
    desc: "La gamme culte pour apaiser instantanément les peaux sensibles.",
    media: "/anua_hero.jpg",
    isVideo: false,
    isPhoto: true,
    link: "/shop/all",
    bg: "#E8A359"
  },
  {
    id: "02",
    brand: "MEDICUBE",
    title: "L'innovation clinique, redéfinie.",
    subtitle: "MEDICUBE · DERMO-COSMÉTIQUE",
    desc: "La haute technologie dermo-cosmétique pour lisser le grain de peau et resserrer les pores. L'efficacité d'un soin clinique, à la maison.",
    media: "/medicube_hero.jpg",
    isVideo: false,
    isPhoto: true,
    link: "/shop/all",
    bg: "#3B2E2A"
  },
  {
    id: "03",
    brand: "COSRX",
    title: "Réparez. Repulpez. Rayonnez.",
    subtitle: "COSRX · SNAIL MUCIN",
    desc: "Le pouvoir réparateur de la mucine d'escargot pour restaurer votre barrière cutanée. Une hydratation continue pour un éclat \"Glass Skin\" naturel.",
    media: "/cosrx_hero.jpg",
    isVideo: false,
    isPhoto: true,
    link: "/shop/all",
    bg: "#C49A82"
  },
  {
    id: "04",
    brand: "HAPPY BATH",
    title: "L'art du bain coréen.",
    subtitle: "HAPPY BATH · CORPS & SPA",
    desc: "Une mousse onctueuse aux extraits botaniques qui respecte et hydrate votre peau. Transformez votre douche quotidienne en une véritable parenthèse spa.",
    media: "/happybath_hero.jpg",
    isVideo: false,
    isPhoto: true,
    link: "/shop/all",
    bg: "#8E354A"
  },
  {
    id: "05",
    brand: "BEAUTY OF JOSEON",
    title: "La protection solaire invisible.",
    subtitle: "BEAUTY OF JOSEON · SPF50+ ÉCLAT",
    desc: "Un SPF50+ infusé au riz qui fond sur les peaux mélanisées sans laisser aucun film blanc. Protège, nourrit et illumine le teint instantanément.",
    media: "/beautyofjoseon_hero.jpg",
    isVideo: false,
    isPhoto: true,
    link: "/shop/all",
    bg: "#B28C84"
  },
];

export function AccordionHero() {
  const [startIndex, setStartIndex] = useState(0);
  const [hoveredId, setHoveredId] = useState<string>(PANELS[0]?.id || "");

  const VISIBLE_COUNT = 3;

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (startIndex + VISIBLE_COUNT < PANELS.length) {
      const newStart = startIndex + 1;
      setStartIndex(newStart);
      const newVisible = PANELS.slice(newStart, newStart + VISIBLE_COUNT);
      if (!newVisible.find(p => p.id === hoveredId)) {
        setHoveredId(newVisible[0]?.id || "");
      }
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (startIndex > 0) {
      const newStart = startIndex - 1;
      setStartIndex(newStart);
      const newVisible = PANELS.slice(newStart, newStart + VISIBLE_COUNT);
      if (!newVisible.find(p => p.id === hoveredId)) {
        setHoveredId(newVisible[0]?.id || "");
      }
    }
  };

  return (
    <div className="relative w-full h-[430px] sm:h-[480px] md:h-[550px] flex overflow-hidden rounded-[24px] md:rounded-[32px] bg-[#2A2424] shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      
      {/* LEFT NAVIGATION ARROW */}
      {startIndex > 0 && (
        <button 
          onClick={handlePrev} 
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-[#2A2424] transition-colors shadow-lg"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
        </button>
      )}

      {PANELS.map((panel, idx) => {
        const isVisible = idx >= startIndex && idx < startIndex + VISIBLE_COUNT;
        const isActive = isVisible && hoveredId === panel.id;

        return (
          <motion.div
            key={panel.id}
            onMouseEnter={() => {
              if (isVisible) setHoveredId(panel.id);
            }}
            onClick={() => {
              if (isVisible) setHoveredId(panel.id);
            }}
            layout
            initial={false}
            animate={{
              flex: isActive ? 6.5 : isVisible ? 1.75 : 0,
              opacity: isVisible ? 1 : 0,
            }}
            transition={{ type: "spring", stiffness: 180, damping: 25 }}
            className={`relative h-full overflow-hidden border-[#2A2424]/10 group cursor-pointer ${isVisible ? 'border-r last:border-r-0' : 'border-r-0'}`}
            style={{ 
              backgroundColor: panel.bg, 
              pointerEvents: isVisible ? "auto" : "none" 
            }}
          >
            {/* Background Media */}
            <div className="absolute inset-0 w-full h-full flex items-center justify-center p-0">
              {panel.isVideo ? (
                <video
                  src={panel.media}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={panel.media}
                  alt={panel.brand || panel.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Gradient Overlay for Text Readability */}
            <div
              className={`absolute inset-0 bg-gradient-to-r from-[#2A2424]/95 via-[#2A2424]/60 to-transparent transition-opacity duration-500 z-10 ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
            />
            <div
              className={`absolute inset-0 bg-gradient-to-t from-[#2A2424]/90 via-transparent to-transparent transition-opacity duration-500 z-10 ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
            />
            {/* Overlay darker on non-active to hide content slightly */}
            <div
              className={`absolute inset-0 bg-black/40 transition-opacity duration-500 z-10 ${
                isActive ? "opacity-0" : "opacity-100"
              }`}
            />

            {/* Vertical Title (when collapsed) */}
            <div
              className={`absolute inset-0 py-6 md:py-8 flex flex-col items-center justify-end transition-opacity duration-300 z-20 ${
                isActive ? "opacity-0 pointer-events-none" : "opacity-100 delay-100"
              }`}
            >
              <div className="h-full flex items-end pb-8 sm:pb-12 overflow-hidden">
                <span className="text-white font-bold tracking-widest text-[11px] sm:text-xs md:text-sm whitespace-nowrap -rotate-90 origin-bottom uppercase">
                  {panel.brand || panel.title}
                </span>
              </div>
              <span className="text-white/90 text-[10px] sm:text-xs font-bold mt-auto mb-2">{panel.id}</span>
            </div>

            {/* Expanded Content */}
            <div
              className={`absolute inset-0 p-4 sm:p-6 md:p-10 flex flex-col justify-between transition-opacity duration-500 z-20 ${
                isActive ? "opacity-100 delay-200" : "opacity-0 pointer-events-none"
              }`}
            >
              <div className="text-white/90 text-[11px] sm:text-xs md:text-sm font-bold tracking-widest pl-2 sm:pl-4 md:pl-0">
                / {panel.id}
              </div>

              <div className="flex flex-col items-start w-full min-w-0 max-w-lg pr-2">
                <p className="text-white/90 text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1.5 md:mb-2 bg-black/40 px-2.5 md:px-3.5 py-0.5 md:py-1 rounded-full backdrop-blur-md border border-white/10">
                  {panel.subtitle}
                </p>
                {/* Title: Hidden on mobile, visible on desktop */}
                <h2 className="hidden md:block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight mb-2 md:mb-4 drop-shadow-md">
                  {panel.title}
                </h2>
                <p className="text-white/95 text-xs sm:text-sm md:text-base font-normal w-full mb-3 sm:mb-4 md:mb-8 leading-relaxed drop-shadow-sm">
                  {panel.desc}
                </p>

                <Link
                  href={panel.link}
                  className="bg-white text-[#1C1C1C] text-xs md:text-sm font-bold py-2 md:py-3 px-4 md:px-6 rounded-full flex items-center justify-center gap-2 hover:bg-[#F4EAEB] transition-all shadow-xl group-hover:pl-7"
                >
                  Découvrir <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* RIGHT NAVIGATION ARROW */}
      {startIndex + VISIBLE_COUNT < PANELS.length && (
        <button 
          onClick={handleNext} 
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-[#2A2424] transition-colors shadow-lg"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      )}

    </div>
  );
}
