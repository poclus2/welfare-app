"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  MagnifyingGlass,
  ShoppingBag,
  List,
  Star,
  Heart,
  Lightning,
  Tag,
  Sparkle,
  Plus,
} from "@phosphor-icons/react";
import Link from "next/link";
import { Footer } from "@/components/home/footer";
import { ShowcaseCarousel } from "@/components/ui/showcase-carousel";
import { AccordionHero } from "@/components/ui/accordion-hero";

/* ═══════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════ */

const CATEGORIES = [
  { slug: "toners",              label: "Toners",               sub: "100+ produits",  image: "/im_cat_toner.webp",      bg: "#F2EDE8" },
  { slug: "serums",              label: "Sérums",               sub: "Anti-âge & Éclat",image: "/im_cat_serum.webp",     bg: "#EAD4D5" },
  { slug: "cremes",              label: "Crèmes",               sub: "Viser l'éclat",  image: "/im_cat_hydratant.webp",  bg: "#E5E9E1" },
  { slug: "masques",             label: "Masques",              sub: "Soins hebdo",    image: "/im_cat_mask.webp",       bg: "#DCE4E5" },
  { slug: "solaires",            label: "Solaires",             sub: "SPF & protection",image: "/im_cat_sunscreen.webp", bg: "#F5EFE0" },
  { slug: "nettoyants",          label: "Nettoyants",           sub: "Double nettoyage",image: "/im_cat_nettoyant.webp", bg: "#E5E9E1" },
  { slug: "cheveux",             label: "Cheveux",              sub: "Head Spa coréen",image: "/im_cat_mask.webp",       bg: "#D0ECEA" },
  { slug: "essences",            label: "Essences",             sub: "Hydratation pro",image: "/im_cat_toner.webp",      bg: "#F2EDE8" },
  { slug: "exfoliants",          label: "Exfoliants",           sub: "Peau neuve",     image: "/im_cat_mask.webp",       bg: "#DCE4E5" },
  { slug: "coffrets",            label: "Coffrets",             sub: "Idées cadeaux",  image: "/im_cat_serum.webp",      bg: "#EAD4D5" },
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
  // We won't use useCart here directly if it's too complex to add, wait, ShopClient already has handleAddToCart?
  // Let's check if ShopClient has an addingId state. It doesn't right now, but I can add it, or just use a simple form.
  // Wait, I'll just keep the existing button but style it identically.
  return (
    <Link
      href={`/shop/product/${product.id}`}
      className="group relative flex flex-col h-full bg-[#FAFAFA] rounded-[1rem] md:rounded-[1.5rem] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[4/5] bg-[#F4EAEB] overflow-hidden flex items-center justify-center p-4 md:p-8">
        <button 
          onClick={(e) => e.preventDefault()}
          className="absolute top-2 right-2 md:top-4 md:right-4 z-10 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center text-[#2A2424] hover:bg-[#2A2424] hover:text-white transition-colors"
        >
          <Heart className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </button>
        <div className="w-full h-full flex items-center justify-center">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        </div>
        <div className="absolute inset-x-2 md:inset-x-4 bottom-2 md:bottom-4 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={(e) => e.preventDefault()}
            className="w-full py-2 md:py-3.5 bg-[#2A2424] text-white rounded-full text-[10px] md:text-sm font-semibold tracking-wide hover:bg-black transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <span>Ajouter au panier</span>
          </button>
        </div>
      </div>
      <div className="p-3 md:p-6 flex-1 flex flex-col">
        <div className="flex flex-col items-start gap-1 md:gap-1.5 mb-1.5 md:mb-2 overflow-hidden">
          {product.brand && (
            <span className="text-[9px] md:text-[10px] font-bold text-[#2A2424] bg-[#f4eaeb] px-2 py-0.5 rounded-full uppercase tracking-wider truncate">
              {product.brand}
            </span>
          )}
          <p className="text-[10px] md:text-xs font-bold text-[#2A2424]/50 tracking-wider uppercase shrink-0">
            {product.label || "SOIN"}
          </p>
        </div>
        <h3 className="text-xs md:text-lg font-medium text-[#2A2424] leading-snug mb-2 md:mb-3 flex-1 line-clamp-2 md:line-clamp-none">
          <span className="hover:underline decoration-[#E5B6B9] underline-offset-4">
            {product.name}
          </span>
        </h3>
        
        {/* We skip the skin concerns mapping because ShopClient's product doesn't have skin_profile, but we can add an empty div to maintain spacing or just skip */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#F4EAEB]">
          <p className="text-sm md:text-lg font-semibold text-[#2A2424]">
            {Number(product.price).toLocaleString("fr-FR")} <span className="text-[10px] md:text-sm">FCFA</span>
          </p>
          <button 
            onClick={(e) => e.preventDefault()}
            className="bg-[#E51D5A] text-white w-8 h-8 md:w-auto md:h-auto md:px-4 md:py-2 rounded-full flex items-center justify-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-bold hover:bg-[#C2164A] transition-colors shrink-0 shadow-md shadow-[#E51D5A]/20"
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
   COLLECTION SPOTLIGHT — Style ANUA (split hero + produits)
═══════════════════════════════════════════════════════ */
function CollectionSpotlight({ products }: { products: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "right" ? 280 : -280, behavior: "smooth" });
  };

  return (
    <div className="bg-white rounded-3xl border border-[#F4EAEB] overflow-hidden">
      {/* Desktop: split layout | Mobile: stacked */}
      <div className="flex flex-col md:flex-row md:min-h-[380px]">

        {/* LEFT — Hero campaign image */}
        <div className="relative w-full md:w-[42%] shrink-0 overflow-hidden bg-[#F4EAEB] min-h-[200px] md:min-h-0">
          <img
            src="/im_cat_sunscreen.webp"
            alt="Skin Collection"
            className="absolute inset-0 w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent md:hidden" />
        </div>

        {/* RIGHT — Collection info + horizontal product carousel */}
        <div className="flex flex-col flex-1 px-6 pt-6 pb-5 min-w-0">

          {/* Header text */}
          <div className="mb-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#C97C85] mb-1.5">
              Solaire Collection
            </p>
            <h2 className="text-xl md:text-2xl font-bold text-[#2A2424] leading-tight mb-1">
              Votre Protection,<br className="hidden md:block" /> Chaque Jour
            </h2>
            <p className="text-sm text-[#2A2424]/50">
              Des formules coréennes ultra-légères pour protéger votre peau des UV sans fini gras.
            </p>
          </div>

          {/* Scrollable product row */}
          <div className="relative flex-1 min-w-0">
            <button
              onClick={() => scroll("left")}
              className="absolute -left-3 top-[40%] -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-[#F4EAEB] shadow-md flex items-center justify-center hover:bg-[#F4EAEB] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="#2A2424" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button
              onClick={() => scroll("right")}
              className="absolute -right-3 top-[40%] -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-[#F4EAEB] shadow-md flex items-center justify-center hover:bg-[#F4EAEB] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="#2A2424" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>

            <div
              ref={scrollRef}
              className="flex gap-3 overflow-x-auto hide-scrollbar scroll-smooth px-1 pb-1"
            >
              {products.map((product, i) => (
                <Link
                  key={product.id || i}
                  href={`/shop/product/${product.id}`}
                  className="group shrink-0 w-[140px] md:w-[160px] flex flex-col rounded-2xl overflow-hidden border border-[#F4EAEB] bg-[#F8F5F2] hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                >
                  {/* Badge */}
                  <div className="flex px-2 pt-2">
                    {i === 0 ? (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-[#2A2424] text-white px-2 py-0.5 rounded-sm">Best Seller</span>
                    ) : (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-[#E5B6B9]/30 text-[#C97C85] px-2 py-0.5 rounded-sm">Nouveau</span>
                    )}
                  </div>

                  {/* Image */}
                  <div className="w-full aspect-square bg-[#F8F5F2] flex items-center justify-center p-3 relative overflow-hidden">
                    <img
                      src={product.image || `/products/${(i % 4) + 1}.webp`}
                      alt={product.name}
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      onClick={(e) => e.preventDefault()}
                      className="absolute bottom-2 right-2 w-7 h-7 bg-white border border-[#F4EAEB] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <ShoppingBag className="w-3 h-3 text-[#2A2424]" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="px-3 pb-3 pt-2 bg-white flex-1 flex flex-col gap-1">
                    <p className="text-[11px] font-semibold text-[#2A2424] line-clamp-2 leading-snug">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} weight="fill" className={`w-2.5 h-2.5 ${s <= Math.round(product.rating || 4.8) ? "text-[#F4B942]" : "text-[#E0E0E0]"}`} />
                      ))}
                      <span className="text-[9px] text-[#2A2424]/40 ml-1">{product.reviews || 90} avis</span>
                    </div>
                    <p className="text-[13px] font-bold text-[#2A2424]">
                      {(product.price || 15000).toLocaleString("fr-FR")} <span className="text-[9px] font-normal">FCFA</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <Link
            href="/shop/all"
            className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#2A2424]/50 hover:text-[#2A2424] transition-colors w-fit"
          >
            Voir toute la collection <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════ */
export default function ShopClient({ flashProducts, bestProducts, sunProducts }: { flashProducts: any[], bestProducts: any[], sunProducts: any[] }) {
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
            [1] ACCORDION HERO (Replaces Bento Grid)
        ════════════════════════════════════ */}
        <AccordionHero />
        </div> {/* End top container */}

      {/* ════════════════════════════════════
          [2] SHOWCASE CAROUSEL (Full Width)
      ════════════════════════════════════ */}
      <ShowcaseCarousel />

      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-10 flex flex-col gap-5 pb-6">
        {/* ════════════════════════════════════
            [3] VENTE FLASH
        ════════════════════════════════════ */}
        <div className="bg-white rounded-3xl border border-[#F4EAEB] overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 pt-6 pb-5 border-b border-[#F4EAEB]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#E5B6B9]/20 flex items-center justify-center">
                <Lightning className="w-3.5 h-3.5 text-[#E5B6B9]" />
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 lg:gap-8 pt-4 pb-6 px-4 md:px-6">
            {flashProducts.map((product) => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════
            [3.5] COLLECTION SPOTLIGHT (ANUA-style)
        ════════════════════════════════════ */}
        <CollectionSpotlight products={sunProducts} />

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
                <Sparkle className="w-3.5 h-3.5 text-[#E5B6B9]" />
              </div>
              <h2 className="text-base font-bold text-[#2A2424]">Meilleures ventes</h2>
            </div>
            <TabBar tabs={BEST_TABS} active={bestTab} onChange={setBestTab} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 lg:gap-8 pt-4 pb-6 px-4 md:px-6">
            {bestProducts.map((product) => (
              <ProductCard key={product.id} product={product as any} />
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
