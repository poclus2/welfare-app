"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Search,
  ShoppingBag,
  Menu,
  Star,
  Heart,
  Zap,
  Tag,
  Sparkles,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/home/footer";

/* ═══════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════ */

const CATEGORIES = [
  { slug: "toners",              label: "Toners",               sub: "100+ produits",  image: "/im_cat_toner.png",      bg: "#F2EDE8" },
  { slug: "serums",              label: "Sérums",               sub: "Anti-âge & Éclat",image: "/im_cat_serum.png",     bg: "#EAD4D5" },
  { slug: "hydratants",          label: "Crèmes",               sub: "Viser l'éclat",  image: "/im_cat_hydratant.png",  bg: "#E5E9E1" },
  { slug: "masques",             label: "Masques",              sub: "Soins hebdo",    image: "/im_cat_mask.png",       bg: "#DCE4E5" },
  { slug: "protections-solaires",label: "Solaires",             sub: "SPF & protection",image: "/im_cat_sunscreen.png", bg: "#F5EFE0" },
  { slug: "nettoyants",          label: "Nettoyants",           sub: "Double nettoyage",image: "/im_cat_nettoyant.png", bg: "#E5E9E1" },
  { slug: "essences",            label: "Essences",             sub: "Hydratation pro",image: "/im_cat_toner.png",      bg: "#F2EDE8" },
  { slug: "exfoliants",          label: "Exfoliants",           sub: "Peau neuve",     image: "/im_cat_mask.png",       bg: "#DCE4E5" },
  { slug: "coffrets",            label: "Coffrets",             sub: "Idées cadeaux",  image: "/im_cat_serum.png",      bg: "#EAD4D5" },
];

const LAYERING_STEPS = [
  { step: 1, label: "Démaquillant",  slug: "demaquillants" },
  { step: 2, label: "Nettoyant",     slug: "nettoyants" },
  { step: 3, label: "Exfoliant",     slug: "exfoliants" },
  { step: 4, label: "Toner",         slug: "toners" },
  { step: 5, label: "Essence",       slug: "essences" },
  { step: 6, label: "Sérum",         slug: "serums" },
  { step: 7, label: "Crème / Solaire", slug: "hydratants" },
];

const FLASH_TABS = ["Top Rated", "Tendances", "Nouveautés", "Sélection"];
const BEST_TABS  = ["Top Rated", "Tendances", "Nouveautés", "Sélection"];

const BRANDS = ["COSRX", "LANIEGE", "INNISFREE", "ANUA", "TIRTIR", "MIXSOON"];

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════ */

