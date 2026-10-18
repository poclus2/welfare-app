"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ROUTINE_FUNCTION_OPTIONS } from "@/lib/product-sheet";

type AIConfig = {
  mode: "top_stock" | "manual_selection";
  min_stock_threshold: number;
  max_routine_steps: number;
  manual_product_ids: string[];
  manual_products_by_step?: Record<string, string[]>;
  enforce_stock_filter: boolean;
};

type Product = {
  id: string;
  title: string;
  thumbnail: string | null;
  status: string;
  variants: { metadata?: { stock_total?: number } }[];
  metadata?: { routine_function?: string | null } | null;
};

function getStock(product: Product): number {
  return (
    product.variants?.reduce(
      (acc, v) => acc + (v.metadata?.stock_total || 0),
      0
    ) || 0
  );
}

// The steps of the manual catalogue, in the client's order (2026-10-18): the oil / balm make-up remover has
// its own step, apart from the water-based cleansers (evening double cleanse). The keys are stored in the
// config and read by the storefront as each product's category: never rename them, only the labels.
// A product goes in the step of its "fonction" (product form): an oil cleanser can't fill a cleanser's place.
const STEPS = [
  { key: "Démaquillant", label: "Démaquillant huileux", hint: "Huile ou baume démaquillant, eau micellaire, pads démaquillants", functions: ["demaquillant"] },
  { key: "Nettoyant", label: "Nettoyant aqueux", hint: "Gel, mousse, lait ou crème nettoyante", functions: ["nettoyant"] },
  { key: "Toner / Essence", label: "Toner / Essence", hint: "Toner, lotion, essence", functions: ["tonique", "essence"] },
  { key: "Sérum", label: "Sérum / Ampoule", hint: "Sérum, ampoule, soin ciblé", functions: ["serum", "traitement"] },
  { key: "Hydratant", label: "Crème hydratante", hint: "Crème, gel-crème, émulsion", functions: ["hydratant"] },
  { key: "Solaire", label: "Protection solaire", hint: "Crème, fluide ou stick SPF", functions: ["solaire"] },
] as const;
type StepKey = (typeof STEPS)[number]["key"];
const stepOf = (key: string) => STEPS.find((s) => s.key === key)!;
const FUNCTION_NAME: Record<string, string> = Object.fromEntries(ROUTINE_FUNCTION_OPTIONS.map((o) => [o.value, o.label]));
const functionOf = (p: Product) => p.metadata?.routine_function || "";
// the step a product belongs to, from its function (null: function not set, or not a routine step)
const stepForFunction = (fn: string): StepKey | null => STEPS.find((s) => (s.functions as readonly string[]).includes(fn))?.key ?? null;

// The configs saved before 2026-10-18 have no "Démaquillant" step and may hold removers among the cleansers:
// once the selected products are loaded, each one that belongs to another step by its function is moved there.
function sortSelectionByFunction(byStep: Record<string, string[]>, products: Record<string, Product>): { byStep: Record<string, string[]>; moved: string[] } {
  const next: Record<string, string[]> = Object.fromEntries(STEPS.map((s) => [s.key, [...(byStep[s.key] || [])]]));
  const moved: string[] = [];
  for (const s of STEPS) {
    for (const id of byStep[s.key] || []) {
      const p = products[id];
      const target = p ? stepForFunction(functionOf(p)) : null;
      if (!p || !target || target === s.key) continue;
      next[s.key] = next[s.key]!.filter((x) => x !== id);
      if (!next[target]!.includes(id)) next[target]!.push(id);
      moved.push(`${p.title} → ${stepOf(target).label}`);
    }
  }
  return { byStep: next, moved };
}

