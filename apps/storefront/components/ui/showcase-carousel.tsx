"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const CAROUSEL_ITEMS = [
  {
    id: "01",
    title: "NETTOYANTS",
    slug: "nettoyants",
    desc: "Le rituel du double cleansing. Une peau purifiée, prête à recevoir ses soins.",
    bgImage: "/carroussel/nettoyants.png",
    color: "#cae3fe",
    textColor: "#1a3a5c",
  },
  {
    id: "02",
    title: "TONERS",
    slug: "toners",
    desc: "Hydratation immédiate. La première couche essentielle du soin coréen.",
    bgImage: "/carroussel/toners.png",
    color: "#ffd3dc",
    textColor: "#5c1a2e",
  },
  {
    id: "03",
    title: "SÉRUMS",
    slug: "serums",
    desc: "Des actifs concentrés pour cibler éclat, fermeté et pureté.",
    bgImage: "/carroussel/serums.png",
    color: "#f1e7d4",
    textColor: "#4a3010",
  },
  {
    id: "04",
    title: "CRÈMES",
    slug: "cremes",
    desc: "Nutrition & barrière cutanée. Des textures onctueuses pour sceller le soin.",
    bgImage: "/carroussel/cremes.png",
    color: "#e7cffb",
    textColor: "#3a1f5c",
  },
  {
    id: "05",
    title: "MASQUES",
    slug: "masques",
    desc: "Sheet masks & sleeping masks pour une peau repulpée du jour au lendemain.",
    bgImage: "/carroussel/masques.png",
    color: "#d4e7cf",
    textColor: "#1a3d1f",
  },
  {
    id: "06",
    title: "SOLAIRES",
    slug: "solaires",
    desc: "Protection SPF légère et invisible. L'étape finale incontournable.",
    bgImage: "/carroussel/solaires.png",
    color: "#f5cfaa",
    textColor: "#5c2e0a",
  },
  {
    id: "07",
    title: "CHEVEUX",
    slug: "cheveux",
    desc: "K-Haircare & Head Spa coréen pour un cuir chevelu sain.",
    bgImage: "/carroussel/cheveux.png",
    color: "#d0ecea",
    textColor: "#1a3d3a",
  },
  {
    id: "08",
    title: "YEUX & LÈVRES",
    slug: "yeux-levres",
    desc: "Patchs yeux et soins lèvres pour les zones les plus délicates.",
    bgImage: "/carroussel/yeux-levres.png",
    color: "#fcbec8",
    textColor: "#5c1a2e",
  },
  {
    id: "09",
    title: "MAQUILLAGE",
    slug: "maquillage",
    desc: "Cushions, BB creams & lip tints pour le Glass Skin coréen.",
    bgImage: "/carroussel/maquillage.png",
    color: "#f8c5c1",
    textColor: "#5c1a18",
  },
];

