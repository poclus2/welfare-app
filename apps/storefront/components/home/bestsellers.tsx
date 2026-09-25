"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Star, Heart } from "@phosphor-icons/react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";

const products = [
  {
    id: 1,
    name: "Snail Mucin 96 Power Essence",
    category: "Sérums & Ampoules",
    price: 18500,
    rating: 4.9,
    reviews: 1280,
    image: "/products/1.webp",
    badge: "Meilleure vente",
  },
  {
    id: 2,
    name: "Relief Sun : Rice + Probiotics",
    category: "Protections Solaires",
    price: 16500,
    rating: 4.8,
    reviews: 950,
    image: "/products/2.webp",
  },
  {
    id: 3,
    name: "Heartleaf 77% Soothing Toner",
    category: "Toners",
    price: 15000,
    rating: 4.9,
    reviews: 2100,
    image: "/products/3.webp",
    badge: "Tendance",
  },
  {
    id: 4,
    name: "Glow Serum: Propolis + Niacinamide",
    category: "Sérums & Ampoules",
    price: 16500,
    rating: 5.0,
    reviews: 342,
    image: "/products/4.webp",
  },
  {
    id: 5,
    name: "Lip Sleeping Mask",
    category: "Soins des Lèvres",
    price: 14000,
    rating: 4.9,
    reviews: 845,
    image: "/products/1.webp",
  },
  {
    id: 6,
    name: "Centella Asiatica Ampoule",
    category: "Sérums & Ampoules",
    price: 19500,
    rating: 4.7,
    reviews: 512,
    image: "/products/2.webp",
    badge: "Nouveau",
  },
  {
    id: 7,
    name: "Green Plum Refreshing Cleanser",
    category: "Nettoyants",
    price: 12500,
    rating: 4.8,
    reviews: 320,
    image: "/products/3.webp",
  },
  {
    id: 8,
    name: "Hyaluronic Acid Aqua Gel",
    category: "Hydratants",
    price: 21000,
    rating: 4.9,
    reviews: 789,
    image: "/products/4.webp",
  }
];

export function BestSellers({ products: customProducts }: { products?: any[] }) {
  const { t } = useI18n();
  const displayProducts = customProducts && customProducts.length > 0 ? customProducts : products;

  return (
    <section className="w-full bg-[#F4EAEB] py-20 md:py-32 flex flex-col items-center overflow-hidden">
      <div className="w-full max-w-[1600px] mx-auto px-8 md:px-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-xl">
            <h2 className="text-[2.5rem] md:text-[3.5rem] leading-[1.1] font-medium tracking-tight text-[#2A2424] mb-4">
              {t("Meilleures ventes")}
            </h2>
            <p className="text-[#2A2424]/60 text-lg">
              {t("Découvrez nos formules de soins coréens les plus recherchées qui ont transformé des milliers de routines.")}
            </p>
          </div>
          <Link 
            href="/shop" 
            className="flex items-center gap-2 text-[#2A2424] font-medium hover:opacity-70 transition-opacity"
          >
            {t("Voir toutes les meilleures ventes")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
          {displayProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group flex flex-col"
            >
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
                      <span>{t("Ajouter au panier")}</span>
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
                  </div>
                  <h3 className="text-xs md:text-lg font-medium text-[#2A2424] leading-snug mb-2 md:mb-3 flex-1 line-clamp-2 md:line-clamp-none">
                    <span className="hover:underline decoration-[#E5B6B9] underline-offset-4">
                      {product.name}
                    </span>
                  </h3>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#F4EAEB]">
                    <p className="text-sm md:text-lg font-semibold text-[#2A2424]">
                      {Number(product.price).toLocaleString("fr-FR")} <span className="text-[10px] md:text-sm">FCFA</span>
                    </p>
                    <button 
                      onClick={(e) => e.preventDefault()}
                      className="bg-[#E51D5A] text-white w-8 h-8 md:w-auto md:h-auto md:px-4 md:py-2 rounded-full flex items-center justify-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-bold hover:bg-[#C2164A] transition-colors shrink-0 shadow-md shadow-[#E51D5A]/20"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      <span className="hidden md:inline">{t("Ajouter")}</span>
                    </button>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
