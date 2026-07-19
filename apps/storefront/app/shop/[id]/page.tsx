"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Search,
  ShoppingBag,
  Menu,
  SlidersHorizontal,
  Star,
  X,
  Check,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { AnnouncementBar } from "@/components/ui/announcement-bar";
import { Footer } from "@/components/home/footer";
import { SearchModal } from "@/components/ui/search-modal";
import { MOCK_PRODUCTS, FILTER_OPTIONS } from "@/lib/mock-data";
import { useEffect, use } from "react";

/* ─────────────────────────────────────────
   CATEGORY CONFIG
───────────────────────────────────────── */
const CATEGORY_LABELS: Record<string, string> = {
  all: "Tous les produits",
  nettoyants: "Nettoyants",
  toners: "Toners",
  serums: "Sérums & Ampoules",
  hydratants: "Hydratants",
  "protections-solaires": "Protections Solaires",
  masques: "Masques en Tissu",
  "soins-yeux": "Soins Contour des Yeux",
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  all: "Explorez notre collection complète de soins K-Beauty authentiques.",
  nettoyants: "Préparez votre peau avec un nettoyage doux et efficace en profondeur.",
  toners: "La première couche d'hydratation pour préparer votre peau aux soins suivants.",
  serums: "Des actifs concentrés pour cibler vos préoccupations cutanées spécifiques.",
  hydratants: "Restaurez et protégez la barrière cutanée de votre peau.",
  "protections-solaires": "Le dernier geste indispensable de votre routine matinale.",
  masques: "Des rituels ciblés K-Beauty pour une peau régénérée en une nuit.",
  "soins-yeux": "Des soins spécialisés pour le contour délicat de vos yeux.",
};

