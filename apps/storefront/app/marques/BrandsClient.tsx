"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MagnifyingGlass, ArrowRight, CaretLeft } from "@phosphor-icons/react";
import { Footer } from "@/components/home/footer";
import { useI18n } from "@/lib/i18n-context";

type Brand = {
  id: string;
  name: string;
  handle: string;
  productCount: number;
};

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function normalize(s: string) {
  return s
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function BrandsClient({ brands }: { brands: Brand[] }) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return brands;
    const q = normalize(search.trim());
    return brands.filter((b) => normalize(b.name).includes(q));
  }, [brands, search]);

  // Group by first letter
  const grouped = useMemo(() => {
    const map: Record<string, Brand[]> = {};
    for (const brand of filtered) {
      const letter = normalize(brand.name)[0] || "#";
      if (!map[letter]) map[letter] = [];
      map[letter].push(brand);
    }
    return map;
  }, [filtered]);

  const presentLetters = new Set(Object.keys(grouped));

  const scrollToLetter = (letter: string) => {
    const el = document.getElementById(`brand-section-${letter}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="min-h-screen bg-white flex flex-col w-full">
      {/* Hero */}
      <div className="relative w-full bg-[#F4EAEB] px-5 lg:px-12 py-10 md:py-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-0">
          <img
            src="/cherry-blossom.webp"
            alt=""
            className="absolute top-0 right-0 w-[200px] md:w-[300px] opacity-50 -rotate-[15deg] scale-x-[-1] blur-[1px]"
          />
        </div>
        <div className="w-full max-w-[1600px] mx-auto relative z-10">
          <div className="flex items-center gap-2 text-sm text-[#2A2424]/50 mb-6">
            <Link href="/shop" className="flex items-center gap-1.5 hover:text-[#2A2424] transition-colors group">
              <CaretLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              {t("Boutique")}
            </Link>
            <span>/</span>
            <span className="text-[#2A2424] font-medium">{t("Marques")}</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-[4rem] font-medium tracking-tight text-[#2A2424] leading-[1.05] mb-4">
            {t("Nos Marques")}
          </h1>
          <p className="text-[#2A2424]/60 text-base md:text-lg max-w-xl mb-8">
            {t("Découvrez toutes les marques K-Beauty soigneusement sélectionnées pour vous.")}
          </p>

          {/* Search */}
          <div className="relative w-full max-w-md">
            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2A2424]/40" />
            <input
              type="text"
              placeholder={t("Rechercher une marque...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/80 backdrop-blur-sm border border-[#2A2424]/10 rounded-full py-3 pl-10 pr-5 text-sm text-[#2A2424] placeholder-[#2A2424]/40 focus:outline-none focus:ring-2 focus:ring-[#E5B6B9]/50 shadow-sm transition"
            />
          </div>

          {/* Stats */}
          <p className="mt-4 text-xs text-[#2A2424]/40 font-medium uppercase tracking-widest">
            {brands.length} {brands.length > 1 ? t("marques disponibles") : t("marque disponible")}
          </p>
        </div>
      </div>

      {/* Alphabet sticky nav */}
      {!search && (
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#F4EAEB]">
          <div className="w-full max-w-[1600px] mx-auto px-5 lg:px-12 h-14 flex items-center gap-1 overflow-x-auto hide-scrollbar">
            {ALPHABET.map((letter) => {
              const active = presentLetters.has(letter);
              return (
                <button
                  key={letter}
                  onClick={() => active && scrollToLetter(letter)}
                  disabled={!active}
                  className={`flex-shrink-0 w-8 h-8 rounded-full text-xs font-bold transition-all ${
                    active
                      ? "text-[#2A2424] hover:bg-[#F4EAEB] hover:text-[#E51D5A] cursor-pointer"
                      : "text-[#2A2424]/20 cursor-default"
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Brands Grid */}
      <div className="w-full max-w-[1600px] mx-auto px-5 lg:px-12 py-12 flex-1">
        {Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F4EAEB] flex items-center justify-center mb-6">
              <MagnifyingGlass className="w-6 h-6 text-[#2A2424]/40" />
            </div>
            <h3 className="text-xl font-medium text-[#2A2424] mb-2">{t("Aucune marque trouvée")}</h3>
            <p className="text-[#2A2424]/50 text-sm">{t("Essayez un autre terme de recherche.")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {ALPHABET.filter((l) => grouped[l]).map((letter) => (
              <section key={letter} id={`brand-section-${letter}`} className="scroll-mt-24">
                {/* Letter heading */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-5xl font-bold text-[#2A2424]/8 leading-none select-none w-12 text-center" style={{ color: 'rgba(42,36,36,0.08)' }}>
                    {letter}
                  </span>
                  <div className="flex-1 h-px bg-[#F4EAEB]" />
                </div>

                {/* Brand cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {(grouped[letter] ?? []).map((brand, i) => (
                    <motion.div
                      key={brand.handle}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link
                        href={`/shop/all?collection_id=${brand.id}&brand_name=${encodeURIComponent(brand.name)}`}
                        className="group flex items-center justify-between p-5 bg-white rounded-2xl border border-[#F4EAEB] hover:border-[#E5B6B9]/60 hover:shadow-[0_8px_32px_-8px_rgba(229,182,185,0.4)] transition-all duration-300 hover:-translate-y-0.5"
                      >
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="font-semibold text-[#2A2424] text-base truncate group-hover:text-[#E51D5A] transition-colors">
                            {brand.name}
                          </span>
                          <span className="text-xs text-[#2A2424]/40 font-medium">
                            {brand.productCount} {brand.productCount > 1 ? t("produits") : t("produit")}
                          </span>
                        </div>
                        <div className="shrink-0 ml-3 w-8 h-8 rounded-full bg-[#F4EAEB] group-hover:bg-[#E5B6B9] flex items-center justify-center transition-colors">
                          <ArrowRight
                            className="w-3.5 h-3.5 text-[#2A2424]/50 group-hover:text-white group-hover:translate-x-0.5 transition-all"
                            weight="bold"
                          />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