export function ShowcaseCarousel() {
  const router = useRouter();
  const [activeIdx, setActiveIdx] = useState(2);

  // Responsive state pour ajuster l'effet coverflow sur mobile
  const [windowWidth, setWindowWidth] = useState(1200);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    
    // Prefetch all routes for instant navigation on click
    CAROUSEL_ITEMS.forEach(item => {
      router.prefetch(`/shop/${item.slug}`);
    });

    return () => window.removeEventListener("resize", handleResize);
  }, [router]);

  const getSpacing = () => {
    if (!mounted) return 285;
    if (windowWidth < 640) return 160;
    if (windowWidth < 768) return 220;
    return 285;
  };

  const handleDragEnd = (idx: number, isActive: boolean, slug: string) => {
    return (_e: any, info: any) => {
      const delta = info.offset.x;
      const SWIPE_THRESHOLD = 20; // Lower threshold, simpler logic

      if (Math.abs(delta) > SWIPE_THRESHOLD) {
        // Swipe intent
        if (delta < 0 && activeIdx < CAROUSEL_ITEMS.length - 1) {
          setActiveIdx((p) => p + 1);
        } else if (delta > 0 && activeIdx > 0) {
          setActiveIdx((p) => p - 1);
        }
      } else {
        // Click intent
        if (isActive) {
          router.push(`/shop/${slug}`);
        } else {
          setActiveIdx(idx);
        }
      }
    };
  };

  const goPrev = () => setActiveIdx((p) => Math.max(0, p - 1));
  const goNext = () => setActiveIdx((p) => Math.min(CAROUSEL_ITEMS.length - 1, p + 1));

  const spacing = getSpacing();

  return (
    <div className="relative w-full py-10 overflow-hidden flex flex-col items-center justify-center bg-[#F8F5F2]">
      <div className="w-full max-w-[1200px] flex items-center justify-center h-[450px] md:h-[520px] relative" style={{ perspective: "1200px" }}>
        <AnimatePresence initial={false}>
          {CAROUSEL_ITEMS.map((item, idx) => {
            const isActive = idx === activeIdx;
            const diff = idx - activeIdx;

            const zIndex = 50 - Math.abs(diff);
            const xOffset = diff * spacing;
            const scale = isActive ? 1 : 0.82;
            const opacity = Math.abs(diff) > 2 ? 0 : isActive ? 1 : 0.55;
            const rotateY = diff * -12;

            return (
              <motion.div
                key={item.id}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={handleDragEnd(idx, isActive, item.slug)}
                initial={{ opacity: 0 }}
                animate={{
                  x: xOffset,
                  scale,
                  opacity,
                  rotateY,
                  zIndex,
                }}
                transition={{ type: "spring", stiffness: 280, damping: 28, mass: 0.9 }}
                className="absolute w-[240px] sm:w-[290px] md:w-[340px] h-[360px] sm:h-[420px] md:h-[460px] rounded-[24px] md:rounded-[28px] cursor-grab active:cursor-grabbing overflow-hidden shadow-xl"
                style={{ backgroundColor: item.color }}
              >
                {/* Image — couvre toute la carte du haut en bas */}
                <img
                  src={item.bgImage}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  draggable={false}
                />

                {/* Numéro — par-dessus l'image */}
                <div className="absolute top-5 left-0 right-0 text-center z-20 text-xs font-semibold tracking-[0.2em]" style={{ color: item.textColor, opacity: 0.85 }}>
                  {item.id} — 09
                </div>

                {/* Gradient de fondu bas → couleur de fond */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-36 z-10 pointer-events-none"
                  style={{ background: `linear-gradient(to bottom, transparent, ${item.color} 80%)` }}
                />

                {/* Texte */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-4 text-center z-20 flex flex-col items-center gap-2.5"
                  animate={{ opacity: isActive ? 1 : 0.5, y: isActive ? 0 : 8 }}
                  transition={{ duration: 0.35, delay: isActive ? 0.08 : 0 }}
                >
                  <h2 className="text-2xl font-bold tracking-widest" style={{ color: item.textColor }}>
                    {item.title}
                  </h2>
                  <p className="text-[11px] leading-snug font-medium" style={{ color: item.textColor, opacity: 0.72 }}>
                    {item.desc}
                  </p>
                  <motion.div
                    animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 6 }}
                    transition={{ duration: 0.25, delay: isActive ? 0.15 : 0 }}
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/shop/${item.slug}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-[11px] font-bold tracking-wide border border-white/30 backdrop-blur-md hover:scale-105 active:scale-95 transition-transform"
                      style={{
                        background: `${item.color}80`,
                        color: item.textColor,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                        pointerEvents: "auto",
                      }}
                    >
                      Découvrir
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </motion.div>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Contrôles : flèches + dots */}
      <div className="flex items-center gap-4 mt-6">
        <button
          onClick={goPrev}
          disabled={activeIdx === 0}
          className="w-9 h-9 rounded-full border border-[#2A2424]/25 flex items-center justify-center text-[#2A2424]/50 hover:text-[#2A2424] hover:border-[#2A2424]/60 hover:bg-white transition-all disabled:opacity-20 disabled:pointer-events-none shadow-sm"
          aria-label="Précédent"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Dots */}
        <div className="flex items-center gap-2">
          {CAROUSEL_ITEMS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`transition-all duration-300 rounded-full ${
                activeIdx === i
                  ? "w-8 h-2 bg-[#2A2424]"
                  : "w-2 h-2 bg-[#2A2424]/20 hover:bg-[#2A2424]/40"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={activeIdx === CAROUSEL_ITEMS.length - 1}
          className="w-9 h-9 rounded-full border border-[#2A2424]/25 flex items-center justify-center text-[#2A2424]/50 hover:text-[#2A2424] hover:border-[#2A2424]/60 hover:bg-white transition-all disabled:opacity-20 disabled:pointer-events-none shadow-sm"
          aria-label="Suivant"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
