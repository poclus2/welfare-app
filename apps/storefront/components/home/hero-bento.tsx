"use client";

import { motion } from "framer-motion";
import { ArrowRight, Leaf, Droplets, Sparkles, Lock, ShieldCheck, Sun, Search, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/ui/navbar";
import { SearchModal } from "@/components/ui/search-modal";
import { useState, useEffect } from "react";

export function HeroBento() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
    <div className="w-full min-h-screen bg-[#F4EAEB] flex flex-col items-center justify-start overflow-hidden">


        {/* Hero Content */}
        <div className="flex flex-col lg:flex-row px-8 md:px-12 pb-12 pt-4 gap-12 lg:gap-8 min-h-[750px] w-full max-w-[1600px] mx-auto">
          
          {/* Left Side: Text */}
          <div className="flex-1 flex flex-col justify-center max-w-xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-[3.5rem] md:text-[5rem] lg:text-[5.5rem] leading-[1.0] font-medium tracking-tight text-[#2A2424] mb-6">
                Skincare that<br/>feels like you.
              </h1>
              
              <p className="text-[#2A2424]/60 text-lg md:text-xl leading-relaxed mb-10 max-w-md">
                Elevate your daily routine with a seamless collection of botanical formulas. Effortless hydration, repair, and glow in one organic interface.
              </p>
              
              <div className="flex flex-wrap items-center gap-4">
                <Link 
                  href="/shop" 
                  className="bg-[#121212] text-white px-8 py-4 rounded-full text-[15px] font-medium hover:bg-black/80 transition-all hover:scale-105 active:scale-95"
                >
                  Build Your Routine
                </Link>
                <Link 
                  href="/about" 
                  className="bg-transparent border border-[#2A2424]/20 text-[#2A2424] px-8 py-4 rounded-full text-[15px] font-medium hover:bg-black/5 transition-all hover:scale-105 active:scale-95"
                >
                  Explore Products
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Right Side: Bento Grid */}
          <div className="flex-1 w-full lg:w-1/2 flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid grid-cols-2 grid-rows-[1fr_1fr_1.5fr] gap-4 w-full h-full max-h-[750px]"
            >
              {/* Top Left (Small wide-ish) */}
              <div className="col-span-1 row-span-1 rounded-[1.5rem] overflow-hidden relative group shadow-sm bg-[#D9D3CA]">
                <img src="https://images.pexels.com/photos/4465121/pexels-photo-4465121.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Serum" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>

              {/* Top Right (Tall) */}
              <div className="col-span-1 row-span-2 rounded-[1.5rem] overflow-hidden relative group shadow-sm bg-[#E1DAD0]">
                <img src="https://images.pexels.com/photos/3685523/pexels-photo-3685523.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Product Bundle" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
              </div>

              {/* Middle Left (Small square-ish) */}
              <div className="col-span-1 row-span-1 rounded-[1.5rem] overflow-hidden relative group shadow-sm bg-[#E5DFD4]">
                <img src="https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Cream" className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" />
              </div>

              {/* Bottom (Wide) */}
              <div className="col-span-2 row-span-1 rounded-[1.5rem] overflow-hidden relative group shadow-sm bg-[#D3CFC6]">
                <img src="https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Applying Cream" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                
                {/* Bottom Left Info */}
                <div className="absolute bottom-6 left-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#B2C28E] flex items-center justify-center text-white shadow-md">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col text-white">
                    <span className="text-xs font-bold tracking-wider uppercase">Morning Routine | <span className="text-[#B2C28E]">Active</span></span>
                    <span className="text-[11px] opacity-80 mt-0.5">Hydration 98% | Protection ON</span>
                  </div>
                </div>

                {/* Vertical Slider Control Mockup */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 h-32 w-10 bg-white/20 backdrop-blur-md rounded-full border border-white/30 p-1 flex flex-col justify-end shadow-lg">
                  <div className="w-full h-2/3 bg-white rounded-full flex items-end justify-center pb-2 shadow-inner">
                    <Sun className="w-4 h-4 text-[#2A2424]" />
                  </div>
                </div>

              </div>
            </motion.div>
          </div>

        </div>
    </div>
  );
}
