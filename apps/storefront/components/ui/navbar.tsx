"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Search, Menu, User, X, Sparkles, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/auth";

export function Navbar() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShopHovered, setIsShopHovered] = useState(false);
  const [isMobileShopOpen, setIsMobileShopOpen] = useState(false);

  const handleAccountClick = () => {
    if (role === "INFLUENCEUR") {
      router.push("/ambassadrices");
    } else {
      router.push("/account");
    }
  };

  return (
    <>
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex items-center justify-between px-6 py-4 w-full md:w-[90%] max-w-[1100px] mx-auto md:mt-4 bg-[#FDFDFC] md:rounded-full shadow-sm relative z-50 border-b md:border border-[#F4EAEB]"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-[#2A2424] font-bold text-lg tracking-wide hover:opacity-80 transition-opacity">
          <img src="/logo.png" alt="The Welfare Shop" className="h-16 md:h-24 w-auto object-contain scale-125 md:scale-[1.8] origin-left" />
        </Link>

        {/* Navigation Links - Desktop */}
        <div className="hidden lg:flex items-center gap-8 text-[15px] font-medium absolute left-1/2 -translate-x-1/2 h-full">
          <Link href="/" className="text-[#2A2424]/70 hover:text-[#2A2424] transition-colors">Accueil</Link>
          
          <Link href="/skin-coach" className="flex items-center gap-1.5 text-[#2A2424] font-semibold hover:opacity-80 transition-opacity">
            <Sparkles className="w-4 h-4 text-[#E5B6B9]" /> My Skin Coach
          </Link>
          
          <div 
            className="relative h-full flex items-center cursor-pointer"
            onMouseEnter={() => setIsShopHovered(true)}
            onMouseLeave={() => setIsShopHovered(false)}
          >
            <Link href="/shop" className="flex items-center gap-1 text-[#2A2424]/70 hover:text-[#2A2424] transition-colors">
              Boutique <ChevronDown className="w-3.5 h-3.5" />
            </Link>
            
            {/* Dropdown Boutique */}
            <AnimatePresence>
              {isShopHovered && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-[#FDFDFC] rounded-2xl shadow-lg border border-[#F4EAEB] overflow-hidden py-2"
                >
                  <Link href="/shop/face-care" className="block px-5 py-2.5 text-sm text-[#2A2424]/70 hover:text-[#2A2424] hover:bg-[#F1EFEA] transition-colors">Face Care</Link>
                  <Link href="/shop/body-care" className="block px-5 py-2.5 text-sm text-[#2A2424]/70 hover:text-[#2A2424] hover:bg-[#F1EFEA] transition-colors">Body Care</Link>
                  <Link href="/shop/hair-care" className="block px-5 py-2.5 text-sm text-[#2A2424]/70 hover:text-[#2A2424] hover:bg-[#F1EFEA] transition-colors">Hair Care</Link>
                  <Link href="/shop/supplements" className="block px-5 py-2.5 text-sm text-[#2A2424]/70 hover:text-[#2A2424] hover:bg-[#F1EFEA] transition-colors">Supplements</Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <Link href="/learning-center" className="text-[#2A2424]/70 hover:text-[#2A2424] transition-colors">Skin Learning Center</Link>
          <Link href="/ambassadrices" className="text-[#2A2424]/70 hover:text-[#2A2424] transition-colors">Ambassadrices</Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          <button className="p-2 text-[#2A2424] hover:bg-[#F1EFEA] rounded-full transition-colors hidden md:block">
            <Search className="w-5 h-5" />
          </button>
          
          <button 
            onClick={handleAccountClick}
            className="p-2 text-[#2A2424] hover:bg-[#F1EFEA] rounded-full transition-colors hidden md:block"
          >
            <User className="w-5 h-5" />
          </button>
          
          <button className="relative p-2 text-[#2A2424] hover:bg-[#F1EFEA] rounded-full transition-colors">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#E5B6B9] text-[9px] font-bold text-white">
              0
            </span>
          </button>
          
          <button 
            className="lg:hidden p-2 text-[#2A2424] hover:bg-[#F1EFEA] rounded-full transition-colors ml-1"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </motion.nav>

      {/* Mobile Drawer (Side Drawer) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 z-[60] lg:hidden backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-[360px] bg-[#FDFDFC] shadow-2xl z-[70] lg:hidden flex flex-col overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-[#F4EAEB]">
                <img src="/logo.png" alt="The Welfare Shop" className="h-14 w-auto object-contain scale-125 origin-left" />
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 bg-[#F1EFEA] rounded-full text-[#2A2424]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col p-6 gap-6">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-medium text-[#2A2424]">
                  Accueil
                </Link>
                
                <Link href="/skin-coach" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-xl font-medium text-[#2A2424] bg-[#F1EFEA] p-4 rounded-2xl">
                  <Sparkles className="w-5 h-5 text-[#E5B6B9]" /> My Skin Coach
                </Link>

                <div className="flex flex-col">
                  <button 
                    onClick={() => setIsMobileShopOpen(!isMobileShopOpen)}
                    className="flex items-center justify-between text-xl font-medium text-[#2A2424] w-full text-left"
                  >
                    Boutique
                    <ChevronDown className={`w-5 h-5 transition-transform ${isMobileShopOpen ? "rotate-180" : ""}`} />
                  </button>
                  
                  <AnimatePresence>
                    {isMobileShopOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="flex flex-col gap-4 overflow-hidden pt-4 pl-4 border-l-2 border-[#F4EAEB] ml-2"
                      >
                        <Link href="/shop/face-care" onClick={() => setIsMobileMenuOpen(false)} className="text-lg text-[#2A2424]/70">Face Care</Link>
                        <Link href="/shop/body-care" onClick={() => setIsMobileMenuOpen(false)} className="text-lg text-[#2A2424]/70">Body Care</Link>
                        <Link href="/shop/hair-care" onClick={() => setIsMobileMenuOpen(false)} className="text-lg text-[#2A2424]/70">Hair Care</Link>
                        <Link href="/shop/supplements" onClick={() => setIsMobileMenuOpen(false)} className="text-lg text-[#2A2424]/70">Supplements</Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link href="/learning-center" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-medium text-[#2A2424]">
                  Skin Learning Center
                </Link>

                <Link href="/ambassadrices" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-medium text-[#2A2424]">
                  🤝 Devenir Ambassadrice
                </Link>
              </div>

              <div className="mt-auto p-6">
                <div className="w-full h-px bg-[#F4EAEB] mb-6" />
                <button 
                  onClick={() => {
                    handleAccountClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 text-lg font-medium text-[#2A2424]"
                >
                  <User className="w-6 h-6" /> Mon Compte / Connexion
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
