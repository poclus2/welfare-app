"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Star } from "lucide-react";
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

export function BestSellers() {
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
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group flex flex-col"
            >
              {/* Product Image Box */}
              <Link href={`/shop/${product.id}`} className="block relative bg-[#F4F2EE] rounded-2xl md:rounded-[2rem] aspect-[4/5] mb-3 md:mb-6 overflow-hidden">
                {product.badge && (
                  <div className="absolute top-3 left-3 z-10">
                    <span className="inline-flex items-center bg-[#2A2424]/80 backdrop-blur-sm text-white text-[9px] font-bold tracking-[0.15em] uppercase px-2.5 py-1 rounded-full">
                      {product.badge}
                    </span>
                  </div>
                )}
                
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 mix-blend-multiply" 
                />
                
                {/* Add to Cart Overlay Button */}
                <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20 w-[92%] md:w-[90%]">
                  <button className="w-full bg-[#2A2424] text-white py-2 md:py-3.5 rounded-full flex items-center justify-center gap-1.5 md:gap-2 text-[11px] md:text-sm font-medium hover:bg-black/80 transition-colors shadow-lg">
                    <ShoppingBag className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Ajouter au panier</span>
                    <span className="inline sm:hidden">Ajouter</span>
                  </button>
                </div>
              </Link>
              
              {/* Product Info */}
              <div className="flex flex-col px-1 md:px-2">
                <div className="flex items-center gap-1 mb-1 md:mb-1.5">
                  <Star className="w-3 h-3 md:w-3.5 md:h-3.5 fill-[#E5B6B9] text-[#E5B6B9]" />
                  <span className="text-xs md:text-sm font-medium text-[#2A2424]">{product.rating}</span>
                  <span className="text-[10px] md:text-sm text-[#2A2424]/40">({product.reviews})</span>
                </div>
                
                <h3 className="text-sm md:text-lg font-medium text-[#2A2424] mb-0.5 md:mb-1 group-hover:text-[#E5B6B9] transition-colors line-clamp-2 md:line-clamp-none leading-tight md:leading-normal">
                  <Link href={`/shop/${product.id}`}>{product.name}</Link>
                </h3>
                
                <p className="text-[11px] md:text-sm text-[#2A2424]/60 mb-2 md:mb-3">{product.category}</p>
                
                <span className="text-sm md:text-lg font-semibold text-[#2A2424]">
                  {product.price.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
