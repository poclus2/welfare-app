"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════ */
// The user can add more panels and use .mp4 or .gif here.
const PANELS = [
  {
    id: "01",
    title: "ANUA",
    subtitle: "HEARTLEAF 77%",
    desc: "La gamme culte pour apaiser instantanément les peaux sensibles.",
    media: "/anua_products.png",
    isVideo: false, // Set to true if using an mp4
    link: "/shop/all",
    bg: "#8E354A"
  },
  {
    id: "02",
    title: "MEDICUBE",
    subtitle: "INNOVATION CLINIQUE",
    desc: "Des soins dermo-cosmétiques pour une peau sans défaut.",
    media: "/medicube_products.png",
    isVideo: false,
    link: "/shop/all",
    bg: "#E8B4B8"
  },
  {
    id: "03",
    title: "COSRX",
    subtitle: "SNAIL MUCIN",
    desc: "L'hydratation ultime réparatrice pour un glow instantané.",
    media: "/im_cat_nettoyant.png",
    isVideo: false,
    link: "/shop/all",
    bg: "#DABCAE"
  },
  {
    id: "04",
    title: "LANEIGE",
    subtitle: "WATER BANK",
    desc: "Hydratation profonde 24h avec une texture légère et rafraîchissante.",
    media: "/im_cat_creme.png",
    isVideo: false,
    link: "/shop/all",
    bg: "#D08882"
  },
  {
    id: "05",
    title: "JOSEON",
    subtitle: "RELIEF SUN",
    desc: "Protection SPF50 avec un fini totalement invisible et apaisant.",
    media: "/im_cat_sunscreen.png",
    isVideo: false,
    link: "/shop/all",
    bg: "#B28C84"
  },
];

export function AccordionHero() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(0); // Default open first panel

  return (
    <div className="w-full h-[450px] md:h-[550px] flex overflow-hidden rounded-[32px] bg-[#2A2424] shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      {PANELS.map((panel, idx) => {
        const isActive = hoveredIdx === idx;

        return (
          <motion.div
            key={panel.id}
            onMouseEnter={() => setHoveredIdx(idx)}
            onClick={() => setHoveredIdx(idx)}
            layout
            initial={false}
            animate={{
              flex: isActive ? 10 : 1,
            }}
            transition={{ type: "spring", stiffness: 180, damping: 25 }}
            className="relative h-full overflow-hidden border-r border-[#2A2424]/10 last:border-r-0 group cursor-pointer"
            style={{ backgroundColor: panel.bg }}
          >
            {/* Background Media */}
            <div className="absolute inset-0 w-full h-full flex items-center justify-center p-0 md:p-8">
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
                  alt={panel.title}
                  className="w-full h-[150%] md:h-full object-contain mix-blend-multiply opacity-90 drop-shadow-2xl translate-y-[20%] md:translate-y-[10%]"
                />
              )}
            </div>

            {/* Gradient Overlay for Text Readability */}
            <div
              className={`absolute inset-0 bg-gradient-to-t from-[#2A2424]/90 via-[#2A2424]/30 to-transparent transition-opacity duration-500 ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
            />
            {/* Overlay darker on non-active to hide content slightly */}
            <div
              className={`absolute inset-0 bg-black/30 transition-opacity duration-500 ${
                isActive ? "opacity-0" : "opacity-100"
              }`}
            />

            {/* Vertical Title (when collapsed) */}
            <div
              className={`absolute inset-0 py-8 flex flex-col items-center justify-end transition-opacity duration-300 ${
                isActive ? "opacity-0 pointer-events-none" : "opacity-100 delay-100"
              }`}
            >
              <div className="h-full flex items-end pb-12 overflow-hidden">
                <span className="text-white font-bold tracking-widest text-xs md:text-sm whitespace-nowrap -rotate-90 origin-bottom">
                  {panel.title}
                </span>
              </div>
              <span className="text-white/80 text-[10px] font-bold mt-auto mb-2">{panel.id}</span>
            </div>

            {/* Expanded Content */}
            <div
              className={`absolute inset-0 p-6 md:p-10 flex flex-col justify-between transition-opacity duration-500 ${
                isActive ? "opacity-100 delay-200" : "opacity-0 pointer-events-none"
              }`}
            >
              <div className="text-white/90 text-sm font-bold tracking-widest">
                / {panel.id}
              </div>

              <div className="flex flex-col items-start w-full min-w-[280px] md:min-w-[400px]">
                <p className="text-white/80 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1 md:mb-2 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  {panel.subtitle}
                </p>
                <h2 className="text-3xl md:text-5xl font-black text-white leading-none tracking-tight mb-2 md:mb-4 uppercase drop-shadow-md">
                  {panel.title}
                </h2>
                <p className="text-white/95 text-xs md:text-[15px] font-medium max-w-[250px] md:max-w-sm mb-6 md:mb-8 leading-relaxed drop-shadow-sm">
                  {panel.desc}
                </p>

                <Link
                  href={panel.link}
                  className="bg-white text-[#1C1C1C] text-[13px] md:text-sm font-bold py-3 px-6 rounded-full flex items-center justify-center gap-2 hover:bg-[#F4EAEB] transition-all shadow-xl group-hover:pl-7"
                >
                  Découvrir <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
