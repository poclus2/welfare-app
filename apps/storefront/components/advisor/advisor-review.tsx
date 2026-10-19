"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowsClockwise, CircleNotch, MagnifyingGlass, Plus, Trash, UserCircleCheck } from "@phosphor-icons/react";
import { reviewScan } from "@/app/conseillere/actions";
import { DISPLAY_FONT, SK } from "@/components/ui/skin-coach/theme";

// The advisor validates the Skin Coach routine as it is, or corrects it with one reason per change (same
// rules as the admin's review, apps/admin/app/dashboard/skin-scans/[id]/ScanReview.tsx). The customer then
// sees the reviewed routine in her account; the corrections are kept to study the Skin Coach's mistakes.

type Step = {
  step_number: number;
  step_name: string;
  explanation_for_client?: string;
  medusa_product_id: string | null;
  product_name: string;
};
type Correction = { step_name: string; from: string; to: string; reason: string };
type Product = { id: string; title: string; thumbnail: string | null };
type Editing = { kind: "replace"; index: number } | { kind: "remove"; index: number } | { kind: "add" } | null;

const API_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://api.thewelfarecm.com";

export function AdvisorReview({
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
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEditing(null);
    setQuery("");
    setResults([]);
    setPicked(null);
    setStepName("");
    setReason("");
  };

  // the shop's catalogue, as customers see it
  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`${API_URL}/store/products?q=${encodeURIComponent(query.trim())}&limit=8&fields=id,title,thumbnail`, {
        headers: { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "" },
      });
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
      if (!step) return;
      setCorrections((c) => [...c, { step_name: step.step_name, from: step.product_name, to: "(étape retirée)", reason: why }]);
      setSteps((s) => s.filter((_, i) => i !== editing.index).map((x, i) => ({ ...x, step_number: i + 1 })));
    } else if (picked) {
      const explanation = `Choisi par une conseillère The Welfare : ${why}`;
      if (editing.kind === "replace") {
        const step = steps[editing.index];
        if (!step) return;
      if (!step) return;
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

  const save = (status: "validated" | "corrected") => {
    setError(null);
    startSaving(async () => {
      // a routine already corrected keeps its earlier corrections
      const body = status === "validated" ? { status } : { status, routine: steps, corrections: [...(reviewedRoutine?.length ? savedCorrections || [] : []), ...corrections] };
      const res = await reviewScan(scanId, body);
      if (res.error) {
        setError(res.error);
        return;
      }
      setCorrections([]);
      router.refresh();
    });
  };

  const statusLine = reviewStatus
    ? `${reviewStatus === "corrected" ? "Corrigée" : "Validée"} par ${reviewedBy || "une conseillère"}${reviewedAt ? ` le ${new Date(reviewedAt).toLocaleString("fr-FR", { timeZone: "Africa/Douala" })}` : ""}`
    : "Pas encore relue";

  const input = "w-full h-11 px-3 rounded-xl text-[15px] outline-none";
  const inputStyle = { background: SK.surface, border: `1px solid ${SK.line}` };

  return (
    <section className="rounded-[26px] p-5 flex flex-col gap-3" style={{ background: SK.surface, border: `1px solid ${SK.accent}` }}>
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: SK.tint }}>
          <UserCircleCheck className="w-6 h-6" style={{ color: SK.accent }} />
        </span>
        <div>
          <h2 style={{ fontFamily: DISPLAY_FONT, fontSize: 20, fontWeight: 700, margin: 0 }}>Votre avis</h2>
          <p className="text-[13px] font-semibold" style={{ color: reviewStatus ? "#0B6B45" : SK.muted }}>{statusLine}</p>
        </div>
      </div>

      {(savedCorrections || []).length > 0 && (
        <div className="rounded-2xl p-3 flex flex-col gap-1" style={{ background: SK.ground }}>
          <p className="text-[12px] font-bold uppercase tracking-[0.08em]" style={{ color: SK.muted }}>Corrections enregistrées</p>
          {(savedCorrections || []).map((c, i) => (
            <p key={i} className="text-[13px]">
              <span className="font-bold">{c.step_name}</span> : {c.from || "(ajout)"} → {c.to} — <span className="italic" style={{ color: SK.muted }}>{c.reason}</span>
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 p-3 rounded-2xl" style={{ border: `1px solid ${SK.line}` }}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ background: SK.tint, color: SK.accent }}>{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold truncate">{s.step_name}</p>
              <p className="text-[13px] truncate" style={{ color: SK.muted }}>{s.product_name}</p>
            </div>
            <button onClick={() => { reset(); setEditing({ kind: "replace", index: i }); }} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ color: SK.muted }} aria-label="Remplacer le produit">
              <ArrowsClockwise className="w-5 h-5" />
            </button>
            <button onClick={() => { reset(); setEditing({ kind: "remove", index: i }); }} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ color: "#B42318" }} aria-label="Retirer l'étape">
              <Trash className="w-5 h-5" />
            </button>
          </div>
        ))}
        <button onClick={() => { reset(); setEditing({ kind: "add" }); }} className="h-11 rounded-2xl flex items-center justify-center gap-2 text-[13px] font-bold" style={{ border: `1px dashed ${SK.line}`, color: SK.muted }}>
          <Plus className="w-4 h-4" /> Ajouter une étape
        </button>
      </div>

      {editing && (
        <div className="p-4 rounded-2xl flex flex-col gap-3" style={{ background: SK.tint }}>
          <p className="text-[14px] font-bold">
            {editing.kind === "remove"
              ? `Retirer « ${steps[editing.index]?.product_name} »`
              : editing.kind === "replace"
                ? `Remplacer « ${steps[editing.index]?.product_name} »`
                : "Ajouter une étape"}
          </p>
          {editing.kind === "add" && (
            <input value={stepName} onChange={(e) => setStepName(e.target.value)} placeholder="Nom de l'étape (ex : Sérum apaisant)" className={input} style={inputStyle} />
          )}
          {editing.kind !== "remove" && (
            <>
              <div className="flex gap-2">
                <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Rechercher un produit" className={input} style={inputStyle} />
                <button onClick={search} className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-white" style={{ background: SK.ink }} aria-label="Rechercher">
                  {searching ? <CircleNotch className="w-5 h-5 animate-spin" /> : <MagnifyingGlass className="w-5 h-5" />}
                </button>
              </div>
              {results.length > 0 && (
                <div className="max-h-56 overflow-y-auto flex flex-col gap-1">
                  {results.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPicked(p)}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-[14px] flex items-center gap-2"
                      style={picked?.id === p.id ? { background: SK.accent, color: "#fff" } : { background: SK.surface }}
                    >
                      {p.thumbnail && <img src={p.thumbnail} alt="" className="w-8 h-8 rounded-lg object-contain bg-white shrink-0" />}
                      <span className="min-w-0">{p.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Motif (obligatoire), ex : texture trop riche pour une peau grasse" className="w-full px-3 py-2 rounded-xl text-[15px] outline-none" style={inputStyle} />
          <div className="flex gap-2 justify-end">
            <button onClick={reset} className="h-10 px-4 rounded-full text-[13px] font-bold" style={{ color: SK.muted }}>Annuler</button>
            <button onClick={apply} disabled={!reason.trim() || (editing.kind !== "remove" && !picked)} className="h-10 px-4 rounded-full text-[13px] font-bold text-white disabled:opacity-40" style={{ background: SK.accent }}>
              Appliquer
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-[14px] font-semibold" style={{ color: "#B42318" }}>{error}</p>}

      <div className="flex flex-col gap-2">
        <button
          onClick={() => save("corrected")}
          disabled={saving || corrections.length === 0}
          className="h-[52px] rounded-full flex items-center justify-center gap-2 text-[15px] font-bold text-white disabled:opacity-40"
          style={{ background: SK.ink }}
        >
          {saving && <CircleNotch className="w-5 h-5 animate-spin" />}
          {corrections.length ? `Enregistrer ${corrections.length} correction${corrections.length > 1 ? "s" : ""}` : "Enregistrer les corrections"}
        </button>
        <button
          onClick={() => save("validated")}
          disabled={saving || corrections.length > 0}
          className="h-[52px] rounded-full flex items-center justify-center text-[15px] font-bold disabled:opacity-40"
          style={{ border: "1px solid #0B6B45", color: "#0B6B45" }}
        >
          Valider la routine telle quelle
        </button>
      </div>
    </section>
  );
}
