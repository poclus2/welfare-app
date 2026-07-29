"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, UploadCloud, X, Plus, Save } from "lucide-react";

export function ProductForm({ initialData, collections, categories = [] }: { initialData?: any, collections: any[], categories?: any[] }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(initialData?.title || "");
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [handle, setHandle] = useState(initialData?.handle || "");
  const [collectionId, setCollectionId] = useState(initialData?.collection_id || "");
  const [categoryId, setCategoryId] = useState(initialData?.categories?.[0]?.id || "");
  const [thumbnail, setThumbnail] = useState(initialData?.thumbnail || "");
  const [status, setStatus] = useState(initialData?.status || "draft");

  // In a real app we'd manage variants and multiple images here
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const payload = {
        title,
        subtitle,
        description,
        handle,
        collection_id: collectionId || null,
        categories: categoryId ? [{ id: categoryId }] : [],
        status,
        is_giftcard: false,
        discountable: true,
        thumbnail,
      };

      const url = initialData ? `/api/products/${initialData.id}` : "/api/products";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur lors de l'enregistrement");
      }

      router.push("/dashboard/products");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6 pb-20">
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2A2424]" style={{ letterSpacing: "-0.02em" }}>
            {initialData ? "Éditer le produit" : "Nouveau produit"}
          </h1>
          <p className="text-sm text-[#2A2424]/40 mt-0.5">Renseignez les détails du produit</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-white border border-[#EDE0E0] rounded-xl text-sm font-semibold text-[#2A2424]/60 hover:text-[#2A2424] transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[#2A2424] text-white rounded-xl text-sm font-bold hover:bg-black transition-colors disabled:opacity-60 shadow-sm"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#2A2424] mb-4">Informations Générales</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#2A2424]/60 mb-1.5 uppercase tracking-widest">Titre</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="ex: Sérum Hydratant COSRX"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EDE0E0] text-sm text-[#2A2424] bg-[#FDFBF7] outline-none focus:border-[#C08A8E] focus:ring-2 focus:ring-[#F4EAEB]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#2A2424]/60 mb-1.5 uppercase tracking-widest">Sous-titre</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="ex: 100ml"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EDE0E0] text-sm text-[#2A2424] bg-[#FDFBF7] outline-none focus:border-[#C08A8E] focus:ring-2 focus:ring-[#F4EAEB]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#2A2424]/60 mb-1.5 uppercase tracking-widest">Handle (URL)</label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="serum-hydratant-cosrx"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EDE0E0] text-sm text-[#2A2424] bg-[#FDFBF7] outline-none focus:border-[#C08A8E] focus:ring-2 focus:ring-[#F4EAEB]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#2A2424]/60 mb-1.5 uppercase tracking-widest">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Description détaillée du produit..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EDE0E0] text-sm text-[#2A2424] bg-[#FDFBF7] outline-none focus:border-[#C08A8E] focus:ring-2 focus:ring-[#F4EAEB]"
                />
              </div>
            </div>
          </div>

          {/* Media (Placeholder) */}
          <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#2A2424] mb-4">Média</h2>
            <div className="border-2 border-dashed border-[#EDE0E0] rounded-xl p-8 flex flex-col items-center justify-center text-center bg-[#FDFBF7] cursor-pointer hover:bg-[#F5F0EB] transition-colors">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                <UploadCloud className="w-5 h-5 text-[#2A2424]/40" />
              </div>
              <p className="text-sm font-bold text-[#2A2424]">Cliquez pour uploader</p>
              <p className="text-xs text-[#2A2424]/40 mt-1">PNG, JPG, GIF jusqu'à 10MB</p>
            </div>
            {thumbnail && (
              <div className="mt-4">
                <label className="block text-[11px] font-bold text-[#2A2424]/60 mb-1.5 uppercase tracking-widest">URL de l'image (temporaire)</label>
                <input
                  type="text"
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EDE0E0] text-sm text-[#2A2424] bg-[#FDFBF7] outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Status & Organization */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#2A2424] mb-4">Statut</h2>
            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${status === "published" ? "border-emerald-500 bg-emerald-50" : "border-[#EDE0E0] hover:bg-[#F5F0EB]"}`}>
                <input type="radio" name="status" value="published" checked={status === "published"} onChange={() => setStatus("published")} className="hidden" />
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${status === "published" ? "border-emerald-500" : "border-[#2A2424]/30"}`}>
                  {status === "published" && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#2A2424]">Publié</p>
                  <p className="text-[10px] text-[#2A2424]/50">Visible sur le site</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${status === "draft" ? "border-amber-500 bg-amber-50" : "border-[#EDE0E0] hover:bg-[#F5F0EB]"}`}>
                <input type="radio" name="status" value="draft" checked={status === "draft"} onChange={() => setStatus("draft")} className="hidden" />
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${status === "draft" ? "border-amber-500" : "border-[#2A2424]/30"}`}>
                  {status === "draft" && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#2A2424]">Brouillon</p>
                  <p className="text-[10px] text-[#2A2424]/50">Caché du site</p>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#2A2424] mb-4">Organisation</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#2A2424]/60 mb-1.5 uppercase tracking-widest">Collection</label>
                <select
                  value={collectionId}
                  onChange={(e) => setCollectionId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EDE0E0] text-sm text-[#2A2424] bg-[#FDFBF7] outline-none focus:border-[#C08A8E] focus:ring-2 focus:ring-[#F4EAEB]"
                >
                  <option value="">Aucune collection</option>
                  {collections.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#2A2424]/60 mb-1.5 uppercase tracking-widest">Catégorie</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EDE0E0] text-sm text-[#2A2424] bg-[#FDFBF7] outline-none focus:border-[#C08A8E] focus:ring-2 focus:ring-[#F4EAEB]"
                >
                  <option value="">Aucune catégorie</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