function TabBar({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar w-full sm:w-auto pb-1 sm:pb-0 -mx-6 px-6 sm:mx-0 sm:px-0">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border ${
            active === tab
              ? "bg-[#2A2424] text-white border-[#2A2424]"
              : "text-[#2A2424]/60 border-[#2A2424]/15 hover:border-[#2A2424]/40"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: any }) {
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : null;
  
  return (
    <Link
      href={`/shop/product/${product.id}`}
      className="group flex flex-col bg-white rounded-[20px] md:rounded-[32px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#F4EAEB] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300 h-full"
    >
      {/* TOP HEADER */}
      <div className="bg-[#F4EAEB] px-3 md:px-5 py-2.5 md:py-3.5 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-1 md:gap-1.5 text-[9px] md:text-[11px] font-bold text-[#2A2424] uppercase tracking-wider">
          <Star className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 fill-[#2A2424]" />
          <span className="truncate">{discount ? `-${discount}% SALE` : "BEST"}</span>
          <span className="hidden md:inline">{discount ? ` OFF` : ` SELLER`}</span>
        </div>
        <div className="hidden md:flex items-center gap-1 text-[10px] font-bold">
          <span className="bg-[#2A2424] text-white px-1.5 py-0.5 rounded min-w-[20px] text-center">00</span>
          <span className="text-[#2A2424]">:</span>
          <span className="bg-[#2A2424] text-white px-1.5 py-0.5 rounded min-w-[20px] text-center">24</span>
          <span className="text-[#2A2424]">:</span>
          <span className="bg-[#2A2424] text-white px-1.5 py-0.5 rounded min-w-[20px] text-center">02</span>
        </div>
      </div>

      {/* IMAGE SECTION */}
      <div className="relative bg-[#F8F5F2] rounded-b-[20px] md:rounded-b-[32px] overflow-hidden aspect-[4/5] shrink-0">
        <button 
          onClick={(e) => e.preventDefault()}
          className="absolute top-2 left-2 md:top-4 md:left-4 z-10 text-[#2A2424] hover:text-[#E5B6B9] transition-colors bg-white/50 md:bg-transparent rounded-full p-1.5 md:p-0 backdrop-blur-md md:backdrop-blur-none"
        >
          <Heart className="w-[14px] h-[14px] md:w-[22px] md:h-[22px]" />
        </button>
        <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10 text-[9px] md:text-[11px] font-bold text-[#2A2424] bg-white/50 backdrop-blur-md px-2 py-0.5 md:px-2.5 md:py-1 rounded-full">
          1 / 3
        </div>
        <img 
          src={product.image} 
          className="w-full h-full object-contain p-4 md:p-8 mix-blend-multiply transition-transform duration-700 group-hover:scale-105" 
          alt={product.name} 
        />
      </div>

      {/* TEXT SECTION */}
      <div className="px-3 pt-3 pb-3 md:px-5 md:pt-5 md:pb-5 flex flex-col flex-1 bg-white">
        {/* Tag */}
        <div className="flex items-center gap-1 md:gap-1.5 bg-[#F8F5F2] text-[#2A2424] w-fit px-2 py-1 md:px-3 md:py-1.5 rounded-full mb-2 md:mb-3">
          <span className="text-[#E5B6B9] text-[8px] md:text-[10px]">✦</span>
          <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider line-clamp-1">{product.category || product.brand || "Soin Visage"}</span>
        </div>
        
        {/* Title */}
        <h3 className="text-[13px] md:text-[19px] font-bold text-[#2A2424] leading-tight md:leading-snug line-clamp-2 mb-2 md:mb-4">
          {product.name}
        </h3>

        <div className="w-full border-t border-dashed border-[#EDE0E0] mb-2 md:mb-4 mt-auto" />

        {/* Price & Cart */}
        <div className="flex items-end justify-between gap-1">
          <div className="flex flex-col min-w-0">
            {product.oldPrice ? (
              <span className="text-[#2A2424]/40 text-[9px] md:text-[11px] font-bold line-through mb-0 md:mb-0.5 truncate">
                {product.oldPrice.toLocaleString("fr-FR")}
              </span>
            ) : (
               <span className="text-transparent text-[9px] md:text-[11px] font-bold mb-0 md:mb-0.5 hidden md:block">-</span>
            )}
            <span className="text-[14px] md:text-[22px] font-bold text-[#2A2424] leading-none truncate">
              {product.price.toLocaleString("fr-FR")} <span className="text-[9px] md:text-[13px]">FCFA</span>
            </span>
          </div>
          <button 
            onClick={(e) => e.preventDefault()}
            className="bg-[#2A2424] text-white w-8 h-8 md:w-auto md:h-auto md:px-5 md:py-3 rounded-full flex items-center justify-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-bold hover:bg-black transition-colors shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden md:inline">Ajouter</span>
          </button>
        </div>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════ */
export default function ShopClient({ flashProducts, bestProducts }: { flashProducts: any[], bestProducts: any[] }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [flashTab, setFlashTab] = useState("Top Rated");
  const [bestTab, setBestTab] = useState("Top Rated");

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
    <main className="flex flex-col w-full bg-[#F8F5F2]">

      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-10 py-6 flex flex-col gap-5">

        {/* ════════════════════════════════════
            [1] HERO BENTO GRID (Stacked Layout)
        ════════════════════════════════════ */}
        <div className="flex flex-col md:grid md:grid-cols-12 gap-5 md:gap-6">
            
            {/* ─── LEFT COLUMN (ANUA) ─── */}
            <div className="md:col-span-4 flex flex-col h-full">
              {/* ─── ANUA CARD (Row 1) ─── */}
              <div className="w-full h-full bg-[#8E354A] rounded-[32px] flex flex-col overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                {/* Image Container */}
                <div className="w-full relative flex items-start justify-center order-1 md:order-2 p-5 pt-8 pb-0 md:p-8 md:pb-0 flex-1 overflow-hidden">
                  <img 
                    src="/anua_products.png" 
                    alt="Produits Anua Heartleaf" 
                    className="w-[90%] sm:w-[75%] md:w-[90%] h-auto max-h-[300px] md:max-h-[500px] object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-700 ease-out mb-0" 
                  />
                </div>
                {/* Text Container */}
                <div className="w-full p-6 pt-0 md:p-10 md:pt-10 flex flex-col justify-end md:justify-start order-2 md:order-1 z-10 shrink-0">
                  <h2 className="text-[28px] md:text-[36px] font-bold mb-3 md:mb-5 leading-tight tracking-tight text-white mt-2 md:mt-0">
                    La gamme culte<br/>Anua Heartleaf.
                  </h2>
                  <p className="text-white/80 text-[14px] md:text-[16px] mb-6 md:mb-8 leading-relaxed font-medium">
                    Apaisez instantanément les peaux sensibles et acnéiques avec l'extrait pur d'Heartleaf (77%).
                  </p>
                  <div className="flex flex-row items-center justify-between mt-auto pt-2 md:pt-4 gap-4 mb-1 md:mb-0">
                    <button className="bg-white text-[#1C1C1C] text-[14px] md:text-[15px] font-bold py-3 px-6 md:py-3.5 md:px-7 rounded-full flex items-center justify-center gap-2 w-fit hover:bg-[#F4EAEB] transition-all shadow-sm group-hover:pl-7">
                      Découvrir la gamme <ArrowRight className="w-4 h-4 md:w-4 md:h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── RIGHT COLUMN (SMALL CARDS + MEDICUBE) ─── */}
            <div className="md:col-span-8 flex flex-col gap-5 md:gap-6 h-full">

              {/* ─── SMALL CARDS ROW ─── */}
              <div className="order-1 md:order-2 flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                
                {/* SMALL CARD 1 */}
                <div className="w-[230px] md:w-auto snap-center shrink-0 bg-white rounded-[24px] p-4 flex flex-col md:flex-row md:items-center gap-4 group shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#2A2424]/5 hover:shadow-md transition-shadow">
                  <div className="w-full h-[150px] md:w-[90px] md:h-[90px] shrink-0 bg-[#F3EFEA] rounded-[18px] md:rounded-[16px] flex items-center justify-center p-2 overflow-hidden">
                    <img src="/im_cat_nettoyant.png" alt="Nettoyant" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 ease-out" />
                  </div>
                  <div className="flex flex-col flex-1 text-left justify-center">
                    <h3 className="text-[17px] md:text-[15px] font-bold text-[#111111] mb-1 tracking-tight">Nettoyant</h3>
                    <p className="text-[10px] md:text-[9px] font-bold text-[#111111]/50 mb-3 md:mb-2 uppercase tracking-widest">COSRX</p>
                    <div className="flex flex-col gap-2 md:gap-1 mb-6 md:mb-0 items-start w-full">
                      <span className="text-[11px] md:text-[10px] font-medium text-[#111111]/70 flex items-center gap-2 md:gap-1.5"><span className="w-1.5 h-1.5 bg-[#D4C4B7] rounded-full shrink-0" /> Nettoyage profond</span>
                      <span className="text-[11px] md:text-[10px] font-medium text-[#111111]/70 flex items-center gap-2 md:gap-1.5"><span className="w-1.5 h-1.5 bg-[#D4C4B7] rounded-full shrink-0" /> Sans sulfate</span>
                    </div>
                    <button className="bg-[#211F1F] text-white text-[13px] md:text-[11px] font-bold py-3 md:py-2.5 px-4 md:px-4 rounded-full flex items-center justify-center gap-3 md:gap-2 w-full md:w-fit mt-auto md:mt-4 hover:bg-black transition-colors">
                      Acheter <ArrowRight className="w-4 h-4 md:w-3.5 md:h-3.5 text-white" />
                    </button>
                  </div>
                </div>

                {/* SMALL CARD 2 */}
                <div className="w-[230px] md:w-auto snap-center shrink-0 bg-white rounded-[24px] p-4 flex flex-col md:flex-row md:items-center gap-4 group shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#2A2424]/5 hover:shadow-md transition-shadow">
                  <div className="w-full h-[150px] md:w-[90px] md:h-[90px] shrink-0 bg-[#F3EFEA] rounded-[18px] md:rounded-[16px] flex items-center justify-center p-2 overflow-hidden">
                    <img src="/im_cat_creme.png" alt="Crème" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 ease-out" />
                  </div>
                  <div className="flex flex-col flex-1 text-left justify-center">
                    <h3 className="text-[17px] md:text-[15px] font-bold text-[#111111] mb-1 tracking-tight">Crème</h3>
                    <p className="text-[10px] md:text-[9px] font-bold text-[#111111]/50 mb-3 md:mb-2 uppercase tracking-widest">LANEIGE</p>
                    <div className="flex flex-col gap-2 md:gap-1 mb-6 md:mb-0 items-start w-full">
                      <span className="text-[11px] md:text-[10px] font-medium text-[#111111]/70 flex items-center gap-2 md:gap-1.5"><span className="w-1.5 h-1.5 bg-[#D4C4B7] rounded-full shrink-0" /> Hydratation 24h</span>
                      <span className="text-[11px] md:text-[10px] font-medium text-[#111111]/70 flex items-center gap-2 md:gap-1.5"><span className="w-1.5 h-1.5 bg-[#D4C4B7] rounded-full shrink-0" /> Texture légère</span>
                    </div>
                    <button className="bg-[#211F1F] text-white text-[13px] md:text-[11px] font-bold py-3 md:py-2.5 px-4 md:px-4 rounded-full flex items-center justify-center gap-3 md:gap-2 w-full md:w-fit mt-auto md:mt-4 hover:bg-black transition-colors">
                      Acheter <ArrowRight className="w-4 h-4 md:w-3.5 md:h-3.5 text-white" />
                    </button>
                  </div>
                </div>

                {/* SMALL CARD 3 */}
                <div className="w-[230px] md:w-auto snap-center shrink-0 bg-white rounded-[24px] p-4 flex flex-col md:flex-row md:items-center gap-4 group shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#2A2424]/5 hover:shadow-md transition-shadow">
                  <div className="w-full h-[150px] md:w-[90px] md:h-[90px] shrink-0 bg-[#F3EFEA] rounded-[18px] md:rounded-[16px] flex items-center justify-center p-2 overflow-hidden">
                    <img src="/im_cat_sunscreen.png" alt="Solaire" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 ease-out" />
                  </div>
                  <div className="flex flex-col flex-1 text-left justify-center">
                    <h3 className="text-[17px] md:text-[15px] font-bold text-[#111111] mb-1 tracking-tight">Solaire</h3>
                    <p className="text-[10px] md:text-[9px] font-bold text-[#111111]/50 mb-3 md:mb-2 uppercase tracking-widest">B. OF JOSEON</p>
                    <div className="flex flex-col gap-2 md:gap-1 mb-6 md:mb-0 items-start w-full">
                      <span className="text-[11px] md:text-[10px] font-medium text-[#111111]/70 flex items-center gap-2 md:gap-1.5"><span className="w-1.5 h-1.5 bg-[#D4C4B7] rounded-full shrink-0" /> Protection SPF50</span>
                      <span className="text-[11px] md:text-[10px] font-medium text-[#111111]/70 flex items-center gap-2 md:gap-1.5"><span className="w-1.5 h-1.5 bg-[#D4C4B7] rounded-full shrink-0" /> Fini invisible</span>
                    </div>
                    <button className="bg-[#211F1F] text-white text-[13px] md:text-[11px] font-bold py-3 md:py-2.5 px-4 md:px-4 rounded-full flex items-center justify-center gap-3 md:gap-2 w-full md:w-fit mt-auto md:mt-4 hover:bg-black transition-colors">
                      Acheter <ArrowRight className="w-4 h-4 md:w-3.5 md:h-3.5 text-white" />
                    </button>
                  </div>
                </div>

              </div>

              {/* ─── MEDICUBE CARD ─── */}
              <div className="order-2 md:order-1 w-full bg-[#F6EBEA] md:bg-white rounded-[32px] flex flex-col md:flex-row overflow-hidden group shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#2A2424]/5 flex-1">
                {/* Image Container */}
                <div className="w-full md:w-[50%] relative overflow-hidden flex items-center justify-center p-5 pt-8 pb-0 md:p-12 order-1 bg-[#F6EBEA] flex-1">
                   <img 
                     src="/medicube_products.png" 
                     alt="Gamme Medicube" 
                     className="w-[90%] sm:w-[75%] md:w-[95%] h-auto max-h-[300px] md:max-h-none object-contain group-hover:scale-105 transition-transform duration-700 ease-out mb-0" 
                   />
                </div>
                {/* Text Container */}
                <div className="w-full md:w-[50%] p-6 pt-0 md:p-12 md:py-16 flex flex-col justify-end md:justify-center order-2 shrink-0 md:bg-white">
                  <h2 className="text-[24px] md:text-[32px] font-bold text-[#111111] mb-3 md:mb-5 leading-tight tracking-tight">
                    L'innovation clinique Medicube pour une peau sans défaut
                  </h2>
                  <p className="text-[#111111]/80 text-[14px] md:text-[15px] mb-6 md:mb-10 leading-relaxed font-medium">
                    Découvrez des soins dermo-cosmétiques de pointe, spécialement formulés pour traiter les imperfections, apaiser les rougeurs et resserrer les pores.
                  </p>
                  <div className="flex flex-row items-center justify-between mt-auto pt-2 gap-4 mb-1 md:mb-0">
                    <span className="text-[11px] md:text-[13px] font-medium text-[#111111]/70">Prix de départ à partir de :</span>
                    <button className="bg-[#211F1F] text-white text-[12px] md:text-[14px] font-bold py-2.5 px-5 md:py-3.5 md:px-7 rounded-full hover:bg-black transition-transform shadow-sm">
                      15 000 FCFA
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

        {/* ════════════════════════════════════
            [2] CATEGORY BAR — Pill Cards
        ════════════════════════════════════ */}
        <div className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0 pb-2 md:pb-0">
          {CATEGORIES.map((cat, i) => (
            <motion.a
              key={cat.slug}
              href={`/shop/${cat.slug}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
              className="min-w-[115px] md:min-w-[140px] shrink-0 snap-start flex flex-col items-center justify-center bg-white rounded-[24px] p-4 border border-[#F4EAEB] hover:border-[#2A2424]/20 hover:shadow-sm transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-full overflow-hidden mb-3 bg-[#F8F5F2] flex items-center justify-center p-2 group-hover:scale-110 transition-transform duration-500">
                <img src={cat.image} alt={cat.label} className="w-full h-full object-contain mix-blend-multiply" />
              </div>
              <p className="text-xs font-bold text-[#2A2424] text-center mb-0.5">{cat.label}</p>
              <p className="text-[9px] font-medium text-[#2A2424]/40 text-center">{cat.sub}</p>
            </motion.a>
          ))}
        </div>

        {/* ════════════════════════════════════
            [3] VENTE FLASH
        ════════════════════════════════════ */}
        <div className="bg-white rounded-3xl border border-[#F4EAEB] overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 pt-6 pb-5 border-b border-[#F4EAEB]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#E5B6B9]/20 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-[#E5B6B9]" />
              </div>
              <h2 className="text-base font-bold text-[#2A2424]">Vente Flash</h2>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <TabBar tabs={FLASH_TABS} active={flashTab} onChange={setFlashTab} />
              <Link href="/shop/all" className="hidden md:flex items-center gap-1 text-[11px] font-bold text-[#2A2424]/50 hover:text-[#2A2424] transition-colors whitespace-nowrap ml-2">
                Voir tous les produits <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-0 pt-4 pb-6 px-4 md:p-0 md:divide-x md:divide-y md:divide-[#F4EAEB]">
            {flashProducts.map((product) => (
              <div key={product.id} className="h-full md:p-5">
                <ProductCard product={product as any} />
              </div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════
            [4] TWO PROMO BLOCKS
        ════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left — Routines */}
          <div className="relative bg-[#2A2424] rounded-2xl p-7 flex flex-col justify-between overflow-hidden min-h-[160px]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#E5B6B9]/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#E5B6B9] mb-2">Offre Exclusive</p>
              <h3 className="text-xl md:text-2xl font-medium text-white mb-1">
                Économisez jusqu'à<br /><span className="font-bold">35% sur les routines</span>
              </h3>
              <p className="text-white/50 text-xs mb-5">Skincare et bundle</p>
            </div>
            <Link
              href="/routines"
              className="relative z-10 inline-flex items-center gap-2 bg-white text-[#2A2424] px-5 py-2.5 rounded-full text-xs font-bold hover:bg-[#F4EAEB] transition-all w-fit"
            >
              Voir les routines <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Right — Coupon */}
          <div className="relative bg-[#2A2424] rounded-2xl p-7 flex flex-col justify-between overflow-hidden min-h-[160px]">
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#E5B6B9]/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#E5B6B9] mb-2">Bienvenue</p>
              <h3 className="text-xl md:text-2xl font-medium text-white mb-1">
                Obtenez <span className="font-bold">-25%</span><br />sur votre 1ère commande
              </h3>
              <p className="text-white/50 text-xs mb-5">Code promo exclusif</p>
            </div>
            <button className="relative z-10 inline-flex items-center gap-2 bg-[#E5B6B9] text-[#2A2424] px-5 py-2.5 rounded-full text-xs font-bold hover:bg-white transition-all w-fit">
              <Tag className="w-3.5 h-3.5" /> Réclamer le coupon
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════
            [5] BRANDS BAR
        ════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-[#F4EAEB] px-6 py-4 flex items-center gap-4 overflow-x-auto hide-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#2A2424]/40 shrink-0 mr-2">Marques de confiance</span>
          <div className="w-px h-5 bg-[#F4EAEB] shrink-0" />
          {BRANDS.map((brand) => (
            <Link
              key={brand}
              href="/shop/all"
              className="shrink-0 px-4 py-1.5 rounded-full border border-[#F4EAEB] text-[11px] font-bold text-[#2A2424]/60 hover:border-[#2A2424]/30 hover:text-[#2A2424] transition-all whitespace-nowrap"
            >
              {brand}
            </Link>
          ))}
        </div>

        {/* ════════════════════════════════════
            [6] MEILLEURES VENTES
        ════════════════════════════════════ */}
        <div className="bg-white rounded-3xl border border-[#F4EAEB] overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 pt-6 pb-5 border-b border-[#F4EAEB]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#E5B6B9]/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-[#E5B6B9]" />
              </div>
              <h2 className="text-base font-bold text-[#2A2424]">Meilleures ventes</h2>
            </div>
            <TabBar tabs={BEST_TABS} active={bestTab} onChange={setBestTab} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-0 pt-4 pb-6 px-4 md:p-0 md:divide-x md:divide-y md:divide-[#F4EAEB]">
            {bestProducts.map((product) => (
              <div key={product.id} className="h-full md:p-5">
                <ProductCard product={product as any} />
              </div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════
            [7] TRUST BANNER
        ════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="w-full bg-[#2A2424] rounded-3xl px-6 md:px-14 py-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left"
        >
          <div className="flex flex-col items-center md:items-start">
            <p className="text-white/50 text-sm mb-2">Approuvé par plus de 50 000 clientes</p>
            <p className="text-white text-xl md:text-2xl font-medium max-w-xs leading-snug">
              Des milliers d'avis authentiques sur nos produits, livraison et service client.
            </p>
          </div>

          <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-14 shrink-0">
            {[
              { val: "40K+", label: "Clientes fidèles" },
              { val: "98%",  label: "Satisfaction"    },
              { val: "200+", label: "Produits K-Beauty"},
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{s.val}</p>
                <p className="text-[#E5B6B9] text-xs mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          <Link
            href="/avis"
            className="shrink-0 bg-[#E5B6B9] text-[#2A2424] px-6 py-3.5 rounded-full text-sm font-semibold hover:bg-white transition-all"
          >
            Voir nos avis
          </Link>
        </motion.div>

      </div>{/* end max-w wrapper */}

      <Footer />
    </main>
  );
}
