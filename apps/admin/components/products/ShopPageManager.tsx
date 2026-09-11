"use client";

import { useState } from "react";
import { updateProductMetadata } from "@/app/dashboard/products/actions";
import { Package, Zap, Star, Search } from "lucide-react";
import Image from "next/image";

export function ShopPageManager({ products }: { products: any[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const toggleFlashSale = async (product: any) => {
    setLoading(product.id);
    try {
      const isFlash = product.metadata?.is_flash_sale;
      await updateProductMetadata(product.id, {
        ...product.metadata,
        is_flash_sale: !isFlash
      });
    } catch (e) {
      alert("Erreur de mise à jour");
    }
    setLoading(null);
  };

  const toggleBestseller = async (product: any) => {
    setLoading(product.id);
    try {
      const isBest = product.metadata?.is_bestseller;
      await updateProductMetadata(product.id, {
        ...product.metadata,
        is_bestseller: !isBest
      });
    } catch (e) {
      alert("Erreur de mise à jour");
    }
    setLoading(null);
  };

  const flashProducts = products.filter(p => p.metadata?.is_flash_sale);
  const bestProducts = products.filter(p => p.metadata?.is_bestseller);
  
  const filteredProducts = products.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.collection?.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Section Ventes Flash */}
        <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#2A2424]">Ventes Flash</h2>
              <p className="text-xs text-[#2A2424]/40">{flashProducts.length} produit(s) sélectionné(s)</p>
            </div>
          </div>
          <div className="space-y-3">
            {flashProducts.length === 0 && <p className="text-sm text-gray-400 italic">Aucun produit en vente flash.</p>}
            {flashProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 relative bg-white rounded-lg overflow-hidden border border-gray-100">
                    {p.thumbnail ? <Image src={p.thumbnail} alt={p.title} fill className="object-cover" /> : <Package className="w-4 h-4 m-auto mt-3 text-gray-300" />}
                  </div>
                  <p className="text-sm font-semibold text-[#2A2424] line-clamp-1">{p.title}</p>
                </div>
                <button 
                  disabled={loading === p.id}
                  onClick={() => toggleFlashSale(p)} 
                  className="text-xs font-bold text-red-500 hover:text-red-700 bg-white border border-red-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section Meilleures Ventes */}
        <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Star className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#2A2424]">Meilleures ventes</h2>
              <p className="text-xs text-[#2A2424]/40">{bestProducts.length} produit(s) sélectionné(s)</p>
            </div>
          </div>
          <div className="space-y-3">
            {bestProducts.length === 0 && <p className="text-sm text-gray-400 italic">Aucun produit en meilleures ventes.</p>}
            {bestProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 relative bg-white rounded-lg overflow-hidden border border-gray-100">
                    {p.thumbnail ? <Image src={p.thumbnail} alt={p.title} fill className="object-cover" /> : <Package className="w-4 h-4 m-auto mt-3 text-gray-300" />}
                  </div>
                  <p className="text-sm font-semibold text-[#2A2424] line-clamp-1">{p.title}</p>
                </div>
                <button 
                  disabled={loading === p.id}
                  onClick={() => toggleBestseller(p)} 
                  className="text-xs font-bold text-red-500 hover:text-red-700 bg-white border border-red-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Catalogue pour ajout */}
      <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#2A2424]">Tous les produits</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Rechercher un produit..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C08A8E]"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(p => {
            const isFlash = p.metadata?.is_flash_sale;
            const isBest = p.metadata?.is_bestseller;
            return (
              <div key={p.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                  <div className="w-10 h-10 shrink-0 relative bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                    {p.thumbnail ? <Image src={p.thumbnail} alt={p.title} fill className="object-cover" /> : <Package className="w-4 h-4 m-auto mt-3 text-gray-300" />}
                  </div>
                  <p className="text-sm font-semibold text-[#2A2424] truncate">{p.title}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    disabled={loading === p.id}
                    onClick={() => toggleFlashSale(p)}
                    title="Vente Flash"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isFlash ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                  <button 
                    disabled={loading === p.id}
                    onClick={() => toggleBestseller(p)}
                    title="Meilleures Ventes"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isBest ? 'bg-blue-100 text-blue-600' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
