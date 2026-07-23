"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Star, Heart } from "lucide-react";
import Link from "next/link";

const products = [
  {
    id: 1,
    name: "Snail Mucin 96 Power Essence",
    category: "Sérums & Ampoules",
    price: 18500,
    rating: 4.9,
    reviews: 1280,
    image: "/products/1.png",
    badge: "Meilleure vente",
  },
  {
    id: 2,
    name: "Relief Sun : Rice + Probiotics",
    category: "Protections Solaires",
    price: 16500,
    rating: 4.8,
    reviews: 950,
    image: "/products/2.png",
  },
  {
    id: 3,
    name: "Heartleaf 77% Soothing Toner",
    category: "Toners",
    price: 15000,
    rating: 4.9,
    reviews: 2100,
    image: "/products/3.png",
    badge: "Tendance",
  },
  {
    id: 4,
    name: "Glow Serum: Propolis + Niacinamide",
    category: "Sérums & Ampoules",
    price: 16500,
    rating: 5.0,
    reviews: 342,
    image: "/products/4.png",
  },
  {
    id: 5,
    name: "Lip Sleeping Mask",
    category: "Soins des Lèvres",
    price: 14000,
    rating: 4.9,
    reviews: 845,
    image: "/products/1.png",
  },
  {
    id: 6,
    name: "Centella Asiatica Ampoule",
    category: "Sérums & Ampoules",
    price: 19500,
    rating: 4.7,
    reviews: 512,
    image: "/products/2.png",
    badge: "Nouveau",
  },
  {
    id: 7,
    name: "Green Plum Refreshing Cleanser",
    category: "Nettoyants",
    price: 12500,
    rating: 4.8,
    reviews: 320,
    image: "/products/3.png",
  },
  {
    id: 8,
    name: "Hyaluronic Acid Aqua Gel",
    category: "Hydratants",
    price: 21000,
    rating: 4.9,
    reviews: 789,
    image: "/products/4.png",
  }
];

export function BestSellers({ products: customProducts }: { products?: any[] }) {
  const displayProducts = customProducts && customProducts.length > 0 ? customProducts : products;

  return (
    <section className="w-full bg-[#F4EAEB] py-20 md:py-32 flex flex-col items-center overflow-hidden">
      <div className="w-full max-w-[1600px] mx-auto px-8 md:px-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-xl">
            <h2 className="text-[2.5rem] md:text-[3.5rem] leading-[1.1] font-medium tracking-tight text-[#2A2424] mb-4">
              Meilleures ventes
            </h2>
            <p className="text-[#2A2424]/60 text-lg">
              Découvrez nos formules de soins coréens les plus recherchées qui ont transformé des milliers de routines.
            </p>
          </div>
          <Link 
            href="/shop" 
            className="flex items-center gap-2 text-[#2A2424] font-medium hover:opacity-70 transition-opacity"
          >
            Voir toutes les meilleures ventes
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
                className="group flex flex-col bg-white rounded-[20px] md:rounded-[32px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#F4EAEB] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300 h-full"
              >
                {/* TOP HEADER */}
                <div className="bg-[#F4EAEB] px-3 md:px-5 py-2.5 md:py-3.5 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-1 md:gap-1.5 text-[9px] md:text-[11px] font-bold text-[#2A2424] uppercase tracking-wider">
                    <Star className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 fill-[#2A2424]" />
                    <span className="truncate">{product.badge || "BEST SELLER"}</span>
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
                    <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider line-clamp-1">{product.category || "Soin Visage"}</span>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-[13px] md:text-[19px] font-bold text-[#2A2424] leading-tight md:leading-snug line-clamp-2 mb-2 md:mb-4">
                    {product.name}
                  </h3>

                  <div className="w-full border-t border-dashed border-[#EDE0E0] mb-2 md:mb-4 mt-auto" />

                  {/* Price & Cart */}
                  <div className="flex items-end justify-between gap-1">
                    <div className="flex flex-col min-w-0">
                      <span className="text-transparent text-[9px] md:text-[11px] font-bold mb-0 md:mb-0.5 hidden md:block">-</span>
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
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
