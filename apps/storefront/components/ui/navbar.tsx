"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Search, Menu, User, X, Sparkles, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/auth";
import { SearchModal } from "@/components/ui/search-modal";

export function Navbar() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShopHovered, setIsShopHovered] = useState(false);
  const [isMobileShopOpen, setIsMobileShopOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleAccountClick = () => {
    if (role === "INFLUENCEUR") {
      router.push("/ambassadrices");
    } else {
      router.push("/account");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      {/* ──────────────────────────────────────────────
          DESKTOP NAVBAR (Rose)
      ────────────────────────────────────────────── */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="hidden md:flex items-center justify-between px-6 lg:px-12 py-3 w-full bg-white relative z-50 border-b border-[#2A2424]/5"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-[#2A2424] font-bold text-lg tracking-wide hover:opacity-80 transition-opacity">
          <img src="/logo.png" alt="The Welfare Shop" className="h-14 w-auto object-contain scale-[1.3] origin-left" />
        </Link>

        {/* Search Bar - Center */}
        <div className="flex-1 flex justify-center px-4 md:px-8 relative">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="w-full max-w-xl bg-[#F8F5F2] hover:bg-[#F1EFEA] transition-colors border border-[#2A2424]/10 rounded-full py-2.5 px-5 flex items-center justify-between text-[#2A2424]/70 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-[#2A2424]/50" />
              <span className="text-sm font-medium">Rechercher un soin, un ingrédient...</span>
            </div>
            <div className="hidden lg:flex items-center gap-1">
              <kbd className="bg-white/50 px-2 py-0.5 rounded text-[10px] font-bold text-[#2A2424]/60">Cmd</kbd>
              <kbd className="bg-white/50 px-2 py-0.5 rounded text-[10px] font-bold text-[#2A2424]/60">K</kbd>
            </div>
          </button>
        </div>

        {/* Navigation Links & Actions - Right */}
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href="/shop" className="text-[#2A2424] hover:opacity-70 transition-opacity">Boutique</Link>
          <Link href="/skin-coach" className="flex items-center gap-1.5 text-[#2A2424] hover:opacity-70 transition-opacity">
            <Sparkles className="w-4 h-4" /> My Skin Coach
          </Link>
          <Link href="/ambassadrices" className="text-[#2A2424] hover:opacity-70 transition-opacity">Ambassadrices</Link>
          
          <div className="w-px h-5 bg-[#2A2424]/10 mx-1" />
          
          <button onClick={handleAccountClick} className="p-2 text-[#2A2424] hover:bg-white/30 rounded-full transition-colors">
            <User className="w-5 h-5" />
          </button>
          <button className="relative p-2 text-[#2A2424] hover:bg-white/30 rounded-full transition-colors">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#2A2424] text-[9px] font-bold text-white shadow-sm">
              0
            </span>
          </button>
        </div>
      </motion.nav>

      {/* ──────────────────────────────────────────────
          MOBILE NAVBAR (Blanc - Gardé intact)
      ────────────────────────────────────────────── */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex md:hidden items-center justify-between px-5 py-4 w-full bg-[#FDFDFC] relative z-50 border-b border-[#F4EAEB]"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-[#2A2424] font-bold text-lg tracking-wide hover:opacity-80 transition-opacity">
          <img src="/logo.png" alt="The Welfare Shop" className="h-12 w-auto object-contain scale-[1.3] origin-left" />
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          <button onClick={() => setIsSearchOpen(true)} className="p-2 text-[#2A2424] hover:bg-[#F1EFEA] rounded-full transition-colors">
            <Search className="w-5 h-5" />
          </button>
          
          <button className="relative p-2 text-[#2A2424] hover:bg-[#F1EFEA] rounded-full transition-colors">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#E5B6B9] text-[9px] font-bold text-white">
              0
            </span>
          </button>
          
          <button 
            className="p-2 text-[#2A2424] hover:bg-[#F1EFEA] rounded-full transition-colors ml-1"
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
                  <div className="flex items-center justify-between w-full">
                    <Link 
                      href="/shop" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-xl font-medium text-[#2A2424] flex-1 text-left"
                    >
                      Boutique
                    </Link>
                    <button 
                      onClick={() => setIsMobileShopOpen(!isMobileShopOpen)}
                      className="p-2"
                    >
                      <ChevronDown className={`w-6 h-6 transition-transform ${isMobileShopOpen ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                  
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
