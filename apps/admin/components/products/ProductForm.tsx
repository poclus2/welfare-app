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

  // All categories the product belongs to
  const initialCategoryIds = initialData?.categories?.map((c: any) => c.id) || [];
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(initialCategoryIds);

  const mainCategories = categories.filter(c => !c.parent_category_id);

  const [thumbnail, setThumbnail] = useState(initialData?.thumbnail || "");
  const [status, setStatus] = useState(initialData?.status || "draft");

  // New-product-only: price for the single default variant created on save.
  // No division needed — amounts are stored as full integers (e.g. 15000), not cents.
  const [newProductPrice, setNewProductPrice] = useState<string>("");
  const [newProductCurrency] = useState("xof");

  // Existing-product: one editable row per real variant — price (in whatever
  // currency that variant's price actually uses, never assumed) + per-store stock.
  type VariantRow = {
    id: string;
    title: string;
    currency: string;
    price: string;
    stockB1: string;
    stockB2: string;
    metadata: Record<string, any>;
  };
  const [variantRows, setVariantRows] = useState<VariantRow[]>(
    (initialData?.variants || []).map((v: any) => ({
      id: v.id,
      title: v.title || v.barcode || "Variante",
      currency: v.prices?.[0]?.currency_code || "xof",
      price: v.prices?.[0]?.amount != null ? String(v.prices[0].amount) : "",
      stockB1: v.metadata?.stock_b1 != null ? String(v.metadata.stock_b1) : "",
      stockB2: v.metadata?.stock_b2 != null ? String(v.metadata.stock_b2) : "",
      metadata: v.metadata || {},
    }))
  );

  const updateVariantRow = (id: string, patch: Partial<VariantRow>) => {
    setVariantRows(rows => rows.map(r => r.id === id ? { ...r, ...patch } : r));
  };

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
        categories: selectedCategoryIds.map(id => ({ id })),
        status,
        discountable: true,
        thumbnail,
        images: images.map(img => ({ url: img.url })),
      };

      if (initialData) {
        // Existing product: push price + per-store stock for every real variant.
        // stock_total is kept in sync here too — nothing in the backend recomputes
        // it, and the products list / low-stock KPI both read it as their fallback.
        payload.variants = variantRows.map(row => {
          const b1 = row.stockB1 === "" ? 0 : parseInt(row.stockB1, 10);
          const b2 = row.stockB2 === "" ? 0 : parseInt(row.stockB2, 10);
          return {
            id: row.id,
            prices: row.price ? [{ currency_code: row.currency, amount: parseInt(row.price, 10) }] : undefined,
            metadata: {
              ...row.metadata,
              stock_b1: b1,
              stock_b2: b2,
              stock_total: b1 + b2,
            },
          };
        });
      } else {
        // New product: create a single default variant so the price is actually saved
        // and the product is sellable (matches the convention used by the catalog import).
        payload.options = [{ title: "Default Option", values: ["Default Variant"] }];
        payload.variants = [{
          title: "Default Variant",
          manage_inventory: true,
          options: { "Default Option": "Default Variant" },
          prices: newProductPrice ? [{ currency_code: newProductCurrency, amount: parseInt(newProductPrice, 10) }] : [],
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

          {/* Price — new product: single default-variant price. Existing product: see
              the "Variantes & Stock" card below, where every real variant is editable. */}
          {!initialData && (
            <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
              <h2 className="text-sm font-bold text-[#2A2424] mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#C08A8E]" />
                Prix
              </h2>
              <div>
                <label className={labelClass}>Prix de vente ({newProductCurrency.toUpperCase()})</label>
                <div className="relative max-w-xs">
                  <input
                    type="number"
                    value={newProductPrice}
                    onChange={e => setNewProductPrice(e.target.value)}
                    placeholder="ex: 15000"
                    min="0"
                    className={inputClass + " pr-16"}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#2A2424]/40">
                    {newProductCurrency.toUpperCase()}
                  </span>
                </div>
                {newProductPrice && (
                  <p className="text-[11px] text-[#2A2424]/40 mt-1">
                    ≈ {new Intl.NumberFormat("fr-FR").format(parseInt(newProductPrice || "0"))} {newProductCurrency.toUpperCase()}
                  </p>
                )}
                <p className="text-[10px] text-[#2A2424]/30 mt-1">
                  Crée une variante par défaut avec ce prix. Vous pourrez ajouter d'autres variantes ensuite depuis cette page.
                </p>
              </div>
            </div>
          )}

          {/* Variantes & Stock — one editable row per real variant, each keeping its
              own currency (never assumed) and its per-store stock breakdown. */}
          {initialData && variantRows.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
              <h2 className="text-sm font-bold text-[#2A2424] mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#C08A8E]" />
                Variantes & Stock ({variantRows.length})
              </h2>
              <div className="space-y-3">
                {variantRows.map(row => (
                  <div key={row.id} className="border border-[#EDE0E0] rounded-xl p-3">
                    <p className="text-xs font-bold text-[#2A2424] mb-2">{row.title}</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={labelClass}>Prix ({row.currency.toUpperCase()})</label>
                        <input
                          type="number"
                          value={row.price}
                          onChange={e => updateVariantRow(row.id, { price: e.target.value })}
                          placeholder="ex: 15000"
                          min="0"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Stock Hippodrome</label>
                        <input
                          type="number"
                          value={row.stockB1}
                          onChange={e => updateVariantRow(row.id, { stockB1: e.target.value })}
                          placeholder="0"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Stock Playce</label>
                        <input
                          type="number"
                          value={row.stockB2}
                          onChange={e => updateVariantRow(row.id, { stockB2: e.target.value })}
                          placeholder="0"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#2A2424]/30 mt-3">
                Ajout/suppression de variantes non disponible depuis cette page pour l'instant — passez par l'admin Medusa pour changer le nombre de variantes.
              </p>
            </div>
          )}

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
              <div className="pt-2 border-t border-[#EDE0E0]">
                <label className={labelClass}>Catégories</label>
                <div className="max-h-64 overflow-y-auto border border-[#EDE0E0] rounded-xl p-3 space-y-4 bg-[#FDFBF7]">
                  {mainCategories.map(mainCat => {
                    const subs = categories.filter(c => c.parent_category_id === mainCat.id);
                    return (
                      <div key={mainCat.id} className="space-y-1.5">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={selectedCategoryIds.includes(mainCat.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedCategoryIds([...selectedCategoryIds, mainCat.id]);
                              else setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== mainCat.id));
                            }}
                            className="w-4 h-4 rounded border-[#EDE0E0] text-[#2A2424] focus:ring-[#2A2424]"
                          />
                          <span className="text-sm font-bold text-[#2A2424]">{mainCat.name}</span>
                        </label>
                        {subs.length > 0 && (
                          <div className="pl-6 space-y-1.5 border-l-2 border-[#EDE0E0] ml-2 mt-1.5">
                            {subs.map(sub => (
                              <label key={sub.id} className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                  type="checkbox" 
                                  checked={selectedCategoryIds.includes(sub.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedCategoryIds([...selectedCategoryIds, sub.id]);
                                    else setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== sub.id));
                                  }}
                                  className="w-3.5 h-3.5 rounded border-[#EDE0E0] text-[#2A2424] focus:ring-[#2A2424]"
                                />
                                <span className="text-xs text-[#2A2424]/80">{sub.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-[#2A2424]/40 mt-1">Vous pouvez sélectionner plusieurs catégories (ex: "Sérums" + "Face Care")</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </form>
  );
}
