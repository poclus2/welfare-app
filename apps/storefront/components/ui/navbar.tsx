"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, MagnifyingGlass, List, User, X, CaretDown } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/auth";
import { SearchModal } from "@/components/ui/search-modal";
import { useCart } from "@/lib/cart-context";
import { IconIA } from "@/components/ui/icons/IconIA";
import { LanguageSwitcher } from "./language-switcher";
import { useI18n } from "@/lib/i18n-context";

export function Navbar({ dict }: { dict?: any }) {
  const { t } = useI18n();
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const { totalItems, openCart } = useCart();
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
        className="hidden xl:flex items-center justify-between px-6 lg:px-12 py-3 w-full bg-white relative z-50 border-b border-[#2A2424]/5"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-[#2A2424] font-bold text-lg tracking-wide hover:opacity-80 transition-opacity">
          <img src="/logo.webp" alt="The Welfare Shop" className="h-14 w-auto object-contain scale-[1.3] origin-left" />
        </Link>

        {/* Search Bar - Center */}
        <div className="flex-1 flex justify-center px-4 md:px-8 relative">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="w-full max-w-xl bg-[#F8F5F2] hover:bg-[#F1EFEA] transition-colors border border-[#2A2424]/10 rounded-full py-2.5 px-5 flex items-center justify-between text-[#2A2424]/70 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <MagnifyingGlass className="w-5 h-5 text-[#2A2424]/50" />
              <span className="text-sm font-medium">{t("Rechercher un soin, un ingrédient...")}</span>
            </div>
            <div className="hidden lg:flex items-center gap-1">
              <kbd className="bg-white/50 px-2 py-0.5 rounded text-[10px] font-bold text-[#2A2424]/60">Cmd</kbd>
              <kbd className="bg-white/50 px-2 py-0.5 rounded text-[10px] font-bold text-[#2A2424]/60">K</kbd>
            </div>
          </button>
        </div>

        {/* Navigation Links & Actions - Right */}
        <div className="flex items-center gap-6 text-sm font-medium">
          {/* BOUTIQUE WITH MEGA MENU */}
          <div 
            className="relative h-full flex items-center group"
            onMouseEnter={() => setIsShopHovered(true)}
            onMouseLeave={() => setIsShopHovered(false)}
          >
            <Link href="/shop" className="text-[#2A2424] hover:opacity-70 transition-opacity py-4">{t("Boutique")}</Link>
            
            <AnimatePresence>
              {isShopHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 w-[800px] bg-white shadow-2xl rounded-2xl border border-[#F4EAEB] p-8 flex gap-8 z-50 cursor-default"
                >
                  {/* Face Care */}
                  <div className="flex-1">
                    <Link href="/shop/face-care" className="font-bold text-[#2A2424] border-b border-[#F4EAEB] pb-2 mb-4 block hover:text-[#E5B6B9] transition-colors">Face Care</Link>
                    <div className="flex flex-col gap-2.5">
                      <Link href="/shop/cleanser" className="text-sm text-[#2A2424]/70 hover:text-[#2A2424] hover:underline">Cleanser</Link>
                      <Link href="/shop/toner" className="text-sm text-[#2A2424]/70 hover:text-[#2A2424] hover:underline">Toner & Essence</Link>
                      <Link href="/shop/serum" className="text-sm text-[#2A2424]/70 hover:text-[#2A2424] hover:underline">Serum & Ampoule</Link>
                      <Link href="/shop/moisturizer-cream" className="text-sm text-[#2A2424]/70 hover:text-[#2A2424] hover:underline">Moisturizer / Cream</Link>
                      <Link href="/shop/sunscreen" className="text-sm text-[#2A2424]/70 hover:text-[#2A2424] hover:underline">Sunscreen</Link>
                      <Link href="/shop/exfoliant" className="text-sm text-[#2A2424]/70 hover:text-[#2A2424] hover:underline">Exfoliant</Link>
                      <Link href="/shop/sheet-mask" className="text-sm text-[#2A2424]/70 hover:text-[#2A2424] hover:underline">Masks</Link>
                    </div>
                  </div>

                  {/* Body Care */}
                  <div className="flex-1">
                    <Link href="/shop/body-care" className="font-bold text-[#2A2424] border-b border-[#F4EAEB] pb-2 mb-4 block hover:text-[#E5B6B9] transition-colors">Body Care</Link>
                    <div className="flex flex-col gap-2.5">
                      <Link href="/shop/body-wash" className="text-sm text-[#2A2424]/70 hover:text-[#2A2424] hover:underline">Body Wash</Link>
                      <Link href="/shop/body-lotion" className="text-sm text-[#2A2424]/70 hover:text-[#2A2424] hover:underline">Body Lotion / Cream</Link>
                      <Link href="/shop/body-oil" className="text-sm text-[#2A2424]/70 hover:text-[#2A2424] hover:underline">Body Oil</Link>
                      <Link href="/shop/body-scrub" className="text-sm text-[#2A2424]/70 hover:text-[#2A2424] hover:underline">Body Scrub</Link>
                      <Link href="/shop/hand-cream" className="text-sm text-[#2A2424]/70 hover:text-[#2A2424] hover:underline">Hand & Foot Care</Link>
                    </div>
                  </div>

                  {/* Hair Care */}
                  <div className="flex-1">
                    <Link href="/shop/hair-care" className="font-bold text-[#2A2424] border-b border-[#F4EAEB] pb-2 mb-4 block hover:text-[#E5B6B9] transition-colors">Hair Care</Link>
                    <div className="flex flex-col gap-2.5">
                      <Link href="/shop/shampoo" className="text-sm text-[#2A2424]/70 hover:text-[#2A2424] hover:underline">Shampoo</Link>
                      <Link href="/shop/hair-mask-treatment" className="text-sm text-[#2A2424]/70 hover:text-[#2A2424] hover:underline">Treatment / Mask</Link>
                      <Link href="/shop/hair-serum" className="text-sm text-[#2A2424]/70 hover:text-[#2A2424] hover:underline">Hair Serum & Oil</Link>
                      <Link href="/shop/scalp-treatment" className="text-sm text-[#2A2424]/70 hover:text-[#2A2424] hover:underline">Scalp Care</Link>
                    </div>
                  </div>

                  {/* Supplements */}
                  <div className="flex-1">
                    <Link href="/shop/supplements" className="font-bold text-[#2A2424] border-b border-[#F4EAEB] pb-2 mb-4 block hover:text-[#E5B6B9] transition-colors">Supplements</Link>
                    <div className="flex flex-col gap-2.5">
                      <Link href="/shop/collagen-supplement" className="text-sm text-[#2A2424]/70 hover:text-[#2A2424] hover:underline">Collagen</Link>
                      <Link href="/shop/vitamin" className="text-sm text-[#2A2424]/70 hover:text-[#2A2424] hover:underline">Vitamins</Link>
                      <Link href="/shop/skin-health" className="text-sm text-[#2A2424]/70 hover:text-[#2A2424] hover:underline">Skin Health</Link>
                      <Link href="/shop/weight-management" className="text-sm text-[#2A2424]/70 hover:text-[#2A2424] hover:underline">Weight Management</Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link href="/skin-coach" className="flex items-center gap-2 hover:bg-[#F8F5F2] px-4 py-2 rounded-full transition-colors text-sm font-medium whitespace-nowrap group">
            <IconIA className="w-6 h-6 text-[#C97C85]" /> {t("Skin Coach")}
          </Link>
          <Link href="/marques" className="text-[#2A2424] hover:opacity-70 transition-opacity">{t("Marques")}</Link>
          <Link href="/ambassadrices" className="text-[#2A2424] hover:opacity-70 transition-opacity">{t("Ambassadrices")}</Link>
          
          <div className="w-px h-5 bg-[#2A2424]/10 mx-1" />

          <LanguageSwitcher />

          <button onClick={handleAccountClick} className="p-2 text-[#2A2424] hover:bg-[#F1EFEA] rounded-full transition-colors">
            <User className="w-5 h-5" />
          </button>
          <button onClick={openCart} className="relative p-2 text-[#2A2424] hover:bg-[#F1EFEA] rounded-full transition-colors">
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#E5B6B9] text-[9px] font-bold text-white shadow-sm">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </button>
        </div>
      </motion.nav>

      {/* ──────────────────────────────────────────────
          MOBILE NAVBAR
      ────────────────────────────────────────────── */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex xl:hidden items-center justify-between px-5 py-2 w-full bg-[#FDFDFC] relative z-50 border-b border-[#F4EAEB]"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-[#2A2424] font-bold text-lg tracking-wide hover:opacity-80 transition-opacity">
          <img src="/logo.webp" alt="The Welfare Shop" className="h-11 w-auto object-contain scale-[1.5] origin-left" />
        </Link>

        {/* Right Actions */}
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <button onClick={() => setIsSearchOpen(true)} className="p-2 text-[#2A2424] hover:bg-[#F1EFEA] rounded-full transition-colors">
            <MagnifyingGlass className="w-5 h-5" />
          </button>
          
          <button onClick={openCart} className="relative p-2 text-[#2A2424] hover:bg-[#F1EFEA] rounded-full transition-colors">
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#E5B6B9] text-[9px] font-bold text-white">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </button>
          
          <button 
            className="p-2 text-[#2A2424] hover:bg-[#F1EFEA] rounded-full transition-colors ml-1"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <List className="w-6 h-6" />
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
              className="fixed inset-0 bg-black/40 z-[60] xl:hidden backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-[360px] bg-[#FDFDFC] shadow-2xl z-[70] xl:hidden flex flex-col overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-[#F4EAEB]">
                <img src="/logo.webp" alt="The Welfare Shop" className="h-14 w-auto object-contain scale-125 origin-left" />
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 bg-[#F1EFEA] rounded-full text-[#2A2424]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col p-6 gap-6">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-medium text-[#2A2424]">
                  {t("Accueil")}
                </Link>
                
                <Link href="/skin-coach" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-lg font-medium p-4 bg-[#F8F5F2] rounded-2xl">
                  <IconIA className="w-7 h-7 text-[#C97C85]" /> {t("Skin Coach")}
                </Link>

                <div className="flex flex-col">
                  <div className="flex items-center justify-between w-full">
                    <Link 
                      href="/shop" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-xl font-medium text-[#2A2424] flex-1 text-left"
                    >
                      {t("Boutique")}
                    </Link>
                    <button 
                      onClick={() => setIsMobileShopOpen(!isMobileShopOpen)}
                      className="p-2"
                    >
                      <CaretDown className={`w-6 h-6 transition-transform ${isMobileShopOpen ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {isMobileShopOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="flex flex-col gap-6 overflow-hidden pt-4 pl-4 border-l-2 border-[#F4EAEB] ml-2"
                      >
                        {/* Face Care Mobile */}
                        <div className="flex flex-col gap-2">
                          <Link href="/shop/face-care" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold text-[#2A2424]">Face Care</Link>
                          <div className="flex flex-col gap-2 pl-3 border-l border-[#F4EAEB]">
                            <Link href="/shop/cleanser" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-[#2A2424]/70">Cleanser</Link>
                            <Link href="/shop/toner" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-[#2A2424]/70">Toner & Essence</Link>
                            <Link href="/shop/serum" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-[#2A2424]/70">Serum & Ampoule</Link>
                            <Link href="/shop/moisturizer-cream" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-[#2A2424]/70">Moisturizer / Cream</Link>
                            <Link href="/shop/sunscreen" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-[#2A2424]/70">Sunscreen</Link>
                          </div>
                        </div>
                        
                        {/* Body Care Mobile */}
                        <div className="flex flex-col gap-2">
                          <Link href="/shop/body-care" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold text-[#2A2424]">Body Care</Link>
                          <div className="flex flex-col gap-2 pl-3 border-l border-[#F4EAEB]">
                            <Link href="/shop/body-wash" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-[#2A2424]/70">Body Wash</Link>
                            <Link href="/shop/body-lotion" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-[#2A2424]/70">Body Lotion / Cream</Link>
                            <Link href="/shop/body-scrub" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-[#2A2424]/70">Body Scrub</Link>
                          </div>
                        </div>

                        {/* Hair Care Mobile */}
                        <div className="flex flex-col gap-2">
                          <Link href="/shop/hair-care" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold text-[#2A2424]">Hair Care</Link>
                          <div className="flex flex-col gap-2 pl-3 border-l border-[#F4EAEB]">
                            <Link href="/shop/shampoo" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-[#2A2424]/70">Shampoo</Link>
                            <Link href="/shop/hair-mask-treatment" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-[#2A2424]/70">Treatment / Mask</Link>
                            <Link href="/shop/hair-serum" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-[#2A2424]/70">Hair Serum & Oil</Link>
                          </div>
                        </div>

                        {/* Supplements Mobile */}
                        <div className="flex flex-col gap-2">
                          <Link href="/shop/supplements" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold text-[#2A2424]">Supplements</Link>
                          <div className="flex flex-col gap-2 pl-3 border-l border-[#F4EAEB]">
                            <Link href="/shop/collagen-supplement" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-[#2A2424]/70">Collagen</Link>
                            <Link href="/shop/vitamin" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-[#2A2424]/70">Vitamins</Link>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link href="/marques" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-medium text-[#2A2424]">
                  {t("Marques")}
                </Link>

                <Link href="/learning-center" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-medium text-[#2A2424]">
                  {t("Skin Learning Center")}
                </Link>

                <Link href="/ambassadrices" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-medium text-[#2A2424]">
                  {t("Devenir Ambassadrice")}
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
                  <User className="w-6 h-6" /> {t("Mon Compte / Connexion")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
