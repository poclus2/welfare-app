"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, CircleNotch } from "@phosphor-icons/react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { useCart } from "@/lib/cart-context";

type BestSeller = { id: string; name: string; brand?: string; price: number; image: string; variantId?: string };

export function BestSellers({ products }: { products?: BestSeller[] }) {
  const { t } = useI18n();
  const { addItem } = useCart();
  const [addingId, setAddingId] = useState<string | null>(null);

  // No demo products any more: without real products the section is left out
  if (!products || products.length === 0) return null;

  const handleAdd = async (e: React.MouseEvent, product: BestSeller) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.variantId || addingId) return;
    try {
      setAddingId(product.id);
      await addItem(product.variantId, 1, product.image, product.name, product.price);
    } catch (err) {
      console.error("Failed to add item to cart:", err);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <section className="w-full bg-[#F4EAEB] py-20 md:py-32 flex flex-col items-center overflow-hidden">
      <div className="w-full max-w-[1600px] mx-auto px-5 md:px-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-xl">
            <h2 className="text-[2.5rem] md:text-[3.5rem] leading-[1.1] font-medium tracking-tight text-[#2A2424] mb-4">
              {t("Nos meilleures ventes en boutique")}
            </h2>
            <p className="text-[#2A2424]/60 text-lg">
              {t("Les soins que nos clientes et clients choisissent le plus souvent dans nos boutiques, désormais disponibles en ligne.")}
            </p>
          </div>
          <Link 
            href="/shop/all"
            className="flex items-center gap-2 text-[#2A2424] font-medium hover:opacity-70 transition-opacity"
          >
            {t("Voir tout le catalogue")}
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
              <Link
                href={`/shop/product/${product.id}`}
                className="group relative flex flex-col h-full bg-[#FAFAFA] rounded-[1rem] md:rounded-[1.5rem] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-[4/5] bg-[#F4EAEB] overflow-hidden flex items-center justify-center p-4 md:p-8">
                  <div className="w-full h-full flex items-center justify-center">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>
                  <div className="absolute inset-x-2 md:inset-x-4 bottom-2 md:bottom-4 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                      onClick={(e) => handleAdd(e, product)}
                      disabled={!product.variantId}
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
                      onClick={(e) => handleAdd(e, product)}
                      disabled={!product.variantId}
                      aria-label={`${t("Ajouter au panier")} : ${product.name}`}
                      className="bg-[#E51D5A] text-white w-8 h-8 md:w-auto md:h-auto md:px-4 md:py-2 rounded-full flex items-center justify-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-bold hover:bg-[#C2164A] transition-colors shrink-0 shadow-md shadow-[#E51D5A]/20"
                    >
                      {addingId === product.id ? (
                        <CircleNotch className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                      ) : (
                        <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      )}
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