export function SkinCoachSettings({
  initialConfig,
  token,
}: {
  initialConfig: AIConfig;
  token: string;
}) {
  const [config, setConfig] = useState<AIConfig>(() => {
    // Migrate old config if missing manual_products_by_step
    const conf = { ...initialConfig };
    conf.manual_products_by_step = Object.fromEntries(STEPS.map((s) => [s.key, [...(initialConfig.manual_products_by_step?.[s.key] || [])]]));
    return conf;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // products moved to the step of their function when the page opened (saved with the next "Sauvegarder")
  const [moved, setMoved] = useState<string[]>([]);

  const [activeStep, setActiveStep] = useState<StepKey>(STEPS[0].key);
  const active = stepOf(activeStep);

  // Product search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  // Store all loaded products in a dictionary for quick lookup by ID
  const [loadedProductsDict, setLoadedProductsDict] = useState<Record<string, Product>>({});
  const [loadingSelected, setLoadingSelected] = useState(false);

  // Load initially selected products
  useEffect(() => {
    const allIds = new Set<string>();
    if (config.manual_product_ids) config.manual_product_ids.forEach(id => allIds.add(id));
    if (config.manual_products_by_step) {
      Object.values(config.manual_products_by_step).forEach(arr => arr.forEach(id => allIds.add(id)));
    }
    
    if (allIds.size === 0) return;
    setLoadingSelected(true);
    fetch(
      `/api/products?ids=${Array.from(allIds).join(",")}`,
      { headers: { "x-admin-token": token } }
    )
      .then((r) => r.json())
      .then((data) => {
        const dict: Record<string, Product> = {};
        (data.products || []).forEach((p: Product) => dict[p.id] = p);
        setLoadedProductsDict(dict);
        // the selection as saved (this runs once, when the page opens)
        const sorted = sortSelectionByFunction(config.manual_products_by_step || {}, dict);
        if (sorted.moved.length) {
          setMoved(sorted.moved);
          setConfig((c) => ({ ...c, manual_products_by_step: sorted.byStep }));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSelected(false));
  }, []); // eslint-disable-line

  // Search products debounced
  const searchProducts = useCallback(
    async (q: string) => {
      if (!q.trim()) { setSearchResults([]); return; }
      setSearchLoading(true);
      try {
        const url = `/api/products?q=${encodeURIComponent(q)}&limit=12`;
        const res = await fetch(url, { headers: { "x-admin-token": token } });
        const data = await res.json();
        setSearchResults(data.products || []);
        
        // Add to dictionary to ensure we have their data
        setLoadedProductsDict(prev => {
          const next = { ...prev };
          (data.products || []).forEach((p: Product) => next[p.id] = p);
          return next;
        });
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const t = setTimeout(() => searchProducts(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery, searchProducts]);

  // A product filed under another step by its function can't be added here (its function is changed in the
  // product form). A product without a function can, the team knows what it is.
  const wrongStep = (p: Product) => {
    const target = stepForFunction(functionOf(p));
    if (functionOf(p) && !target) return `Classé « ${FUNCTION_NAME[functionOf(p)] || functionOf(p)} » : pas une étape de routine`;
    return target && target !== activeStep ? `Classé « ${FUNCTION_NAME[functionOf(p)] || functionOf(p)} » : étape ${stepOf(target).label}` : null;
  };

  function toggleProduct(product: Product) {
    setConfig((c) => {
      const stepMap = { ...(c.manual_products_by_step || {}) };
      const arr = stepMap[activeStep] || [];
      const isSelected = arr.includes(product.id);
      
      if (isSelected) {
        stepMap[activeStep] = arr.filter(id => id !== product.id);
      } else {
        if (arr.length >= 10 || wrongStep(product)) return c; // max 10 per step, only products of this step
        stepMap[activeStep] = [...arr, product.id];
      }
      return { ...c, manual_products_by_step: stepMap };
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-config", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Erreur serveur");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const isManual = config.mode === "manual_selection";

  return (
    <div className="space-y-6">
      {/* Strategy toggle */}
      <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
        <h2 className="text-base font-bold text-[#2A2424] mb-1">
          Stratégie de recommandation
        </h2>
        <p className="text-sm text-[#2A2424]/40 mb-5">
          Choisissez comment l'IA sélectionne les produits à recommander lors d'un Skin Scan.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              value: "top_stock",
              label: "Top Stock",
              emoji: "📦",
              desc: "L'IA priorise automatiquement les produits avec le plus de stock disponible.",
            },
            {
              value: "manual_selection",
              label: "Sélection manuelle",
              emoji: "✋",
              desc: "Vous choisissez exactement les produits que l'IA peut recommander.",
            },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() =>
                setConfig((c) => ({
                  ...c,
                  mode: opt.value as AIConfig["mode"],
                }))
              }
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                config.mode === opt.value
                  ? "border-[#2A2424] bg-[#2A2424]/5"
                  : "border-[#EDE0E0] hover:border-[#2A2424]/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{opt.emoji}</span>
                <span className="text-sm font-bold text-[#2A2424]">
                  {opt.label}
                </span>
                {config.mode === opt.value && (
                  <span className="ml-auto text-xs font-bold bg-[#2A2424] text-white px-2 py-0.5 rounded-full">
                    Actif
                  </span>
                )}
              </div>
              <p className="text-xs text-[#2A2424]/50">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Stock settings */}
      <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
        <h2 className="text-base font-bold text-[#2A2424] mb-1">
          Paramètres de stock
        </h2>
        <p className="text-sm text-[#2A2424]/40 mb-5">
          Définissez les règles d'éligibilité d'un produit pour les recommandations IA.
        </p>
        <div className="space-y-5">
          {/* enforce stock filter */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#2A2424]">
                Filtre anti-rupture de stock
              </p>
              <p className="text-xs text-[#2A2424]/40">
                Exclure automatiquement les produits en rupture (stock = 0).
              </p>
            </div>
            <button
              onClick={() =>
                setConfig((c) => ({
                  ...c,
                  enforce_stock_filter: !c.enforce_stock_filter,
                }))
              }
              className={`relative w-12 h-6 rounded-full transition-colors ${
                config.enforce_stock_filter ? "bg-[#2A2424]" : "bg-[#EDE0E0]"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  config.enforce_stock_filter ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* min stock threshold */}
          <div>
            <div className="flex justify-between mb-2">
              <p className="text-sm font-semibold text-[#2A2424]">
                Seuil de stock minimum
              </p>
              <span className="text-sm font-bold text-[#C08A8E]">
                {config.min_stock_threshold} unité
                {config.min_stock_threshold > 1 ? "s" : ""}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              value={config.min_stock_threshold}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  min_stock_threshold: Number(e.target.value),
                }))
              }
              className="w-full accent-[#2A2424]"
            />
            <p className="text-xs text-[#2A2424]/40 mt-1">
              L'IA ignorera les produits dont le stock est inférieur à ce seuil.
            </p>
          </div>

          {/* max routine steps */}
          <div>
            <div className="flex justify-between mb-2">
              <p className="text-sm font-semibold text-[#2A2424]">
                Nombre max d'étapes de routine
              </p>
              <span className="text-sm font-bold text-[#C08A8E]">
                {config.max_routine_steps} étapes
              </span>
            </div>
            <input
              type="range"
              min={3}
              max={7}
              value={config.max_routine_steps}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  max_routine_steps: Number(e.target.value),
                }))
              }
              className="w-full accent-[#2A2424]"
            />
            <p className="text-xs text-[#2A2424]/40 mt-1">
              Plafond général. Le budget choisi fixe ensuite la routine : Essentiel 3 produits, Intermédiaire 4 (+ démaquillant si besoin et budget), Premium jusqu&apos;à 6. Réglez 6 pour permettre la routine Premium complète.
            </p>
          </div>
        </div>
      </div>

      {/* Manual selection */}
      {isManual && (
        <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-[#2A2424]">
              Catalogue personnalisé par étape
            </h2>
          </div>
          <p className="text-sm text-[#2A2424]/40 mb-5">
            Sélectionnez les produits que l'IA peut recommander pour chaque étape de la routine.
          </p>

          {/* Steps Tabs */}
          <div className="flex flex-wrap gap-2 mb-5 pb-2 border-b border-[#EDE0E0]">
            {STEPS.map((step, i) => (
              <button
                key={step.key}
                onClick={() => setActiveStep(step.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeStep === step.key
                    ? "bg-[#2A2424] text-white"
                    : "bg-[#F5F0EB] text-[#2A2424]/60 hover:text-[#2A2424]"
                }`}
              >
                {i + 1}. {step.label}
                <span className="ml-1 opacity-70">
                  ({(config.manual_products_by_step?.[step.key] || []).length})
                </span>
              </button>
            ))}
          </div>

          {moved.length > 0 && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <p className="font-bold mb-1">
                {moved.length} produit{moved.length > 1 ? "s" : ""} rangé{moved.length > 1 ? "s" : ""} dans l&apos;étape de sa fonction. Sauvegardez pour l&apos;enregistrer.
              </p>
              <ul className="list-disc pl-4 space-y-0.5">
                {moved.map((m) => <li key={m}>{m}</li>)}
              </ul>
            </div>
          )}

          <div className="mb-2 flex justify-between items-end">
            <div>
              <h3 className="text-sm font-bold text-[#2A2424]">Étape : {active.label}</h3>
              <p className="text-xs text-[#2A2424]/40">{active.hint}. Max 10 produits pour cette étape.</p>
            </div>
            <span className="text-xs font-bold bg-[#F5F0EB] text-[#2A2424] px-2.5 py-1 rounded-full">
              {(config.manual_products_by_step?.[activeStep] || []).length} / 10 produits
            </span>
          </div>

          {/* Selected products for active step */}
          {(config.manual_products_by_step?.[activeStep] || []).length > 0 && (
            <div className="mb-6 mt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(config.manual_products_by_step?.[activeStep] || []).map((pid) => {
                  const p = loadedProductsDict[pid];
                  if (!p) {
                    return (
                      <div key={pid} className="flex items-center gap-3 p-3 bg-white border border-[#EDE0E0] rounded-2xl animate-pulse shadow-sm">
                         <div className="w-12 h-12 bg-[#F5F0EB] rounded-xl shrink-0"></div>
                         <div className="flex-1 min-w-0">
                           <div className="h-3 bg-[#F5F0EB] rounded w-3/4 mb-2"></div>
                           <div className="h-2 bg-[#F5F0EB] rounded w-1/2"></div>
                         </div>
                         <button onClick={() => {
                           setConfig(c => {
                             const s = { ...(c.manual_products_by_step || {}) };
                             s[activeStep] = (s[activeStep] || []).filter(id => id !== pid);
                             return { ...c, manual_products_by_step: s };
                           });
                         }} className="p-2 text-[#2A2424]/30 hover:text-red-500">
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                         </button>
                      </div>
                    );
                  }
                  
                  const stock = getStock(p);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 bg-white border border-[#EDE0E0] hover:border-[#2A2424]/30 transition-colors rounded-2xl p-3 shadow-sm group"
                    >
                      {p.thumbnail ? (
                        <Image
                          src={p.thumbnail}
                          alt={p.title}
                          width={48}
                          height={48}
                          className="rounded-xl object-cover shrink-0 bg-[#F5F0EB] border border-[#EDE0E0]/50"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-[#F5F0EB] rounded-xl shrink-0 flex items-center justify-center text-[10px] text-[#2A2424]/40 font-semibold border border-[#EDE0E0]/50">Image</div>
                      )}
                      
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#2A2424] truncate" title={p.title}>
                          {p.title}
                        </p>
                        <p className={`text-[11px] mt-0.5 font-bold uppercase tracking-wider ${stock > 0 ? "text-green-600" : "text-red-500"}`}>
                          {stock > 0 ? `${stock} EN STOCK` : "RUPTURE"}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => toggleProduct(p)}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F5F0EB] text-[#2A2424]/40 hover:bg-red-100 hover:text-red-600 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shrink-0"
                        title="Retirer"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative mb-3 mt-3">
            <input
              type="text"
              placeholder={`Rechercher un produit pour l'étape ${active.label}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F5F0EB] border border-[#EDE0E0] rounded-xl text-sm text-[#2A2424] placeholder:text-[#2A2424]/30 outline-none focus:border-[#2A2424]/30"
            />
            {searchLoading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#2A2424]/30">
                ...
              </span>
            )}
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto">
              {searchResults.map((p) => {
                const stepArr = config.manual_products_by_step?.[activeStep] || [];
                const isSelected = stepArr.includes(p.id);
                const stock = getStock(p);
                const notHere = isSelected ? null : wrongStep(p);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleProduct(p)}
                    disabled={!isSelected && (stepArr.length >= 10 || !!notHere)}
                    title={notHere || undefined}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-[#2A2424] bg-[#2A2424]/5"
                        : "border-[#EDE0E0] hover:border-[#2A2424]/30 hover:bg-[#F5F0EB]"
                    } disabled:opacity-40`}
                  >
                    {p.thumbnail && (
                      <Image
                        src={p.thumbnail}
                        alt={p.title}
                        width={40}
                        height={40}
                        className="rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#2A2424] truncate">
                        {p.title}
                      </p>
                      <p
                        className={`text-xs mt-0.5 font-medium ${
                          stock > 0 ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {stock > 0 ? `Stock : ${stock}` : "Rupture de stock"}
                      </p>
                      {notHere ? (
                        <p className="text-[11px] mt-0.5 text-[#2A2424]/50">{notHere}</p>
                      ) : !functionOf(p) ? (
                        <p className="text-[11px] mt-0.5 text-amber-700">Fonction non renseignée dans la fiche produit</p>
                      ) : null}
                    </div>
                    <span className="text-lg shrink-0">
                      {isSelected ? "✓" : notHere ? "–" : "+"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {searchQuery && !searchLoading && searchResults.length === 0 && (
            <p className="text-sm text-[#2A2424]/40 text-center py-4">
              Aucun produit trouvé pour « {searchQuery} »
            </p>
          )}
        </div>
      )}

      {/* Prompt preview */}
      <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
        <h2 className="text-base font-bold text-[#2A2424] mb-1">
          Contexte IA généré
        </h2>
        <p className="text-sm text-[#2A2424]/40 mb-4">
          Voici la contrainte qui sera injectée dans le prompt du Skin Coach lors d'un scan.
        </p>
        <pre className="text-xs bg-[#F5F0EB] rounded-xl p-4 overflow-x-auto text-[#2A2424]/70 whitespace-pre-wrap leading-relaxed">
          {config.mode === "top_stock"
            ? `MODE : Top Stock (automatique)\nSeuil de stock minimum : ${config.min_stock_threshold} unité(s)\nFiltre anti-rupture : ${config.enforce_stock_filter ? "Activé ✓" : "Désactivé"}\nÉtapes max de routine : ${config.max_routine_steps}\n\n→ L'IA cherchera les produits les plus pertinents en stock,\n  triés par quantité décroissante.\n  Les produits en rupture seront exclus automatiquement.`
            : `MODE : Sélection manuelle par étape\n` + 
              STEPS.map(step => {
                const ids = config.manual_products_by_step?.[step.key] || [];
                if (ids.length === 0) return `[${step.label}] : Aucun produit`;
                return `[${step.label}] : \n` + ids.map(id => {
                  const p = loadedProductsDict[id];
                  return `  • ${p ? p.title : id} (stock: ${p ? getStock(p) : '?'})`;
                }).join('\n');
              }).join('\n\n') +
              `\n\nFiltre anti-rupture : ${config.enforce_stock_filter ? "Activé ✓" : "Désactivé"}\nÉtapes max de routine : ${config.max_routine_steps}\n\n→ L'IA ne pourra recommander QUE ces produits, triés par les catégories définies.`}
        </pre>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#2A2424] text-white rounded-xl text-sm font-bold hover:bg-black disabled:opacity-50 transition-colors shadow-sm"
        >
          {saving ? "Sauvegarde..." : "Sauvegarder la configuration"}
        </button>
        {saved && (
          <span className="text-sm font-medium text-green-600">
            ✓ Configuration sauvegardée !
          </span>
        )}
        {error && (
          <span className="text-sm font-medium text-red-500">
            ✗ {error}
          </span>
        )}
      </div>
    </div>
  );
}
