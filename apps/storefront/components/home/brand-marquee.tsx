"use client";

import { motion } from "framer-motion";

const brands = [
  { name: "medicube", style: "font-sans font-black tracking-tighter text-3xl lowercase" },
  { name: "SKIN1004", style: "font-sans font-light tracking-[0.3em] text-xl" },
  { name: "Biodance", style: "font-serif font-medium tracking-wide text-3xl" },
  { name: "COSRX", style: "font-sans font-bold tracking-normal text-4xl" },
  { name: "yepoda", style: "font-sans font-semibold tracking-tight text-3xl" },
  { name: "ERBORIAN", style: "font-serif font-normal tracking-[0.2em] text-xl" },
  { name: "LANEIGE", style: "font-sans font-medium tracking-[0.25em] text-xl" },
  { name: "isntree", style: "font-sans font-bold tracking-tight text-3xl lowercase" }
];

// Duplicate the array to create a seamless infinite scroll
const marqueeBrands = [...brands, ...brands, ...brands];

export function BrandMarquee() {
  return (
    <section className="w-full bg-[#2A2424] py-10 overflow-hidden flex flex-col items-center">
      <div className="w-full max-w-[1600px] mx-auto px-8 md:px-12 mb-6">
        <p className="text-center text-xs font-bold tracking-[0.2em] uppercase text-white/50">
          Les meilleures marques mondiales nous font confiance
        </p>
      </div>
      
      <div className="relative flex w-full overflow-hidden">
        {/* Left gradient mask */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#2A2424] to-transparent z-10"></div>
        
        {/* Scrolling Content */}
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 30, // Adjust speed here
          }}
          className="flex whitespace-nowrap items-center gap-16 md:gap-24 px-8"
        >
          {marqueeBrands.map((brand, index) => (
            <div 
              key={index} 
              className="relative flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity duration-300 cursor-default mx-8"
            >
              <span className={`text-white ${brand.style}`}>
                {brand.name}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Right gradient mask */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#2A2424] to-transparent z-10"></div>
      </div>
    </section>
  );
}
