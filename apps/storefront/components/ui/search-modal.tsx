"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, X, TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const popularSearches = ["Sérum vitamine C", "Crème solaire sans trace", "Anti-acné", "Peau de verre (Glass skin)"];
const popularProducts = [
  { id: 1, name: "Snail Mucin 96 Power Essence", brand: "COSRX", image: "/products/1.png" },
  { id: 2, name: "Relief Sun : Rice + Probiotics", brand: "Beauty of Joseon", image: "/products/2.png" },
];

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent scrolling when modal is open
      document.body.style.overflow = "hidden";
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] w-full max-w-2xl px-4"
          >
            <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
              {/* Search Input Area */}
              <div className="flex items-center px-6 py-4 border-b border-[#2A2424]/10">
                <Search className="w-5 h-5 text-[#2A2424]/50" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Que recherchez-vous pour votre peau ?"
                  className="flex-1 bg-transparent border-none outline-none px-4 text-[#2A2424] placeholder:text-[#2A2424]/40 text-lg"
                />
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[#F4EAEB] rounded-full transition-colors text-[#2A2424]/60 hover:text-[#2A2424]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Suggestions Area */}
              <div className="p-6 overflow-y-auto">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Left Column: Popular Searches */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-4 h-4 text-[#E5B6B9]" />
                      <h3 className="text-sm font-semibold text-[#2A2424]">Recherches populaires</h3>
                    </div>
                    <ul className="flex flex-col gap-2">
                      {popularSearches.map((search, index) => (
                        <li key={index}>
                          <button className="flex items-center gap-2 text-sm text-[#2A2424]/70 hover:text-[#2A2424] hover:bg-[#F4EAEB] px-3 py-2 rounded-xl transition-colors w-full text-left">
                            <Search className="w-3.5 h-3.5 opacity-50" />
                            {search}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right Column: Suggested Products */}
                  <div className="flex-[1.5]">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 text-[#E5B6B9]" />
                      <h3 className="text-sm font-semibold text-[#2A2424]">Produits suggérés</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      {popularProducts.map((product) => (
                        <Link
                          key={product.id}
                          href={`/shop/${product.id}`}
                          onClick={onClose}
                          className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#F4EAEB] transition-colors group"
                        >
                          <div className="w-14 h-14 bg-white rounded-lg overflow-hidden shrink-0">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover mix-blend-multiply" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-[#2A2424]/50 mb-0.5">{product.brand}</p>
                            <p className="text-sm font-medium text-[#2A2424] group-hover:text-[#E5B6B9] transition-colors line-clamp-1">{product.name}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#2A2424]/30 group-hover:text-[#2A2424] transition-colors" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="bg-[#FAFAF9] px-6 py-4 border-t border-[#2A2424]/5 flex justify-between items-center">
                <span className="text-xs text-[#2A2424]/40">Appuyez sur <kbd className="px-1.5 py-0.5 rounded border border-[#2A2424]/20 bg-white">Échap</kbd> pour fermer</span>
                <Link href="/shop" onClick={onClose} className="text-sm font-medium text-[#E5B6B9] hover:text-[#2A2424] transition-colors">
                  Voir tout le catalogue
                </Link>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
