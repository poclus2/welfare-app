"use client";

import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <div className="flex flex-col w-full h-full max-w-[1500px] mx-auto">
      {/* Top Content Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end px-5 md:px-10 pt-6 pb-8 md:pb-12 gap-8 md:gap-12">
        {/* Left: Text Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-[900px] flex flex-col gap-8"
        >
          <h1 className="text-[2.75rem] sm:text-[3.5rem] lg:text-[4.2rem] leading-[1.05] md:leading-[1.0] font-medium tracking-[-0.03em] text-foreground">
            Reveal your natural glow<br className="hidden md:block"/>with pure skincare blend.
          </h1>
          <p className="text-foreground/80 text-[1rem] md:text-[1.1rem] max-w-lg leading-relaxed pt-2">
            Pure botanical ingredients crafted to give your skin long-lasting moisture, a healthy glow, and visible improvement within days.
          </p>
          <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-2">
            <Link 
              href="/shop" 
              className="flex items-center gap-2 bg-foreground text-background px-6 py-3.5 md:px-7 md:py-4 rounded-[2rem] font-medium hover:bg-foreground/90 transition-all hover:scale-105 active:scale-95 shadow-md text-sm md:text-base w-full sm:w-auto justify-center"
            >
              Shop Now
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link 
              href="/about" 
              className="flex items-center gap-2 bg-transparent border border-foreground/20 text-foreground px-6 py-3.5 md:px-7 md:py-4 rounded-[2rem] font-medium hover:bg-black/5 transition-all hover:scale-105 active:scale-95 text-sm md:text-base w-full sm:w-auto justify-center"
            >
              Explore More
            </Link>
          </div>
        </motion.div>

        {/* Right: Trusted By */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col gap-2 pb-2 mt-4 lg:mt-0"
        >
          <span className="text-foreground font-medium text-[15px] md:text-[17px]">Trusted by</span>
          <div className="flex items-center -space-x-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-background overflow-hidden relative bg-muted">
                {/* Fallback avatars using unsplash */}
                <img 
                  src={`https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80&auto=format&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cG9ydHJhaXR8ZW58MHx8MHx8fDA%3D`} 
                  alt={`User ${i}`}
                  className="w-full h-full object-cover grayscale-[20%]"
                />
              </div>
            ))}
            <div className="w-10 h-10 rounded-full border-2 border-background flex items-center justify-center bg-foreground text-white text-[10px] font-bold z-10">
              40K+
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Images Row */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-5 px-5 md:px-10 pb-6 md:pb-10 h-auto md:h-[500px]">
        {/* Left Large Image */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative w-full md:w-[62%] h-[300px] md:h-full rounded-[1.5rem] md:rounded-[2rem] overflow-hidden group shadow-sm"
        >
          {/* We will use the mask model image */}
          <div className="absolute inset-0 bg-[#E5B6B9]/10 mix-blend-multiply z-10 pointer-events-none group-hover:opacity-0 transition-opacity duration-500"></div>
          <img 
            src="/hero_mask.png" 
            alt="Woman with face mask" 
            className="w-full h-full object-cover rounded-[2rem] group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        </motion.div>

        {/* Right Large Image */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="relative w-full md:w-[38%] h-[350px] md:h-full rounded-[1.5rem] md:rounded-[2rem] overflow-hidden group shadow-sm mt-2 md:mt-0"
        >
          <div className="absolute inset-0 bg-[#E5B6B9]/10 mix-blend-multiply z-10 pointer-events-none group-hover:opacity-0 transition-opacity duration-500"></div>
          <img 
            src="/hero_tube.png" 
            alt="Woman with skincare tube" 
            className="w-full h-full object-cover rounded-[2rem] group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          
          {/* Floating Product Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="absolute bottom-5 left-5 right-5 bg-background p-3 rounded-2xl flex items-center justify-between shadow-lg z-20 transition-transform duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white rounded-xl overflow-hidden relative shadow-sm border border-black/5">
                <img src="/hero_tube.png" alt="Product" className="w-full h-full object-cover scale-110" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground leading-snug">The Ordinary Squalane<br/>Cleanser 150ml</span>
                <span className="text-xs font-medium text-foreground/70 mt-0.5">Price: $76</span>
              </div>
            </div>
            <button className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/90 transition-colors shadow-md mr-1">
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
