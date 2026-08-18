"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CAROUSEL_ITEMS = [
  {
    id: "01",
    title: "NETTOYANTS",
    desc: "Le point de départ du double cleansing. Une peau nette et purifiée, prête à recevoir ses soins.",
    bgImage: "/carroussel/nettoyants.png",
    color: "#6B8EAD"
  },
  {
    id: "02",
    title: "TONERS",
    desc: "Rééquilibrage et hydratation immédiate. La première étape essentielle pour préparer la peau.",
    bgImage: "/carroussel/toners.png",
    color: "#D08882"
  },
  {
    id: "03",
    title: "SÉRUMS",
    desc: "Des actifs concentrés pour cibler spécifiquement les besoins de votre peau : éclat, fermeté, pureté.",
    bgImage: "/carroussel/serums.png",
    color: "#C99B6A"
  },
  {
    id: "04",
    title: "CRÈMES",
    desc: "Scellez l'hydratation et renforcez la barrière cutanée avec des textures onctueuses et réconfortantes.",
    bgImage: "/carroussel/cremes.png",
    color: "#A58B9D"
  },
  {
    id: "05",
    title: "MASQUES",
    desc: "Un bain d'hydratation et d'actifs en tissu ou de nuit pour une peau repulpée et lumineuse.",
    bgImage: "/carroussel/masques.png",
    color: "#82A691"
  },
  {
    id: "06",
    title: "SOLAIRES",
    desc: "La protection ultime. Bouclier quotidien contre les UV avec des textures légères et invisibles.",
    bgImage: "/carroussel/solaires.png",
    color: "#D48D6C"
  },
  {
    id: "07",
    title: "CHEVEUX",
    desc: "L'expertise Head Spa coréenne pour un cuir chevelu sain et des longueurs éclatantes de vitalité.",
    bgImage: "/carroussel/cheveux.png",
    color: "#6B9E9B"
  },
  {
    id: "08",
    title: "YEUX & LÈVRES",
    desc: "Des soins spécifiques, doux et lissants pour les zones les plus délicates de votre visage.",
    bgImage: "/carroussel/yeux-levres.png",
    color: "#B86B77"
  },
  {
    id: "09",
    title: "MAQUILLAGE",
    desc: "Des formules hybrides mi-soin, mi-makeup pour obtenir le célèbre teint « Glass Skin ».",
    bgImage: "/carroussel/maquillage.png",
    color: "#C47C74"
  }
];

export function ShowcaseCarousel() {
  const [activeIdx, setActiveIdx] = useState(2); // Start at the middle (DROP)
  
  // Drag constraints
  const [dragStart, setDragStart] = useState(0);

  const handleDragStart = (e: any, info: any) => {
    setDragStart(info.point.x);
  };

  const handleDragEnd = (e: any, info: any) => {
    const dragEnd = info.point.x;
    const diff = dragStart - dragEnd;
    
    // threshold
    if (diff > 50 && activeIdx < CAROUSEL_ITEMS.length - 1) {
      setActiveIdx((prev) => prev + 1);
    } else if (diff < -50 && activeIdx > 0) {
      setActiveIdx((prev) => prev - 1);
    }
  };

  return (
    <div className="relative w-full py-10 overflow-hidden flex flex-col items-center justify-center bg-[#F8F5F2]">
      <div className="w-full max-w-[1200px] flex items-center justify-center h-[500px] relative perspective-1000">
        <AnimatePresence initial={false}>
          {CAROUSEL_ITEMS.map((item, idx) => {
            const isActive = idx === activeIdx;
            const diff = idx - activeIdx;
            
            // Calculate styles for coverflow effect
            const zIndex = 50 - Math.abs(diff);
            const xOffset = diff * 280; // horizontal spacing
            const scale = isActive ? 1 : 0.85;
            const opacity = isActive ? 1 : 0.5;
            const rotateY = diff * -15; // rotate side cards slightly inward

            return (
              <motion.div
                key={item.id}
                onClick={() => setActiveIdx(idx)}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                initial={{ opacity: 0, x: xOffset + (diff > 0 ? 100 : -100) }}
                animate={{
                  x: xOffset,
                  scale: scale,
                  opacity: opacity,
                  rotateY: rotateY,
                  zIndex: zIndex,
                }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 25,
                  mass: 1,
                }}
                className={`absolute w-[300px] md:w-[350px] h-[400px] md:h-[450px] rounded-[32px] cursor-grab active:cursor-grabbing overflow-hidden shadow-2xl flex flex-col items-center justify-center`}
                style={{ backgroundColor: item.color }}
              >
                {/* Number Indicator */}
                <div className="absolute top-6 w-full text-center text-white/80 text-sm font-medium tracking-widest z-20">
                  {item.id} — 09
                </div>

                {/* Product Image */}
                <motion.div 
                  className="flex-1 w-full flex items-center justify-center p-8 mt-10 z-10"
                  animate={{ y: isActive ? 0 : 20 }}
                  transition={{ duration: 0.5 }}
                >
                  <img 
                    src={item.bgImage} 
                    alt={item.title} 
                    className="w-full h-full object-contain mix-blend-multiply drop-shadow-xl"
                    draggable={false}
                  />
                </motion.div>

                {/* Text Content */}
                <motion.div 
                  className="w-full px-8 pb-10 text-center z-20"
                  animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
                  transition={{ duration: 0.4, delay: isActive ? 0.1 : 0 }}
                >
                  <h2 className="text-3xl font-bold text-white tracking-widest mb-3">
                    {item.title}
                  </h2>
                  <p className="text-white/90 text-xs leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </motion.div>
                
                {/* Subtle gradient overlay to enhance depth */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 pointer-events-none" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Pagination Dots */}
      <div className="flex items-center gap-3 mt-6">
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
