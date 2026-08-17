"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CAROUSEL_ITEMS = [
  {
    id: "01",
    title: "MIST",
    desc: "A close-up interaction turns a small detail into the main event, making the transition feel intimate and sensory.",
    bgImage: "/im_cat_toner.png",
    color: "#D08882"
  },
  {
    id: "02",
    title: "ESSENCE",
    desc: "A focused product moment built around atmosphere, material detail, and a quiet sense of presence.",
    bgImage: "/im_cat_serum.png",
    color: "#B28C84"
  },
  {
    id: "03",
    title: "DROP",
    desc: "Precision, texture, and timing come together in one delicate moment designed to pull the viewer closer.",
    bgImage: "/anua_products.png",
    color: "#E2A490"
  },
  {
    id: "04",
    title: "TOUCH",
    desc: "Soft color, tactile product detail, and generous space create a refined beauty story with room to breathe.",
    bgImage: "/im_cat_creme.png",
    color: "#E5B6B9"
  },
  {
    id: "05",
    title: "AURORA",
    desc: "A limited edition perfume showcasing elegance and subtle beauty in every spray.",
    bgImage: "/im_cat_sunscreen.png",
    color: "#DABCAE"
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
                  {item.id} — 05
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
