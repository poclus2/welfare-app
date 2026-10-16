"use client";

import { useEffect, useRef, useState } from "react";
import {
  GalleryHorizontal, Plus, Trash2, Edit3, ArrowUp, ArrowDown, Eye, EyeOff, X, Save, ImagePlus, ExternalLink, Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { shrinkImage } from "@/lib/image-shrink";

// Visuals under /banners/... are served by the shop itself (apps/storefront/public), uploaded ones by the API
const SHOP_URL = (process.env.NEXT_PUBLIC_SHOP_URL || "https://thewelfarecm.com").replace(/\/+$/, "");
const imageSrc = (url?: string | null) => (!url ? "" : url.startsWith("/") ? `${SHOP_URL}${url}` : url);

type Banner = {
  id: string;
  position: number;
  is_active: boolean;
  title: string;
  description: string | null;
  cta_label: string;
  cta_href: string;
  image_url: string | null;
  image_desktop_url: string | null;
  image_alt: string | null;
  bg_color: string | null;
};

type Draft = Omit<Banner, "id" | "position" | "is_active">;

const EMPTY: Draft = {
  title: "", description: "", cta_label: "", cta_href: "", image_url: "", image_desktop_url: "", image_alt: "", bg_color: "#F4EAEB",
};

// Two versions of each visual: with its lettering for phones (the slide then shows no title of its own),
// without lettering for computers (title, text and button sit next to it)
const VISUALS = [
  { field: "image_url", label: "Visuel mobile", hint: "Avec le texte incrusté" },
  { field: "image_desktop_url", label: "Visuel ordinateur", hint: "Sans texte (sinon, le visuel mobile est utilisé)" },
] as const;
type VisualField = (typeof VISUALS)[number]["field"];

// Pages a button usually opens (the field stays free: any path of the shop works)
const LINK_SUGGESTIONS = [
  "/skin-coach", "/shop/all", "/shop/nettoyants", "/shop/toners-essences", "/shop/serums", "/shop/hydratants",
  "/shop/soins-contour-des-yeux", "/shop/solaires", "/shop/masques", "/shop/exfoliants", "/shop/soins-levres",
  "/shop/soins-corps", "/shop/hand-cream", "/shop/hair-care", "/marques", "/ambassadrices",
  "/shop/all?concern=Taches%20%26%20hyperpigmentation", "/shop/all?skin=S%C3%A8che", "/shop/all?ingredient=Niacinamide",
];

async function api(path: string, method = "GET", body?: unknown) {
  const res = await fetch(`/api/admin${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Erreur serveur");
  return data;
}

export function BannersClient() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [editing, setEditing] = useState<Banner | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<VisualField | null>(null);
  const [formError, setFormError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const pickingFor = useRef<VisualField>("image_url");

  const load = async () => {
    try {
      const data = await api("/home-banners");
      setBanners(data.home_banners || []);
      setError("");
    } catch (e: any) {
      setError(e.message || "Impossible de charger les bannières.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setDraft(EMPTY);
    setFormError("");
    setIsOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setDraft({
      title: b.title,
      description: b.description || "",
      cta_label: b.cta_label,
      cta_href: b.cta_href,
      image_url: b.image_url || "",
      image_desktop_url: b.image_desktop_url || "",
      image_alt: b.image_alt || "",
      bg_color: b.bg_color || "#F4EAEB",
    });
    setFormError("");
    setIsOpen(true);
  };

  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [k]: e.target.value }));

  const pickImage = (field: VisualField) => {
    pickingFor.current = field;
    fileRef.current?.click();
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const field = pickingFor.current;
    setUploading(field);
    setFormError("");
    try {
      // 4:5 visual shown up to ~560 px wide: 1350 px on the long side is plenty and stays light
      const small = await shrinkImage(file, { maxSide: 1350, budget: 450 * 1024 });
      const form = new FormData();
      form.append("files", small);
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.files?.[0]?.url) throw new Error(data.error || "Envoi impossible");
      setDraft((d) => ({ ...d, [field]: data.files[0].url }));
    } catch (err: any) {
      setFormError(err.message || "Impossible d'envoyer le visuel.");
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    if (!draft.title.trim() || !draft.cta_label.trim() || !draft.cta_href.trim()) {
      setFormError("Le titre, le texte du bouton et le lien sont obligatoires.");
      return;
    }
    if (!draft.cta_href.trim().startsWith("/") && !/^https?:\/\//.test(draft.cta_href.trim())) {
      setFormError("Le lien doit commencer par / (page du site) ou https://");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editing) await api(`/home-banners/${editing.id}`, "POST", draft);
      else await api("/home-banners", "POST", draft);
      setIsOpen(false);
      await load();
    } catch (e: any) {
      setFormError(e.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (b: Banner) => {
    setBusyId(b.id);
    try {
      await api(`/home-banners/${b.id}`, "POST", { is_active: !b.is_active });
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...banners];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    setBanners(next);
    try {
      await api("/home-banner-order", "POST", { ids: next.map((b) => b.id) });
    } catch (e: any) {
      alert(e.message);
      await load();
    }
  };

  const remove = async (b: Banner) => {
    if (!confirm(`Supprimer la bannière « ${b.title} » ? Pour la retirer seulement un temps, désactivez-la plutôt.`)) return;
    setBusyId(b.id);
    try {
      await api(`/home-banners/${b.id}`, "DELETE");
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const activeCount = banners.filter((b) => b.is_active && b.image_url).length;

  return (
    <div className="p-5 lg:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-[#2A2424]">
            <GalleryHorizontal className="w-6 h-6" />
            Bannières de la page d&apos;accueil
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {activeCount} bannière{activeCount > 1 ? "s" : ""} visible{activeCount > 1 ? "s" : ""} sur le site, dans
            l&apos;ordre ci-dessous. Les modifications apparaissent sur le site en moins d&apos;une minute.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          Ajouter une bannière
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">{error}</div>
      )}

      {loading ? (
        <div className="p-8 text-center text-gray-400">Chargement...</div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500">
          Aucune bannière pour l&apos;instant.
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {banners.map((b, i) => {
            const visible = b.is_active && !!b.image_url;
            return (
              <li
                key={b.id}
                className={`bg-white rounded-2xl border shadow-sm p-3 flex items-center gap-4 ${visible ? "border-gray-100" : "border-dashed border-gray-200 opacity-70"}`}
              >
                <span className="w-6 text-center text-sm font-semibold text-gray-400 tabular-nums">{i + 1}</span>
                <div className="w-16 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center" style={{ background: b.bg_color || undefined }}>
                  {b.image_desktop_url || b.image_url ? (
                    <img src={imageSrc(b.image_desktop_url || b.image_url)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImagePlus className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{b.title}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {b.cta_label} → <span className="font-mono">{b.cta_href}</span>
                  </p>
                  <span
                    className={`inline-block mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${visible ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {visible ? "Visible" : !b.image_url ? "Visuel manquant" : "Désactivée"}
                  </span>
                  {b.image_url && !b.image_desktop_url && (
                    <span className="inline-block mt-1.5 ml-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                      Sans visuel ordinateur
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => move(i, -1)} disabled={i === 0} title="Monter" className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg disabled:opacity-30">
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === banners.length - 1} title="Descendre" className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg disabled:opacity-30">
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggle(b)}
                    disabled={busyId === b.id}
                    title={b.is_active ? "Désactiver" : "Activer"}
                    className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg"
                  >
                    {busyId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : b.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(b)} title="Modifier" className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(b)} title="Supprimer" className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              className="fixed inset-x-3 top-[4vh] bottom-[4vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-3xl bg-white rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-lg">{editing ? "Modifier la bannière" : "Nouvelle bannière"}</h2>
                <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 grid md:grid-cols-[220px_1fr] gap-6">
                {/* Visuals */}
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                    {VISUALS.map(({ field, label, hint }) => (
                      <div key={field}>
                        <p className="text-xs font-semibold text-gray-600">{label}</p>
                        <p className="text-[11px] text-gray-400 mb-1.5">{hint}</p>
                        <button
                          type="button"
                          onClick={() => pickImage(field)}
                          disabled={!!uploading}
                          className="group relative w-full aspect-[4/5] rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center"
                          style={{ background: draft.bg_color || "#F4EAEB" }}
                        >
                          {draft[field] ? (
                            <img src={imageSrc(draft[field])} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ImagePlus className="w-7 h-7 text-gray-400" />
                          )}
                          <span className="absolute inset-x-2 bottom-2 rounded-lg bg-white/90 py-1.5 text-xs font-medium text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                            {draft[field] ? "Changer" : "Ajouter"}
                          </span>
                          {uploading === field && (
                            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                              <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                          )}
                        </button>
                        {field === "image_desktop_url" && draft.image_desktop_url && (
                          <button type="button" onClick={() => setDraft((d) => ({ ...d, image_desktop_url: "" }))} className="mt-1 text-[11px] text-gray-500 hover:text-red-600">
                            Retirer
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPickImage} />
                  <p className="mt-3 text-[11px] text-gray-500 leading-snug">
                    Format portrait 4:5, idéalement 1080 × 1350 px. Les visuels sont allégés automatiquement avant l&apos;envoi.
                  </p>
                  <label className="mt-4 block text-xs font-semibold text-gray-600 mb-1">Couleur de fond</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={draft.bg_color || "#F4EAEB"} onChange={set("bg_color")} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                    <span className="text-xs font-mono text-gray-500">{draft.bg_color}</span>
                  </div>
                </div>

                {/* Texts */}
                <div className="flex flex-col gap-4">
                  <Field label="Titre *">
                    <input value={draft.title} onChange={set("title")} maxLength={90} className={inputClass} />
                  </Field>
                  <Field label="Description (facultative)">
                    <textarea value={draft.description || ""} onChange={set("description")} rows={3} maxLength={220} className={inputClass} />
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Texte du bouton *">
                      <input value={draft.cta_label} onChange={set("cta_label")} maxLength={40} className={inputClass} />
                    </Field>
                    <Field label="Lien du bouton *">
                      <input value={draft.cta_href} onChange={set("cta_href")} list="banner-links" placeholder="/shop/serums" className={`${inputClass} font-mono text-[13px]`} />
                      <datalist id="banner-links">
                        {LINK_SUGGESTIONS.map((l) => (
                          <option key={l} value={l} />
                        ))}
                      </datalist>
                    </Field>
                  </div>
                  {draft.cta_href && (
                    <a
                      href={draft.cta_href.startsWith("/") ? `${SHOP_URL}${draft.cta_href}` : draft.cta_href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="self-start inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-black"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Tester le lien sur le site
                    </a>
                  )}
                  <Field label="Description du visuel (pour l'accessibilité)">
                    <input value={draft.image_alt || ""} onChange={set("image_alt")} maxLength={120} placeholder="Ex. Sérums à la niacinamide" className={inputClass} />
                  </Field>
                  {!editing && (
                    <p className="text-xs text-gray-500">La bannière est créée désactivée : activez-la depuis la liste une fois vérifiée.</p>
                  )}
                </div>
              </div>

              {formError && <div className="mx-5 mb-3 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl">{formError}</div>}
              <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">
                  Annuler
                </button>
                <button
                  onClick={save}
                  disabled={saving || !!uploading}
                  className="flex items-center gap-2 bg-black text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Enregistrer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputClass =
  "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-black transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
