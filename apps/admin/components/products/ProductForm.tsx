"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, UploadCloud, X, Save, ImageIcon, Tag } from "lucide-react";

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-[#EDE0E0] text-sm text-[#2A2424] bg-[#FDFBF7] outline-none focus:border-[#C08A8E] focus:ring-2 focus:ring-[#F4EAEB] transition-all";
const labelClass = "block text-[11px] font-bold text-[#2A2424]/60 mb-1.5 uppercase tracking-widest";

export function ProductForm({ initialData, collections, categories = [] }: { initialData?: any, collections: any[], categories?: any[] }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(initialData?.title || "");
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [handle, setHandle] = useState(initialData?.handle || "");
  const [collectionId, setCollectionId] = useState(initialData?.collection_id || "");

  const initialCatId = initialData?.categories?.[0]?.id;
  const initialCat = categories.find(c => c.id === initialCatId);
  const [mainCategoryId, setMainCategoryId] = useState(initialCat?.parent_category_id || (initialCat ? initialCat.id : ""));
  const [subCategoryId, setSubCategoryId] = useState(initialCat?.parent_category_id ? initialCat.id : "");

  const mainCategories = categories.filter(c => !c.parent_category_id);
  const availableSubCategories = categories.filter(c => c.parent_category_id === mainCategoryId);

  const [thumbnail, setThumbnail] = useState(initialData?.thumbnail || "");
  const [status, setStatus] = useState(initialData?.status || "draft");

  // Price: read from first variant's first price (XOF, no division needed)
  const firstVariant = initialData?.variants?.[0];
  const firstPrice = firstVariant?.prices?.[0];
  const [price, setPrice] = useState<string>(firstPrice?.amount ? String(firstPrice.amount) : "");
  const [currency] = useState(firstPrice?.currency_code || "xof");

  // Images: thumbnail + secondary images
  const [images, setImages] = useState<{ url: string }[]>(initialData?.images || []);
  const [newImageUrl, setNewImageUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const payload: any = {
        title,
        subtitle,
        description,
        handle,
        collection_id: collectionId || null,
        categories: subCategoryId ? [{ id: subCategoryId }] : (mainCategoryId ? [{ id: mainCategoryId }] : []),
        status,
        discountable: true,
        thumbnail,
        images: images.map(img => ({ url: img.url })),
      };

      // Update price on first variant if changed
      if (price && firstVariant) {
        payload.variants = [{
          id: firstVariant.id,
          prices: [{ currency_code: currency, amount: parseInt(price, 10) }]
        }];
      }

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

          {/* General Info */}
          <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#2A2424] mb-4">Informations Générales</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Titre</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="ex: Sérum Hydratant COSRX" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Sous-titre</label>
                  <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="ex: 100ml" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Handle (URL)</label>
                  <input type="text" value={handle} onChange={e => setHandle(e.target.value)} placeholder="serum-hydratant-cosrx" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} placeholder="Description détaillée du produit..." className={inputClass} />
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#2A2424] mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#C08A8E]" />
              Prix
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Prix de vente ({currency.toUpperCase()})</label>
                <div className="relative">
                  <input
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="ex: 15000"
                    min="0"
                    className={inputClass + " pr-16"}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#2A2424]/40">
                    {currency.toUpperCase()}
                  </span>
                </div>
                {price && (
                  <p className="text-[11px] text-[#2A2424]/40 mt-1">
                    ≈ {new Intl.NumberFormat("fr-FR").format(parseInt(price || "0"))} {currency.toUpperCase()}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass}>Variante concernée</label>
                <div className={inputClass + " flex items-center text-[#2A2424]/50 cursor-not-allowed"}>
                  {firstVariant?.title || firstVariant?.barcode || "Variante par défaut"}
                </div>
                <p className="text-[10px] text-[#2A2424]/30 mt-1">Prix appliqué à la première variante</p>
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#2A2424] mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#C08A8E]" />
              Médias
            </h2>

            {/* Main Image Preview */}
            {thumbnail ? (
              <div className="mb-4">
                <label className={labelClass}>Image principale</label>
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-[#EDE0E0] bg-[#F5F0EB]">
                  <Image src={thumbnail} alt={title} fill className="object-contain" />
                  <button
                    type="button"
                    onClick={() => setThumbnail("")}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-4 border-2 border-dashed border-[#EDE0E0] rounded-xl p-8 flex flex-col items-center justify-center text-center bg-[#FDFBF7]">
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                  <UploadCloud className="w-5 h-5 text-[#2A2424]/40" />
                </div>
                <p className="text-sm font-bold text-[#2A2424]">Aucune image principale</p>
                <p className="text-xs text-[#2A2424]/40 mt-1">Renseignez une URL ci-dessous</p>
              </div>
            )}

            {/* Thumbnail URL input */}
            <div className="mb-4">
              <label className={labelClass}>URL Image principale</label>
              <input
                type="text"
                value={thumbnail}
                onChange={e => setThumbnail(e.target.value)}
                placeholder="https://..."
                className={inputClass}
              />
            </div>

            {/* Secondary images thumbnails */}
            <div className="mb-4">
              <label className={labelClass}>Images secondaires ({images.length})</label>
              
              {/* Input to add a new image */}
              <div className="flex items-center gap-2 mb-3 mt-1">
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  placeholder="URL d'une nouvelle image..."
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newImageUrl.trim()) {
                      setImages([...images, { url: newImageUrl.trim() }]);
                      setNewImageUrl("");
                    }
                  }}
                  className="px-4 py-2.5 bg-[#F5F0EB] hover:bg-[#EDE0E0] border border-[#EDE0E0] rounded-xl text-sm font-bold text-[#2A2424] transition-colors"
                >
                  Ajouter
                </button>
              </div>

              {images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {images.map((img, i) => (
                    <div
                      key={i}
                      className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#EDE0E0] bg-[#F5F0EB] flex-shrink-0 group"
                      title={img.url}
                    >
                      <Image src={img.url} alt={`Image ${i + 1}`} fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const newImgs = [...images];
                          newImgs.splice(i, 1);
                          setImages(newImgs);
                        }}
                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column - Status & Organization */}
        <div className="space-y-6">

          {/* Status */}
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

          {/* Organisation */}
          <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#2A2424] mb-4">Organisation</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Collection</label>
                <select value={collectionId} onChange={e => setCollectionId(e.target.value)} className={inputClass}>
                  <option value="">Aucune collection</option>
                  {collections.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Catégorie Principale</label>
                <select value={mainCategoryId} onChange={e => { setMainCategoryId(e.target.value); setSubCategoryId(""); }} className={inputClass}>
                  <option value="">Aucune catégorie</option>
                  {mainCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {availableSubCategories.length > 0 && (
                <div>
                  <label className={labelClass}>Sous-catégorie</label>
                  <select value={subCategoryId} onChange={e => setSubCategoryId(e.target.value)} className={inputClass}>
                    <option value="">Aucune sous-catégorie</option>
                    {availableSubCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Variants Info (read-only for now) */}
          {initialData?.variants && initialData.variants.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
              <h2 className="text-sm font-bold text-[#2A2424] mb-4">Variantes ({initialData.variants.length})</h2>
              <div className="space-y-2">
                {initialData.variants.slice(0, 5).map((v: any) => {
                  const vPrice = v.prices?.[0];
                  return (
                    <div key={v.id} className="flex items-center justify-between py-2 border-b border-[#EDE0E0] last:border-0">
                      <div>
                        <p className="text-xs font-semibold text-[#2A2424]">{v.title || v.barcode || "Défaut"}</p>
                        <p className="text-[10px] text-[#2A2424]/40">{v.barcode || "—"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-[#2A2424]">
                          {vPrice ? new Intl.NumberFormat("fr-FR").format(vPrice.amount) + " " + vPrice.currency_code.toUpperCase() : "—"}
                        </p>
                        <p className={`text-[10px] font-semibold ${v.inventory_quantity === 0 ? "text-red-400" : "text-[#2A2424]/40"}`}>
                          {v.inventory_quantity ?? "?"} en stock
                        </p>
                      </div>
                    </div>
                  );
                })}
                {initialData.variants.length > 5 && (
                  <p className="text-[10px] text-[#2A2424]/30 pt-1">+{initialData.variants.length - 5} autres variantes</p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </form>
  );
}
