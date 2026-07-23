"use client";

import { useEffect, useState } from "react";
import { instantMeiliSearch } from "@meilisearch/instant-meilisearch";
import { InstantSearch, SearchBox, Highlight, Configure, useHits } from "react-instantsearch";
import { X, Search } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const searchClient = instantMeiliSearch(
  process.env.NEXT_PUBLIC_MEILISEARCH_HOST || "http://localhost:7700",
  process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY || "meilisearch_super_secret"
);

function Hit({ hit, onClose }: { hit: any; onClose: () => void }) {
  return (
    <Link href={`/shop/product/${hit.id}`} onClick={onClose} className="flex items-center gap-4 p-4 hover:bg-[#F4EAEB]/30 transition-colors border-b border-[#F4EAEB] last:border-0 group">
      <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0 border border-[#F4EAEB]">
        {hit.thumbnail ? (
          <img src={hit.thumbnail} alt={hit.title} className="w-full h-full object-contain mix-blend-multiply" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#F8F5F2] text-[#2A2424]/30 text-[10px]">No img</div>
        )}
      </div>
      <div className="flex flex-col flex-1 overflow-hidden [&_mark]:bg-transparent [&_mark]:text-[#E5B6B9] [&_mark]:font-bold">
        <h4 className="text-sm font-bold uppercase text-[#2A2424] truncate group-hover:text-[#E5B6B9] transition-colors">
          <Highlight attribute="title" hit={hit} />
        </h4>
        <p className="text-xs text-[#2A2424]/60 line-clamp-1 mt-1">
          <Highlight attribute="description" hit={hit} />
        </p>
        {hit.price !== undefined && (
          <p className="text-sm font-bold text-[#E5B6B9] mt-1.5">
            {new Intl.NumberFormat("fr-FR").format(hit.price)} FCFA
          </p>
        )}
      </div>
      <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#F8F5F2] group-hover:bg-[#E5B6B9] group-hover:text-white transition-colors">
        <Search className="w-3.5 h-3.5" />
      </div>
    </Link>
  );
}

export function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#2A2424]/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20, x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, y: -20, x: "-50%" }}
            transition={{ duration: 0.2 }}
            className="fixed top-[10%] left-1/2 w-[90%] max-w-2xl bg-white rounded-3xl shadow-2xl z-[60] overflow-hidden border border-[#F4EAEB]"
          >
            <div className="flex flex-col h-full max-h-[80vh]">
              <InstantSearch searchClient={searchClient.searchClient} indexName="products">
                <Configure hitsPerPage={5} />
                
                <div className="flex items-center gap-3 p-4 border-b border-[#F4EAEB]">
                  <Search className="w-5 h-5 text-[#2A2424]/40 shrink-0 ml-2" />
                  <SearchBox
                    placeholder="Rechercher un produit, une marque, un besoin..."
                    classNames={{
                      root: "flex-1",
                      form: "relative flex items-center",
                      input: "w-full bg-transparent border-none outline-none text-lg text-[#2A2424] placeholder:text-[#2A2424]/30",
                      submit: "hidden",
                      reset: "hidden",
                    }}
                    autoFocus
                  />
                  <button
                    onClick={onClose}
                    className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-[#F4EAEB] text-[#2A2424] hover:bg-[#E5B6B9] hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-y-auto hide-scrollbar flex-1 bg-[#F8F5F2]/30">
                  <CustomHits onClose={onClose} />
                </div>
                
                <div className="p-3 bg-white border-t border-[#F4EAEB] flex items-center justify-between text-[10px] font-medium text-[#2A2424]/40">
                  <span>Recherche instantanée by Meilisearch</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-[#F4EAEB] text-[#2A2424]">esc</kbd> pour fermer
                  </div>
                </div>
              </InstantSearch>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CustomHits({ onClose }: { onClose: () => void }) {
  const { hits } = useHits();
  
  if (hits.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-[#2A2424]/50">
        Aucun résultat trouvé.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {hits.map((hit: any) => (
        <Hit key={hit.id || hit.objectID} hit={hit} onClose={onClose} />
      ))}
    </div>
  );
}
