"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Upload, X, Sparkles, Loader2, AlertTriangle, Undo2, CheckCircle2 } from "lucide-react";
import type { AiProductSheet } from "@/lib/product-sheet";

// Top-of-form block: the admin shoots (phone camera) or imports photos of the INCI label, optionally the
// product front, and gets every form field proposed by the AI. Nothing is saved: the form is pre-filled.
//
// Photos are shrunk in the browser before upload: nginx in front of the admin accepts 1 MB per request,
// so all photos together are kept under ~900 KB (a label stays readable at 1600 px).

const MAX_SIDE = 1600;
const TOTAL_BUDGET = 900 * 1024;

type Shot = { file: File; preview: string };

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new window.Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function shrink(file: File, budget: number): Promise<Blob> {
  const img = await loadImage(file);
  let side = Math.min(MAX_SIDE, Math.max(img.naturalWidth, img.naturalHeight));
  for (let attempt = 0; attempt < 8; attempt++) {
    const scale = side / Math.max(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const q of [0.85, 0.75, 0.65]) {
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", q));
      if (blob && blob.size <= budget) return blob;
    }
    side = Math.round(side * 0.8);
  }
  throw new Error("Impossible de compresser la photo, essayez une photo plus nette ou plus petite");
}

function PhotoSlot({
  label,
  hint,
  shots,
  max,
  onAdd,
  onRemove,
  disabled,
}: {
  label: string;
  hint: string;
  shots: Shot[];
  max: number;
  onAdd: (files: FileList | null) => void;
  onRemove: (i: number) => void;
  disabled: boolean;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const full = shots.length >= max;
  const btn =
    "flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-[#EDE0E0] bg-white text-[#2A2424] hover:bg-[#F5F0EB] transition-colors disabled:opacity-40";

  return (
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-bold text-[#2A2424]/60 uppercase tracking-widest">{label}</p>
      <p className="text-[11px] text-[#2A2424]/40 mb-2">{hint}</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {shots.map((s, i) => (
          <div key={s.preview} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#EDE0E0] bg-[#F5F0EB]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.preview} alt={`${label} ${i + 1}`} className="w-full h-full object-cover" />
            {!disabled && (
              <button type="button" onClick={() => onRemove(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black" aria-label="Retirer la photo">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" className={btn} disabled={disabled || full} onClick={() => cameraRef.current?.click()}>
          <Camera className="w-3.5 h-3.5" /> Prendre une photo
        </button>
        <button type="button" className={btn} disabled={disabled || full} onClick={() => fileRef.current?.click()}>
          <Upload className="w-3.5 h-3.5" /> Importer
        </button>
      </div>
      {/* capture opens the rear camera on phones; on a computer it falls back to the file picker */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { onAdd(e.target.files); e.target.value = ""; }} />
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple={max > 1} className="hidden" onChange={(e) => { onAdd(e.target.files); e.target.value = ""; }} />
    </div>
  );
}

export function AiSheetGenerator({
  collections,
  categories,
  onApply,
  onUndo,
  canUndo,
  isEdit,
}: {
  collections: any[];
  categories: any[];
  onApply: (sheet: AiProductSheet) => void;
  onUndo: () => void;
  canUndo: boolean;
  isEdit: boolean;
}) {
  const [open, setOpen] = useState(!isEdit);
  const [inci, setInci] = useState<Shot[]>([]);
  const [front, setFront] = useState<Shot[]>([]);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AiProductSheet | null>(null);

  useEffect(() => {
    if (!loading) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [loading]);

  // Release object URLs when photos go away
  const shotsRef = useRef<Shot[]>([]);
  shotsRef.current = [...inci, ...front];
  useEffect(() => () => shotsRef.current.forEach((s) => URL.revokeObjectURL(s.preview)), []);

  const add = (setter: React.Dispatch<React.SetStateAction<Shot[]>>, max: number) => (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    setter((prev) => {
      const room = max - prev.length;
      const next = Array.from(files)
        .filter((f) => f.type.startsWith("image/"))
        .slice(0, room)
        .map((file) => ({ file, preview: URL.createObjectURL(file) }));
      return [...prev, ...next];
    });
  };
  const remove = (setter: React.Dispatch<React.SetStateAction<Shot[]>>) => (i: number) =>
    setter((prev) => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, j) => j !== i);
    });

  const generate = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const budget = Math.floor(TOTAL_BUDGET / (inci.length + front.length));
      const form = new FormData();
      for (const s of inci) form.append("inci", await shrink(s.file, budget), "inci.jpg");
      for (const s of front) form.append("front", await shrink(s.file, budget), "front.jpg");
      form.append(
        "context",
        JSON.stringify({
          collections: collections.map((c) => ({ id: c.id, title: c.title })),
          categories: categories.map((c) => ({
            id: c.id,
            name: c.name,
            parent: categories.find((p) => p.id === c.parent_category_id)?.name || null,
          })),
        })
      );

      const res = await fetch("/api/products/ai-sheet", { method: "POST", body: form });
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(res.status === 413 ? "Photos trop lourdes" : `Erreur ${res.status} lors de la génération`);
      }
      if (data.error || !data.sheet) throw new Error(data.error || "Erreur lors de la génération");
      setResult(data.sheet);
      onApply(data.sheet);
    } catch (e: any) {
      setError(e.message || "Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  const confidence = result
    ? { high: ["Liste INCI nette", "text-emerald-700 bg-emerald-50 border-emerald-200"], medium: ["Quelques mots incertains", "text-amber-700 bg-amber-50 border-amber-200"], low: ["Lecture incertaine", "text-red-700 bg-red-50 border-red-200"] }[result.inci_confidence]
    : null;

  return (
    <div className="rounded-2xl border border-[#E8C9CB] bg-gradient-to-br from-[#FBF3F3] to-white p-5 sm:p-6 shadow-sm">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-3 text-left">
        <span className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-[#2A2424] text-white flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </span>
          <span>
            <span className="block text-sm font-bold text-[#2A2424]">Générer la fiche depuis la liste INCI</span>
            <span className="block text-[11px] text-[#2A2424]/50">
              {isEdit ? "Régénère la fiche beauté et les textes à partir de nouvelles photos" : "Photographiez l'étiquette, l'IA pré-remplit le formulaire"}
            </span>
          </span>
        </span>
        <span className="text-xs font-bold text-[#C08A8E]">{open ? "Masquer" : "Ouvrir"}</span>
      </button>

      {open && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-5">
            <PhotoSlot label="Liste INCI *" hint="1 à 2 photos nettes, bien éclairées" shots={inci} max={2} onAdd={add(setInci, 2)} onRemove={remove(setInci)} disabled={loading} />
            <PhotoSlot label="Face avant (optionnel)" hint="Aide à lire le nom et la marque" shots={front} max={1} onAdd={add(setFront, 1)} onRemove={remove(setFront)} disabled={loading} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={generate}
              disabled={loading || !inci.length}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#2A2424] text-white rounded-xl text-sm font-bold hover:bg-black transition-colors disabled:opacity-40"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? `Lecture de l'étiquette… ${elapsed}s` : result ? "Régénérer" : "Générer la fiche"}
            </button>
            {canUndo && !loading && (
              <button type="button" onClick={() => { onUndo(); setResult(null); }} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[#2A2424]/60 hover:text-[#2A2424]">
                <Undo2 className="w-3.5 h-3.5" /> Annuler le remplissage
              </button>
            )}
            {loading && <span className="text-[11px] text-[#2A2424]/40">Comptez 20 à 60 secondes</span>}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">{error}</div>
          )}

          {result && confidence && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" /> Formulaire pré-rempli : relisez les champs marqués « IA » avant d'enregistrer
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${confidence[1]}`}>{confidence[0]}</span>
              </div>
              {result.warnings.length > 0 && (
                <ul className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-1">
                  {result.warnings.map((w, i) => (
                    <li key={i} className="flex gap-2 text-xs text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {w}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-[11px] text-[#2A2424]/40">Le prix, le stock et les images ne sont jamais remplis par l'IA.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
