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
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        
        {/* Navbar */}
        <div className="w-full bg-transparent z-40 relative pt-4 md:pt-6">
          <header className="flex items-center justify-between px-8 md:px-12 h-20 lg:h-24 w-full max-w-[1600px] mx-auto">
            
            {/* Logo and Links Group */}
            <div className="flex items-center gap-12 lg:gap-20">
              <Link href="/" className="flex items-center relative z-50">
                <img 
                  src="/logo.png" 
                  alt="The Welfare Shop" 
                  className="h-16 lg:h-20 w-auto object-contain scale-[1.3] lg:scale-[1.8] origin-left" 
                />
              </Link>

              <div className="hidden lg:flex items-center gap-8 text-[15px] font-medium text-[#2A2424]/70">
                <Link href="/" className="hover:text-[#2A2424] transition-colors">Ecosystem</Link>
                <Link href="/shop" className="hover:text-[#2A2424] transition-colors">Products</Link>
                <Link href="/routines" className="flex items-center gap-1 hover:text-[#2A2424] transition-colors">
                  Routines <sup className="text-[10px] bg-[#E5B6B9]/30 px-1.5 rounded-full text-[#2A2424]">New</sup>
                </Link>
                <Link href="/about" className="hover:text-[#2A2424] transition-colors">
                  Learn
                </Link>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6">
              {/* Selectors */}
              <div className="hidden lg:flex items-center gap-3 text-xs font-bold text-[#2A2424]/60 mr-2">
                <select className="bg-transparent focus:outline-none cursor-pointer hover:text-[#2A2424] transition-colors appearance-none">
                  <option>FR</option>
                  <option>EN</option>
                </select>
                <select className="bg-transparent focus:outline-none cursor-pointer hover:text-[#2A2424] transition-colors appearance-none">
                  <option>FCFA</option>
                  <option>EUR</option>
                  <option>USD</option>
                </select>
              </div>

              {/* Search Bar - Enlarged */}
              <div 
                className="hidden md:flex items-center relative cursor-text group"
                onClick={() => setIsSearchOpen(true)}
              >
                <div className="absolute inset-0 bg-white/60 border border-white/80 rounded-full transition-all group-hover:bg-white group-hover:shadow-md pointer-events-none" />
                <span className="pl-12 pr-6 py-3 text-sm text-[#2A2424]/50 relative z-10 w-[300px] lg:w-[450px] flex items-center">
                  Rechercher un produit, une marque...
                </span>
                <Search className="w-5 h-5 absolute left-4 text-[#2A2424]/50 z-10 group-hover:text-[#2A2424] transition-colors" />
                
                {/* Shortcut hint */}
                <div className="absolute right-4 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-semibold text-[#2A2424]/40 bg-black/5 px-2 py-1 rounded">Ctrl K</span>
                </div>
              </div>

              {/* Cart Button */}
              <button className="p-3 text-[#2A2424] hover:bg-white/60 rounded-full transition-colors relative group">
                <ShoppingBag className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#2A2424] rounded-full border-2 border-white"></span>
              </button>
            </div>
          </header>
        </div>

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