/* ─────────────────────────────────────────
   FILTER SECTION COMPONENT
───────────────────────────────────────── */
function FilterSection({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (item: string) => void;
}) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-bold uppercase tracking-wider text-[#2A2424] mb-4">{title}</h3>
      <div className="flex flex-col gap-3">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-3 cursor-pointer group" onClick={() => onToggle(opt)}>
            <div
              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                selected.includes(opt)
                  ? "bg-[#2A2424] border-[#2A2424]"
                  : "border-[#2A2424]/20 group-hover:border-[#2A2424]/50"
              }`}
            >
              {selected.includes(opt) && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
            </div>
            <span className={`text-sm ${selected.includes(opt) ? "text-[#2A2424] font-medium" : "text-[#2A2424]/70"}`}>
              {opt}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: category } = use(params);
  const categoryLabel = CATEGORY_LABELS[category] ?? "Boutique";
  const categoryDesc = CATEGORY_DESCRIPTIONS[category] ?? "";

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [selectedSkinTypes, setSelectedSkinTypes] = useState<string[]>([]);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

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

  const toggleFilter = (list: string[], setList: (l: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const slugToCategory: Record<string, string> = {
    nettoyants: "Nettoyants",
    toners: "Toners",
    serums: "Sérums & Ampoules",
    hydratants: "Hydratants",
    "protections-solaires": "Protections Solaires",
    masques: "Masques en Tissu",
    "soins-yeux": "Soins Contour des Yeux",
  };

  const filteredProducts = MOCK_PRODUCTS.filter((p) => {
    if (category !== "all") {
      const targetCat = slugToCategory[category];
      if (targetCat && p.category !== targetCat) return false;
    }
    if (selectedSkinTypes.length > 0 && !selectedSkinTypes.includes("Toutes")) {
      if (!selectedSkinTypes.some((t) => p.skin_profile.skin_types.includes(t))) return false;
    }
    if (selectedConcerns.length > 0) {
      if (!selectedConcerns.some((c) => p.skin_profile.skin_concerns.includes(c))) return false;
    }
    if (selectedIngredients.length > 0) {
      if (!selectedIngredients.some((ing) => p.active_ingredients.some((ai) => ai.name === ing))) return false;
    }
    return true;
  });

  const hasFilters = selectedSkinTypes.length > 0 || selectedConcerns.length > 0 || selectedIngredients.length > 0;
  const clearAll = () => { setSelectedSkinTypes([]); setSelectedConcerns([]); setSelectedIngredients([]); };

  return (
    <main className="min-h-screen bg-white flex flex-col w-full relative">
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AnnouncementBar />

      {/* Navbar */}
      <div className="w-full bg-[#F4EAEB] z-40 relative pt-4 md:pt-6 pb-4 border-b border-[#E5B6B9]/20">
        <header className="flex items-center justify-between px-5 md:px-12 h-16 lg:h-20 w-full max-w-[1600px] mx-auto">
          <div className="flex items-center gap-12 lg:gap-20">
            <Link href="/" className="flex items-center relative z-50">
              <img src="/logo.png" alt="The Welfare Shop" className="h-12 lg:h-20 w-auto object-contain lg:scale-[1.8] origin-left" />
            </Link>
            <div className="hidden lg:flex items-center gap-8 text-[15px] font-medium text-[#2A2424]/70 mt-2">
              <Link href="/" className="hover:text-[#2A2424] transition-colors">Écosystème</Link>
              <Link href="/shop" className="text-[#2A2424] font-semibold transition-colors">Boutique</Link>
              <Link href="/routines" className="flex items-center gap-1 hover:text-[#2A2424] transition-colors">
                Routines <sup className="text-[10px] bg-[#E5B6B9]/30 px-1.5 rounded-full text-[#2A2424]">Nouveau</sup>
              </Link>
              <Link href="/about" className="hover:text-[#2A2424] transition-colors">Conseils</Link>
            </div>
          </div>
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="hidden md:flex items-center relative cursor-text group" onClick={() => setIsSearchOpen(true)}>
              <div className="absolute inset-0 bg-white/60 border border-white/80 rounded-full transition-all group-hover:bg-white group-hover:shadow-md pointer-events-none" />
              <span className="pl-12 pr-6 py-2.5 text-sm text-[#2A2424]/50 relative z-10 w-[250px] lg:w-[350px] flex items-center">Rechercher un produit...</span>
              <Search className="w-4 h-4 absolute left-4 text-[#2A2424]/50 z-10 group-hover:text-[#2A2424] transition-colors" />
            </div>
            <button className="md:hidden p-2 text-[#2A2424] hover:bg-white/60 rounded-full transition-colors" onClick={() => setIsSearchOpen(true)}>
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 lg:p-3 text-[#2A2424] hover:bg-white/60 rounded-full transition-colors relative group">
              <ShoppingBag className="w-5 h-5 lg:w-6 lg:h-6 group-hover:scale-110 transition-transform" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#2A2424] rounded-full border-2 border-[#F4EAEB]" />
            </button>
            <button className="lg:hidden p-2 text-[#2A2424] hover:bg-white/60 rounded-full transition-colors">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>
      </div>

      {/* Category Header */}
      <div className="relative w-full bg-[#F4EAEB] px-5 lg:px-12 py-10 md:py-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-0">
          <img src="/cherry-blossom.png" alt="" className="absolute top-0 right-0 w-[200px] md:w-[300px] opacity-50 -rotate-[15deg] scale-x-[-1] blur-[1px]" />
        </div>
        <div className="w-full max-w-[1600px] mx-auto relative z-10">
          <div className="flex items-center gap-2 text-sm text-[#2A2424]/50 mb-6">
            <Link href="/shop" className="flex items-center gap-1.5 hover:text-[#2A2424] transition-colors group">
              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Boutique
            </Link>
            <span>/</span>
            <span className="text-[#2A2424] font-medium">{categoryLabel}</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-[4rem] font-medium tracking-tight text-[#2A2424] leading-[1.05] mb-4">
            {categoryLabel}
          </h1>
          <p className="text-[#2A2424]/60 text-base md:text-lg max-w-xl">{categoryDesc}</p>
        </div>
      </div>

      {/* Sub-nav */}
      <div className="w-full border-b border-[#F4EAEB] sticky top-0 z-30 bg-white/90 backdrop-blur-md">
        <div className="w-full max-w-[1600px] mx-auto px-5 lg:px-12 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-1">
            {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
              <Link
                key={slug}
                href={`/shop/${slug}`}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border ${
                  category === slug
                    ? "bg-[#2A2424] text-white border-[#2A2424]"
                    : "bg-white text-[#2A2424]/70 border-[#F4EAEB] hover:border-[#2A2424]/30"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="hidden lg:flex items-center gap-3 shrink-0 pl-4 border-l border-[#F4EAEB]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2A2424]/50">
              {filteredProducts.length} Résultat{filteredProducts.length > 1 ? "s" : ""}
            </span>
          </div>
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="lg:hidden shrink-0 w-10 h-10 rounded-full border border-[#F4EAEB] flex items-center justify-center text-[#2A2424]"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="w-full max-w-[1600px] mx-auto px-5 lg:px-12 py-12 flex flex-col lg:flex-row gap-12">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-[280px] shrink-0 sticky top-[80px] h-fit">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 text-[#2A2424]">
              <SlidersHorizontal className="w-5 h-5" />
              <h2 className="text-lg font-medium">Filtres Avancés</h2>
            </div>
            {hasFilters && (
              <button onClick={clearAll} className="text-xs font-semibold text-[#2A2424]/50 hover:text-[#2A2424] transition-colors underline underline-offset-2">
                Effacer
              </button>
            )}
          </div>
          <div className="space-y-8 pr-6">
            <FilterSection title="Type de Peau" options={FILTER_OPTIONS.skinTypes} selected={selectedSkinTypes} onToggle={(item) => toggleFilter(selectedSkinTypes, setSelectedSkinTypes, item)} />
            <div className="w-full h-px bg-[#F4EAEB]" />
            <FilterSection title="Préoccupations" options={FILTER_OPTIONS.skinConcerns} selected={selectedConcerns} onToggle={(item) => toggleFilter(selectedConcerns, setSelectedConcerns, item)} />
            <div className="w-full h-px bg-[#F4EAEB]" />
            <FilterSection title="Ingrédients Phares" options={FILTER_OPTIONS.ingredients} selected={selectedIngredients} onToggle={(item) => toggleFilter(selectedIngredients, setSelectedIngredients, item)} />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          <motion.div layout className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 lg:gap-8">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.div
                  layout
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative flex flex-col h-full bg-[#FAFAFA] rounded-[1rem] md:rounded-[1.5rem] overflow-hidden"
                >
                  <div className="relative aspect-[4/5] bg-[#F4EAEB] overflow-hidden flex items-center justify-center p-4 md:p-8">
                    <button className="absolute top-2 right-2 md:top-4 md:right-4 z-10 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center text-[#2A2424] hover:bg-[#2A2424] hover:text-white transition-colors">
                      <Heart className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-x-2 md:inset-x-4 bottom-2 md:bottom-4 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <button className="w-full py-2 md:py-3.5 bg-[#2A2424] text-white rounded-full text-[10px] md:text-sm font-semibold tracking-wide hover:bg-black transition-colors shadow-lg">
                        Ajouter au panier
                      </button>
                    </div>
                  </div>
                  <div className="p-3 md:p-6 flex-1 flex flex-col">
                    <p className="text-[10px] md:text-xs font-bold text-[#2A2424]/50 mb-1.5 md:mb-2 tracking-wider uppercase truncate">
                      {product.category}
                    </p>
                    <h3 className="text-xs md:text-lg font-medium text-[#2A2424] leading-snug mb-2 md:mb-3 flex-1 line-clamp-2 md:line-clamp-none">
                      <Link href={`/shop/product/${product.id}`} className="hover:underline decoration-[#E5B6B9] underline-offset-4">
                        {product.title}
                      </Link>
                    </h3>
                    <div className="flex-wrap gap-1 md:gap-1.5 mb-2 md:mb-4 hidden sm:flex">
                      {product.skin_profile.skin_concerns.slice(0, 2).map((c: string) => (
                        <span key={c} className="text-[9px] md:text-[10px] uppercase tracking-wider font-semibold px-1.5 md:px-2 py-0.5 md:py-1 rounded bg-[#E5B6B9]/20 text-[#2A2424]">
                          {c}
                        </span>
                      ))}
                      {product.skin_profile.skin_concerns.length > 2 && (
                        <span className="text-[9px] md:text-[10px] uppercase tracking-wider font-semibold px-1.5 md:px-2 py-0.5 md:py-1 rounded bg-[#F4EAEB] text-[#2A2424]/60">
                          +{product.skin_profile.skin_concerns.length - 2}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#F4EAEB]">
                      <p className="text-sm md:text-lg font-semibold text-[#2A2424]">
                        {product.price_fcfa.toLocaleString("fr-FR")} FCFA
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredProducts.length === 0 && (
            <div className="w-full py-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#F4EAEB] flex items-center justify-center mb-6">
                <Search className="w-6 h-6 text-[#2A2424]/50" />
              </div>
              <h3 className="text-xl font-medium text-[#2A2424] mb-2">Aucun produit trouvé</h3>
              <p className="text-[#2A2424]/60 max-w-md">Essayez de modifier vos filtres pour voir plus de résultats.</p>
              <button onClick={clearAll} className="mt-6 px-6 py-2.5 bg-[#2A2424] text-white rounded-full text-sm font-semibold hover:bg-black/80 transition-colors">
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />

      {/* Mobile Filters Drawer */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileFiltersOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] lg:hidden" />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 h-[85vh] bg-white rounded-t-[2rem] z-[101] lg:hidden flex flex-col shadow-2xl"
            >
              <div className="p-5 flex items-center justify-between border-b border-[#F4EAEB] shrink-0">
                <h2 className="text-lg font-medium text-[#2A2424]">Filtres Avancés</h2>
                <button onClick={() => setIsMobileFiltersOpen(false)} className="w-10 h-10 rounded-full bg-[#F4EAEB] flex items-center justify-center text-[#2A2424]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 pb-32">
                <FilterSection title="Type de Peau" options={FILTER_OPTIONS.skinTypes} selected={selectedSkinTypes} onToggle={(item) => toggleFilter(selectedSkinTypes, setSelectedSkinTypes, item)} />
                <div className="w-full h-px bg-[#F4EAEB] my-8" />
                <FilterSection title="Préoccupations" options={FILTER_OPTIONS.skinConcerns} selected={selectedConcerns} onToggle={(item) => toggleFilter(selectedConcerns, setSelectedConcerns, item)} />
                <div className="w-full h-px bg-[#F4EAEB] my-8" />
                <FilterSection title="Ingrédients Phares" options={FILTER_OPTIONS.ingredients} selected={selectedIngredients} onToggle={(item) => toggleFilter(selectedIngredients, setSelectedIngredients, item)} />
              </div>
              <div className="absolute bottom-0 inset-x-0 p-5 bg-white border-t border-[#F4EAEB] flex gap-4">
                <button onClick={clearAll} className="px-6 py-3.5 rounded-full text-sm font-semibold text-[#2A2424] hover:bg-[#F4EAEB] transition-colors">Effacer</button>
                <button onClick={() => setIsMobileFiltersOpen(false)} className="flex-1 py-3.5 bg-[#2A2424] text-white rounded-full text-sm font-semibold shadow-lg">
                  Afficher les résultats ({filteredProducts.length})
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
