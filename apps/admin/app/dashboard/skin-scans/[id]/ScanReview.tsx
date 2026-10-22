"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, Replace, Trash2, Plus, Search, Loader2 } from "lucide-react";

// Pilot phase: a skin advisor validates the Skin Coach routine or corrects it, one reason per change.
// The customer then sees the reviewed routine in her account; the corrections are kept to study the
// Skin Coach's recurring mistakes.

type Step = {
  step_number: number;
  step_name: string;
  explanation_for_client?: string;
  medusa_product_id: string | null;
  product_name: string;
};
type Correction = { step_name: string; from: string; to: string; reason: string };
type Product = { id: string; title: string; thumbnail: string | null };

// what is being edited: replacing step i, or adding a step
type Editing = { kind: "replace"; index: number } | { kind: "remove"; index: number } | { kind: "add" } | null;

export function ScanReview({
  scanId,
  routine,
  reviewedRoutine,
  reviewStatus,
  corrections: savedCorrections,
  reviewedBy,
  reviewedAt,
}: {
  scanId: string;
  routine: Step[];
  reviewedRoutine?: Step[] | null;
  reviewStatus?: string | null;
  corrections?: Correction[] | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
}) {
  const router = useRouter();
  const [steps, setSteps] = useState<Step[]>(() => (reviewedRoutine?.length ? reviewedRoutine : routine).map((s) => ({ ...s })));
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [editing, setEditing] = useState<Editing>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<Product | null>(null);
  const [stepName, setStepName] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEditing(null);
    setQuery("");
    setResults([]);
    setPicked(null);
    setStepName("");
    setReason("");
  };

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/products?q=${encodeURIComponent(query.trim())}&limit=8`);
      const data = await res.json();
      setResults(data.products || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const apply = () => {
    if (!editing || !reason.trim()) return;
    const why = reason.trim();
    if (editing.kind === "remove") {
      const step = steps[editing.index];
      setCorrections((c) => [...c, { step_name: step.step_name, from: step.product_name, to: "(étape retirée)", reason: why }]);
      setSteps((s) => s.filter((_, i) => i !== editing.index).map((x, i) => ({ ...x, step_number: i + 1 })));
    } else if (picked) {
      const explanation = `Choisi par une conseillère The Welfare : ${why}`;
      if (editing.kind === "replace") {
        const step = steps[editing.index];
        setCorrections((c) => [...c, { step_name: step.step_name, from: step.product_name, to: picked.title, reason: why }]);
        setSteps((s) => s.map((x, i) => (i === editing.index ? { ...x, medusa_product_id: picked.id, product_name: picked.title, explanation_for_client: explanation } : x)));
      } else {
        const name = stepName.trim() || "Soin complémentaire";
        setCorrections((c) => [...c, { step_name: name, from: "", to: picked.title, reason: why }]);
        setSteps((s) => [...s, { step_number: s.length + 1, step_name: name, explanation_for_client: explanation, medusa_product_id: picked.id, product_name: picked.title }]);
      }
    } else {
      return;
    }
    reset();
  };

  // discard: back to the Skin Coach's routine on purpose (a plain validation no longer erases corrections)
  const save = async (status: "validated" | "corrected", discard = false) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/skin-scans/${scanId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // a routine already corrected keeps its earlier corrections
        body: JSON.stringify(status === "validated" ? { status, ...(discard ? { discard_corrections: true } : {}) } : { status, routine: steps, corrections: [...(reviewedRoutine?.length ? savedCorrections || [] : []), ...corrections] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || "Enregistrement impossible");
      setCorrections([]);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const statusLine = reviewStatus
    ? `${reviewStatus === "corrected" ? "Corrigée" : "Validée"} par ${reviewedBy || "une conseillère"}${reviewedAt ? ` le ${new Date(reviewedAt).toLocaleString("fr-FR")}` : ""}`
    : "Pas encore revue par une conseillère";

  return (
    <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm print:hidden">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
            <UserCheck className="w-[18px] h-[18px] text-violet-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#2A2424]">Validation par une conseillère (pilote)</h2>
            <p className={`text-xs ${reviewStatus ? "text-emerald-600 font-semibold" : "text-[#2A2424]/40"}`}>{statusLine}</p>
          </div>
        </div>
      </div>

      {(savedCorrections || []).length > 0 && (
        <div className="mb-5 bg-violet-50/50 border border-violet-100 rounded-xl p-3 space-y-1">
          <span className="text-[10px] uppercase font-bold text-violet-700/70 tracking-widest block mb-1">Corrections enregistrées</span>
          {(savedCorrections || []).map((c, i) => (
            <p key={i} className="text-xs text-[#2A2424]/70">
              <span className="font-semibold">{c.step_name}</span> : {c.from || "(ajout)"} → {c.to} — <span className="italic">{c.reason}</span>
            </p>
          ))}
        </div>
      )}

      <div className="space-y-2 mb-4">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-[#EDE0E0] bg-[#FDFBF7]">
            <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded shrink-0">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#2A2424] truncate">{s.step_name}</p>
              <p className="text-xs text-[#2A2424]/60 truncate">{s.product_name}</p>
            </div>
            <button onClick={() => { reset(); setEditing({ kind: "replace", index: i }); }} className="p-2 rounded-lg text-[#2A2424]/50 hover:text-violet-600 hover:bg-violet-50" title="Remplacer le produit">
              <Replace className="w-4 h-4" />
            </button>
            <button onClick={() => { reset(); setEditing({ kind: "remove", index: i }); }} className="p-2 rounded-lg text-[#2A2424]/50 hover:text-red-600 hover:bg-red-50" title="Retirer l'étape">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button onClick={() => { reset(); setEditing({ kind: "add" }); }} className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-[#EDE0E0] text-xs font-bold text-[#2A2424]/50 hover:text-violet-600 hover:border-violet-200">
          <Plus className="w-4 h-4" /> Ajouter une étape
        </button>
      </div>

      {editing && (
        <div className="mb-4 p-4 rounded-xl border border-violet-200 bg-violet-50/40 space-y-3">
          <p className="text-xs font-bold text-[#2A2424]">
            {editing.kind === "remove"
              ? `Retirer « ${steps[editing.index]?.product_name} »`
              : editing.kind === "replace"
                ? `Remplacer « ${steps[editing.index]?.product_name} »`
                : "Ajouter une étape"}
          </p>
          {editing.kind === "add" && (
            <input value={stepName} onChange={(e) => setStepName(e.target.value)} placeholder="Nom de l'étape (ex : Sérum apaisant)" className="w-full px-3 py-2 rounded-lg border border-[#EDE0E0] text-sm bg-white" />
          )}
          {editing.kind !== "remove" && (
            <>
              <div className="flex gap-2">
                <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Rechercher un produit" className="flex-1 px-3 py-2 rounded-lg border border-[#EDE0E0] text-sm bg-white" />
                <button onClick={search} className="px-3 rounded-lg bg-[#2A2424] text-white">
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>
              {results.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {results.map((p) => (
                    <button key={p.id} onClick={() => setPicked(p)} className={`w-full text-left px-3 py-2 rounded-lg text-xs ${picked?.id === p.id ? "bg-violet-600 text-white" : "bg-white hover:bg-violet-50 text-[#2A2424]"}`}>
                      {p.title}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Motif (obligatoire), ex : texture insuffisamment confortable pour les zones sèches" className="w-full px-3 py-2 rounded-lg border border-[#EDE0E0] text-sm bg-white" />
          <div className="flex gap-2 justify-end">
            <button onClick={reset} className="px-3 py-2 rounded-lg text-xs font-bold text-[#2A2424]/60">Annuler</button>
            <button onClick={apply} disabled={!reason.trim() || (editing.kind !== "remove" && !picked)} className="px-3 py-2 rounded-lg text-xs font-bold bg-violet-600 text-white disabled:opacity-40">Appliquer</button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      <div className="flex flex-col sm:flex-row gap-2">
        {/* Once corrected, a plain validation would wipe the corrections (an advisor did it on 2026-10-22) */}
        {reviewStatus === "corrected" ? (
          <button
            onClick={() => confirm("Effacer les corrections et revenir à la routine proposée par le Skin Coach ?") && save("validated", true)}
            disabled={saving || corrections.length > 0}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-40"
          >
            Revenir à la routine du Skin Coach
          </button>
        ) : (
          <button onClick={() => save("validated")} disabled={saving || corrections.length > 0} className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40">
            Valider la routine telle quelle
          </button>
        )}
        <button onClick={() => save("corrected")} disabled={saving || corrections.length === 0} className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#2A2424] text-white disabled:opacity-40">
          {saving ? "Enregistrement…" : `Enregistrer ${corrections.length || ""} correction${corrections.length > 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}
