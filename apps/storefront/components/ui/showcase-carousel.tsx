"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CAROUSEL_ITEMS = [
  {
    id: "01",
    title: "NETTOYANTS",
    desc: "Le rituel du double cleansing. Une peau purifiée, prête à recevoir ses soins.",
    bgImage: "/carroussel/nettoyants.png",
    color: "#cae3fe",
    textColor: "#1a3a5c",
  },
  {
    id: "02",
    title: "TONERS",
    desc: "Hydratation immédiate. La première couche essentielle du soin coréen.",
    bgImage: "/carroussel/toners.png",
    color: "#ffd3dc",
    textColor: "#5c1a2e",
  },
  {
    id: "03",
    title: "SÉRUMS",
    desc: "Des actifs concentrés pour cibler éclat, fermeté et pureté.",
    bgImage: "/carroussel/serums.png",
    color: "#f1e7d4",
    textColor: "#4a3010",
  },
  {
    id: "04",
    title: "CRÈMES",
    desc: "Nutrition & barrière cutanée. Des textures onctueuses pour sceller le soin.",
    bgImage: "/carroussel/cremes.png",
    color: "#e7cffb",
    textColor: "#3a1f5c",
  },
  {
    id: "05",
    title: "MASQUES",
    desc: "Sheet masks & sleeping masks pour une peau repulpée du jour au lendemain.",
    bgImage: "/carroussel/masques.png",
    color: "#d4e7cf",
    textColor: "#1a3d1f",
  },
  {
    id: "06",
    title: "SOLAIRES",
    desc: "Protection SPF légère et invisible. L'étape finale incontournable.",
    bgImage: "/carroussel/solaires.png",
    color: "#f5cfaa",
    textColor: "#5c2e0a",
  },
  {
    id: "07",
    title: "CHEVEUX",
    desc: "K-Haircare & Head Spa coréen pour un cuir chevelu sain.",
    bgImage: "/carroussel/cheveux.png",
    color: "#d0ecea",
    textColor: "#1a3d3a",
  },
  {
    id: "08",
    title: "YEUX & LÈVRES",
    desc: "Patchs yeux et soins lèvres pour les zones les plus délicates.",
    bgImage: "/carroussel/yeux-levres.png",
    color: "#fcbec8",
    textColor: "#5c1a2e",
  },
  {
    id: "09",
    title: "MAQUILLAGE",
    desc: "Cushions, BB creams & lip tints pour le Glass Skin coréen.",
    bgImage: "/carroussel/maquillage.png",
    color: "#f8c5c1",
    textColor: "#5c1a18",
  },
];

export function ShowcaseCarousel() {
  const [activeIdx, setActiveIdx] = useState(2);
  const [dragStart, setDragStart] = useState(0);

  // Responsive state pour ajuster l'effet coverflow sur mobile
  const [windowWidth, setWindowWidth] = useState(1200);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getSpacing = () => {
    if (!mounted) return 285;
    if (windowWidth < 640) return 160; // Espacement très réduit sur mobile
    if (windowWidth < 768) return 220; // Espacement moyen sur tablette
    return 285; // Espacement normal sur desktop
  };

  const handleDragStart = (_e: any, info: any) => {
    setDragStart(info.point.x);
  };

  const handleDragEnd = (_e: any, info: any) => {
    const diff = dragStart - info.point.x;
    if (diff > 50 && activeIdx < CAROUSEL_ITEMS.length - 1) {
      setActiveIdx((p) => p + 1);
    } else if (diff < -50 && activeIdx > 0) {
      setActiveIdx((p) => p - 1);
    }
  };

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
                onClick={() => setActiveIdx(idx)}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
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

                {/* Texte — par-dessus le gradient */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-4 text-center z-20"
                  animate={{ opacity: isActive ? 1 : 0.5, y: isActive ? 0 : 8 }}
                  transition={{ duration: 0.35, delay: isActive ? 0.08 : 0 }}
                >
                  <h2 className="text-2xl font-bold tracking-widest mb-1.5" style={{ color: item.textColor }}>
                    {item.title}
                  </h2>
                  <p className="text-xs leading-relaxed font-medium" style={{ color: item.textColor, opacity: 0.75 }}>
                    {item.desc}
                  </p>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-3 mt-4">
        {CAROUSEL_ITEMS.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className={`transition-all duration-300 rounded-full ${
              activeIdx === i
                ? "w-8 h-2 bg-[#2A2424]"
                : "w-2 h-2 bg-[#2A2424]/20 hover:bg-[#2A2424]/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
