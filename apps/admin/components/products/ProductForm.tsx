"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, UploadCloud, X, Save, ImageIcon, Tag, FlaskConical, Plus, Trash2, Sparkles } from "lucide-react";
import { AiSheetGenerator } from "./AiSheetGenerator";
import { BarcodeField, BarcodeStatus } from "./BarcodeField";
import { normalizeBarcode } from "@/lib/barcode";
import {
  AiProductSheet,
  LayeringStep,
  SKIN_CONCERN_OPTIONS,
  SKIN_TYPE_OPTIONS,
  STEP_ICONS,
  STEP_ICON_LABELS,
} from "@/lib/product-sheet";

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-[#EDE0E0] text-sm text-[#2A2424] bg-[#FDFBF7] outline-none focus:border-[#C08A8E] focus:ring-2 focus:ring-[#F4EAEB] transition-all";
const labelClass = "block text-[11px] font-bold text-[#2A2424]/60 mb-1.5 uppercase tracking-widest";

// Marks a field the AI filled and the admin has not touched since
function AiBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#F4EAEB] text-[#A0646A] text-[9px] font-bold normal-case tracking-normal align-middle">
      <Sparkles className="w-2.5 h-2.5" /> IA · à vérifier
    </span>
  );
}

function ChipPicker({ options, value, onChange }: { options: readonly string[]; value: string[]; onChange: (v: string[]) => void }) {
  // Values saved before the fixed lists existed stay visible (and removable)
  const all = [...options, ...value.filter((v) => !options.includes(v))];
  return (
    <div className="flex flex-wrap gap-1.5">
      {all.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(on ? value.filter((v) => v !== o) : [...value, o])}
            className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${on ? "bg-[#2A2424] text-white border-[#2A2424]" : "bg-white text-[#2A2424]/70 border-[#EDE0E0] hover:border-[#C08A8E]"}`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function ProductForm({ initialData, collections, categories = [], returnTo = "/dashboard/products" }: { initialData?: any, collections: any[], categories?: any[], returnTo?: string }) {
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
  // The store sells in a single XAF region (Cameroon): an XOF price makes the variant unsellable
  // (add-to-cart fails with "calculated_amount" undefined).
  const [newProductCurrency] = useState("xaf");

  // Barcode = the link to Odoo (the stock sync finds variants by barcode). Required on creation unless
  // the admin states the product has none (coffret, échantillon...).
  const [newBarcode, setNewBarcode] = useState("");
  // Initial per-shop stock of the new product (the API aligns the Medusa inventory levels on it)
  const [newStockB1, setNewStockB1] = useState("");
  const [newStockB2, setNewStockB2] = useState("");
  const [noBarcode, setNoBarcode] = useState(false);
  const [barcodeStatus, setBarcodeStatus] = useState<Record<string, BarcodeStatus>>({});
  const setStatusFor = (key: string) => (st: BarcodeStatus) => setBarcodeStatus(prev => ({ ...prev, [key]: st }));

  // Existing-product: one editable row per real variant — price (in whatever
  // currency that variant's price actually uses, never assumed) + per-store stock.
  type VariantRow = {
    id: string;
    title: string;
    currency: string;
    price: string;
    stockB1: string;
    stockB2: string;
    barcode: string;
    initialBarcode: string;
    metadata: Record<string, any>;
  };
  const [variantRows, setVariantRows] = useState<VariantRow[]>(
    (initialData?.variants || []).map((v: any) => ({
      id: v.id,
      title: v.title || v.barcode || "Variante",
      currency: v.prices?.[0]?.currency_code || "xaf",
      price: v.prices?.[0]?.amount != null ? String(v.prices[0].amount) : "",
      stockB1: v.metadata?.stock_b1 != null ? String(v.metadata.stock_b1) : "",
      stockB2: v.metadata?.stock_b2 != null ? String(v.metadata.stock_b2) : "",
      barcode: v.barcode || "",
      initialBarcode: v.barcode || "",
      metadata: v.metadata || {},
    }))
  );

  const updateVariantRow = (id: string, patch: Partial<VariantRow>) => {
    setVariantRows(rows => rows.map(r => r.id === id ? { ...r, ...patch } : r));
  };

  // Fiche beauté (product.metadata): read by the product page, the Skin Coach and the shop filters
  const meta = initialData?.metadata || {};
  const [rawInci, setRawInci] = useState<string>(meta.raw_inci || "");
  const [inciMarkdown, setInciMarkdown] = useState<string>(meta.inci_markdown || "");
  const [skinTypes, setSkinTypes] = useState<string[]>(Array.isArray(meta.skin_types) ? meta.skin_types : []);
  const [skinConcerns, setSkinConcerns] = useState<string[]>(Array.isArray(meta.skin_concerns) ? meta.skin_concerns : []);
  const [searchTagline, setSearchTagline] = useState<string>(meta.search_tagline || "");
  const [commercialDescription, setCommercialDescription] = useState<string>(meta.commercial_description || "");
  const [layeringSteps, setLayeringSteps] = useState<LayeringStep[]>(Array.isArray(meta.layering_steps) ? meta.layering_steps : []);

  // CosIng check of the INCI list: names to compare against the label (server-side list, debounced)
  const [inciCheck, setInciCheck] = useState<{ total: number; unknown: string[] } | null>(null);
  useEffect(() => {
    if (!rawInci.trim()) { setInciCheck(null); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/products/inci-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inci: rawInci }),
        });
        if (res.ok && !cancelled) setInciCheck(await res.json());
      } catch {
        // A hint only: the form works without it
      }
    }, 600);
    return () => { cancelled = true; clearTimeout(t); };
  }, [rawInci]);

  // AI sheet: fields it filled (badge until edited), the model that wrote them, and the values it replaced (undo)
  const [aiFields, setAiFields] = useState<Set<string>>(new Set());
  const [aiModel, setAiModel] = useState<string | null>(null);
  const [beforeAi, setBeforeAi] = useState<any>(null);
  const touched = (key: string) => {
    if (aiFields.has(key)) setAiFields((prev) => { const n = new Set(prev); n.delete(key); return n; });
  };
  const ai = (key: string) => aiFields.has(key);

  const snapshot = () => ({
    title, subtitle, handle, description, collectionId, selectedCategoryIds,
    rawInci, inciMarkdown, skinTypes, skinConcerns, searchTagline, commercialDescription, layeringSteps,
  });
  const restore = (v: ReturnType<typeof snapshot>) => {
    setTitle(v.title); setSubtitle(v.subtitle); setHandle(v.handle); setDescription(v.description);
    setCollectionId(v.collectionId); setSelectedCategoryIds(v.selectedCategoryIds);
    setRawInci(v.rawInci); setInciMarkdown(v.inciMarkdown); setSkinTypes(v.skinTypes); setSkinConcerns(v.skinConcerns);
    setSearchTagline(v.searchTagline); setCommercialDescription(v.commercialDescription); setLayeringSteps(v.layeringSteps);
  };

  const applyAiSheet = (sheet: AiProductSheet) => {
    // Keep the very first state so "Annuler" goes back to what the admin had, even after a regeneration
    if (!beforeAi) setBeforeAi(snapshot());
    const filled: string[] = [];
    const set = <T,>(key: string, value: T, setter: (v: T) => void, isEmpty: boolean) => {
      if (isEmpty) return;
      setter(value);
      filled.push(key);
    };
    set("title", sheet.title, setTitle, !sheet.title);
    set("subtitle", sheet.subtitle, setSubtitle, !sheet.subtitle);
    // An existing product keeps its URL: changing the handle would break links already shared
    if (!initialData) set("handle", sheet.handle, setHandle, !sheet.handle);
    set("description", sheet.description, setDescription, !sheet.description);
    set("collection", sheet.collection_id || "", setCollectionId, !sheet.collection_id);
    set("categories", sheet.category_ids, setSelectedCategoryIds, !sheet.category_ids.length);
    set("raw_inci", sheet.raw_inci, setRawInci, !sheet.raw_inci);
    set("inci_markdown", sheet.inci_markdown, setInciMarkdown, !sheet.inci_markdown);
    set("skin_types", sheet.skin_types, setSkinTypes, !sheet.skin_types.length);
    set("skin_concerns", sheet.skin_concerns, setSkinConcerns, !sheet.skin_concerns.length);
    set("search_tagline", sheet.search_tagline, setSearchTagline, !sheet.search_tagline);
    set("commercial_description", sheet.commercial_description, setCommercialDescription, !sheet.commercial_description);
    set("layering_steps", sheet.layering_steps, setLayeringSteps, !sheet.layering_steps.length);
    setAiFields(new Set(filled));
    setAiModel(sheet.model);
  };

  const undoAiSheet = () => {
    if (beforeAi) restore(beforeAi);
    setBeforeAi(null);
    setAiFields(new Set());
    setAiModel(null);
  };

  const updateStep = (i: number, patch: Partial<LayeringStep>) => {
    touched("layering_steps");
    setLayeringSteps((steps) => steps.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  };
  const renumber = (steps: LayeringStep[]) => steps.map((s, i) => ({ ...s, step: i + 1 }));

  // Images: thumbnail + secondary images
  const [images, setImages] = useState<{ url: string }[]>(initialData?.images || []);
  const [newImageUrl, setNewImageUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Barcode checks: a wrong digit or a barcode already used elsewhere would silently break the Odoo
    // stock sync for this product (or the other one), so they block saving.
    const barcodeProblem = (key: string, name: string) => {
      const st = barcodeStatus[key];
      if (!st) return null;
      if (st.check === "bad_checksum") return `${name} : la clé de contrôle du code-barres est incorrecte.`;
      if (st.duplicates.length) return `${name} : ce code-barres est déjà utilisé par « ${st.duplicates[0].product_title} ».`;
      return null;
    };
    const problems: string[] = [];
    if (!initialData) {
      if (!noBarcode && !normalizeBarcode(newBarcode)) problems.push("Scannez ou saisissez le code-barres, ou cochez « Ce produit n'a pas de code-barres ».");
      if (!noBarcode) { const p = barcodeProblem("new", "Code-barres"); if (p) problems.push(p); }
    } else {
      for (const row of variantRows) {
        if (normalizeBarcode(row.barcode) === normalizeBarcode(row.initialBarcode)) continue;
        const p = barcodeProblem(row.id, row.title);
        if (p) problems.push(p);
      }
    }
    if (problems.length) {
      setError(problems.join(" "));
      return;
    }
    setIsLoading(true);

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

      // Fiche beauté. The whole metadata object is sent (existing keys kept) so this works whether
      // Medusa merges or replaces it. A new product only gets the keys that were actually filled.
      const beauty: Record<string, any> = {
        raw_inci: rawInci.trim(),
        inci_markdown: inciMarkdown.trim(),
        skin_types: skinTypes,
        skin_concerns: skinConcerns,
        search_tagline: searchTagline.trim(),
        commercial_description: commercialDescription.trim(),
        layering_steps: renumber(layeringSteps.filter(s => s.label.trim())),
      };
      const metadata: Record<string, any> = { ...(initialData?.metadata || {}) };
      for (const [k, v] of Object.entries(beauty)) {
        const empty = Array.isArray(v) ? v.length === 0 : v === "";
        if (!empty || initialData) metadata[k] = v;
      }
      if (aiModel) {
        metadata.enriched_by = aiModel;
        metadata.enriched_at = new Date().toISOString();
      }
      payload.metadata = metadata;

      if (initialData) {
        // Existing product: push price + per-store stock for every real variant.
        // stock_total is kept in sync here too — nothing in the backend recomputes
        // it, and the products list / low-stock KPI both read it as their fallback.
        payload.variants = variantRows.map(row => {
          const b1 = row.stockB1 === "" ? 0 : parseInt(row.stockB1, 10);
          const b2 = row.stockB2 === "" ? 0 : parseInt(row.stockB2, 10);
          const barcode = normalizeBarcode(row.barcode);
          return {
            id: row.id,
            prices: row.price ? [{ currency_code: row.currency, amount: parseInt(row.price, 10) }] : undefined,
            ...(barcode !== normalizeBarcode(row.initialBarcode) ? { barcode: barcode || null } : {}),
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
          ...(!noBarcode && normalizeBarcode(newBarcode) ? { barcode: normalizeBarcode(newBarcode) } : {}),
          metadata: (() => {
            const b1 = Math.max(0, parseInt(newStockB1 || "0", 10) || 0);
            const b2 = Math.max(0, parseInt(newStockB2 || "0", 10) || 0);
            return { stock_b1: b1, stock_b2: b2, stock_total: b1 + b2 };
          })(),
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

      router.push(returnTo);
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
            onClick={() => router.push(returnTo)}
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

      <AiSheetGenerator
        collections={collections}
        categories={categories}
        onApply={applyAiSheet}
        onUndo={undoAiSheet}
        canUndo={!!beforeAi}
        isEdit={!!initialData}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">

          {/* General Info */}
          <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#2A2424] mb-4">Informations Générales</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Titre<AiBadge show={ai("title")} /></label>
                <input type="text" value={title} onChange={e => { setTitle(e.target.value); touched("title"); }} required placeholder="ex: Sérum Hydratant COSRX" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Sous-titre<AiBadge show={ai("subtitle")} /></label>
                  <input type="text" value={subtitle} onChange={e => { setSubtitle(e.target.value); touched("subtitle"); }} placeholder="ex: 100ml" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Handle (URL)<AiBadge show={ai("handle")} /></label>
                  <input type="text" value={handle} onChange={e => { setHandle(e.target.value); touched("handle"); }} placeholder="serum-hydratant-cosrx" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Description<AiBadge show={ai("description")} /></label>
                <textarea value={description} onChange={e => { setDescription(e.target.value); touched("description"); }} rows={5} placeholder="Description détaillée du produit..." className={inputClass} />
              </div>
            </div>
          </div>

          {/* Price — new product: single default-variant price. Existing product: see
              the "Variantes & Stock" card below, where every real variant is editable. */}
          {!initialData && (
            <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
              <h2 className="text-sm font-bold text-[#2A2424] mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#C08A8E]" />
                Prix, stock & code-barres
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
              <div className="grid grid-cols-2 gap-3 mt-5">
                <div>
                  <label className={labelClass}>Stock Hippodrome</label>
                  <input type="number" min="0" value={newStockB1} onChange={e => setNewStockB1(e.target.value)} placeholder="0" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Stock Playce</label>
                  <input type="number" min="0" value={newStockB2} onChange={e => setNewStockB2(e.target.value)} placeholder="0" className={inputClass} />
                </div>
              </div>
              <p className="text-[10px] text-[#2A2424]/40 mt-1">Si le produit est dans Odoo, la synchro remplacera ce stock par celui des boutiques.</p>
              <div className="mt-5 pt-5 border-t border-[#EDE0E0]">
                {!noBarcode && (
                  <BarcodeField
                    value={newBarcode}
                    onChange={setNewBarcode}
                    onStatus={setStatusFor("new")}
                    inputClass={inputClass}
                    labelClass={labelClass}
                  />
                )}
                <label className="flex items-center gap-2 mt-2 text-xs text-[#2A2424]/60 cursor-pointer">
                  <input type="checkbox" checked={noBarcode} onChange={e => setNoBarcode(e.target.checked)} />
                  Ce produit n&apos;a pas de code-barres (coffret, échantillon…)
                </label>
                <p className="text-[10px] text-[#2A2424]/40 mt-1">
                  {noBarcode
                    ? "Sans code-barres, le stock ne sera jamais synchronisé depuis Odoo : il faudra le saisir à la main."
                    : "Le même code-barres doit exister dans Odoo (Hippodrome / Playce) pour que le stock se synchronise."}
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
                    <div className="mt-3">
                      <BarcodeField
                        value={row.barcode}
                        onChange={v => updateVariantRow(row.id, { barcode: v })}
                        onStatus={setStatusFor(row.id)}
                        excludeVariantId={row.id}
                        compact
                        inputClass={inputClass}
                        labelClass={labelClass}
                      />
                      {!row.barcode && (
                        <p className="text-[10px] text-amber-700 mt-1">Sans code-barres, cette variante ne reçoit pas le stock d&apos;Odoo.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#2A2424]/30 mt-3">
                Ajout/suppression de variantes non disponible depuis cette page pour l'instant — passez par l'admin Medusa pour changer le nombre de variantes.
              </p>
            </div>
          )}

          {/* Fiche beauté — product.metadata used by the product page, Skin Coach and shop filters */}
          <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#2A2424] mb-4 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-[#C08A8E]" />
              Fiche beauté
            </h2>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Liste INCI complète<AiBadge show={ai("raw_inci")} /></label>
                <textarea value={rawInci} onChange={e => { setRawInci(e.target.value); touched("raw_inci"); }} rows={4} placeholder="Aqua, Glycerin, Niacinamide, ..." className={inputClass + " font-mono text-xs"} />
                {inciCheck && inciCheck.total > 0 && (
                  inciCheck.unknown.length === 0 ? (
                    <p className="text-[11px] text-emerald-700 mt-1">✓ {inciCheck.total} ingrédients, tous reconnus dans CosIng (base européenne)</p>
                  ) : (
                    <div className="mt-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                      <p className="text-[11px] font-bold text-amber-800">
                        {inciCheck.unknown.length} nom{inciCheck.unknown.length > 1 ? "s" : ""} sur {inciCheck.total} absent{inciCheck.unknown.length > 1 ? "s" : ""} de CosIng : comparez-les à l&apos;étiquette
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {inciCheck.unknown.map(u => (
                          <span key={u} className="px-2 py-0.5 rounded-full bg-white border border-amber-300 text-[11px] text-amber-900 font-mono">{u}</span>
                        ))}
                      </div>
                      <p className="text-[10px] text-amber-700/80 mt-1.5">Faute de lecture, nom traduit en français ou ingrédient très récent : la liste INCI s&apos;écrit avec les noms officiels (Glycerin, pas Glycérine).</p>
                    </div>
                  )
                )}
                <p className="text-[10px] text-[#2A2424]/40 mt-1">Comparez-la à l'étiquette mot à mot : elle sert aussi à détecter les ingrédients dans les filtres de la boutique.</p>
              </div>
              <div>
                <label className={labelClass}>Types de peau<AiBadge show={ai("skin_types")} /></label>
                <ChipPicker options={SKIN_TYPE_OPTIONS} value={skinTypes} onChange={v => { setSkinTypes(v); touched("skin_types"); }} />
              </div>
              <div>
                <label className={labelClass}>Préoccupations<AiBadge show={ai("skin_concerns")} /></label>
                <ChipPicker options={SKIN_CONCERN_OPTIONS} value={skinConcerns} onChange={v => { setSkinConcerns(v); touched("skin_concerns"); }} />
              </div>
              <div>
                <label className={labelClass}>Accroche (recherche)<AiBadge show={ai("search_tagline")} /></label>
                <input type="text" value={searchTagline} onChange={e => { setSearchTagline(e.target.value); touched("search_tagline"); }} placeholder="ex: Toner Équilibrant & Hydratant" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Description commerciale<AiBadge show={ai("commercial_description")} /></label>
                <textarea value={commercialDescription} onChange={e => { setCommercialDescription(e.target.value); touched("commercial_description"); }} rows={4} placeholder="3 à 4 phrases affichées sur la page produit" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Ingrédients clés (markdown)<AiBadge show={ai("inci_markdown")} /></label>
                <textarea value={inciMarkdown} onChange={e => { setInciMarkdown(e.target.value); touched("inci_markdown"); }} rows={5} placeholder={"### Ingrédients clés\n- **Niacinamide** : ..."} className={inputClass + " font-mono text-xs"} />
              </div>
              <div>
                <label className={labelClass}>Routine d'utilisation ({layeringSteps.length} étapes)<AiBadge show={ai("layering_steps")} /></label>
                <div className="space-y-2">
                  {layeringSteps.map((s, i) => (
                    <div key={i} className={`border rounded-xl p-3 space-y-2 ${s.highlight ? "border-[#C08A8E] bg-[#FBF3F3]" : "border-[#EDE0E0]"}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[#2A2424]/40 w-5">{i + 1}.</span>
                        <input type="text" value={s.label} onChange={e => updateStep(i, { label: e.target.value })} placeholder="Étape (ex: Toner)" className={inputClass + " flex-1 min-w-[120px] !py-1.5"} />
                        <select value={s.timing} onChange={e => updateStep(i, { timing: e.target.value })} className={inputClass + " !w-auto !py-1.5"}>
                          {["Matin & Soir", "Matin", "Soir"].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select value={s.icon} onChange={e => updateStep(i, { icon: e.target.value as LayeringStep["icon"] })} className={inputClass + " !w-auto !py-1.5"}>
                          {STEP_ICONS.map(ic => <option key={ic} value={ic}>{STEP_ICON_LABELS[ic]}</option>)}
                        </select>
                        <label className="flex items-center gap-1 text-[11px] text-[#2A2424]/60 cursor-pointer">
                          <input type="checkbox" checked={!!s.highlight} onChange={e => updateStep(i, { highlight: e.target.checked })} /> Ce produit
                        </label>
                        <button type="button" onClick={() => { touched("layering_steps"); setLayeringSteps(steps => renumber(steps.filter((_, j) => j !== i))); }} className="p-1.5 text-[#2A2424]/40 hover:text-red-600" aria-label="Supprimer l'étape">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input type="text" value={s.description} onChange={e => updateStep(i, { description: e.target.value })} placeholder="Description de l'étape" className={inputClass + " !py-1.5"} />
                      <input type="text" value={s.tip} onChange={e => updateStep(i, { tip: e.target.value })} placeholder="Astuce courte" className={inputClass + " !py-1.5"} />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => { touched("layering_steps"); setLayeringSteps(steps => renumber([...steps, { step: steps.length + 1, label: "", timing: "Matin & Soir", description: "", tip: "", icon: "star", highlight: false }])); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-dashed border-[#EDE0E0] text-[#2A2424]/60 hover:text-[#2A2424] hover:border-[#C08A8E]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter une étape
                  </button>
                </div>
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
                <label className={labelClass}>Collection<AiBadge show={ai("collection")} /></label>
                <select value={collectionId} onChange={e => { setCollectionId(e.target.value); touched("collection"); }} className={inputClass}>
                  <option value="">Aucune collection</option>
                  {collections.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="pt-2 border-t border-[#EDE0E0]">
                <label className={labelClass}>Catégories<AiBadge show={ai("categories")} /></label>
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
                              touched("categories");
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
                                    touched("categories");
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
