"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Power, PowerOff, KeyRound, Pencil, X, UserCheck, Loader2 } from "lucide-react";

// Skin advisors (client request, 2026-10-18): each new Skin Coach scan goes to one of the active advisors in
// turn (a customer already followed keeps hers). She is told on WhatsApp and opens the scan in her own space
// on the shop, with her WhatsApp number and the password set here. She has no access to this admin.

export type Advisor = {
  id: string;
  name: string;
  whatsapp: string;
  active: boolean;
  has_password: boolean;
  last_assigned_at: string | null;
  created_at: string;
  scans: number;
  pending: number;
};

type Form = { id?: string; name: string; whatsapp: string; password: string };
const EMPTY: Form = { name: "", whatsapp: "", password: "" };

// "237640236304" → "+237 640 23 63 04"
const fmtPhone = (d: string) =>
  d.startsWith("237") && d.length === 12 ? `+237 ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)} ${d.slice(10)}` : `+${d}`;

export default function AdvisorsClient({ advisors, spaceUrl }: { advisors: Advisor[]; spaceUrl: string }) {
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const call = async (url: string, body: unknown, key: string) => {
    setSaving(key);
    setError(null);
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || "Enregistrement impossible");
      router.refresh();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setSaving(null);
    }
  };

  const submit = async () => {
    if (!form) return;
    const body: Record<string, unknown> = { name: form.name, whatsapp: form.whatsapp };
    if (form.password) body.password = form.password;
    const ok = await call(form.id ? `/api/admin/skin-advisors/${form.id}` : "/api/admin/skin-advisors", body, "form");
    if (ok) setForm(null);
  };

  const activeCount = advisors.filter((a) => a.active).length;

  return (
    <div className="p-5 lg:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-violet-600" />
            </div>
            <h1 className="text-3xl font-bold text-[#2A2424]" style={{ letterSpacing: "-0.03em" }}>Conseillères</h1>
          </div>
          <p className="text-sm text-[#2A2424]/50 ml-[52px] max-w-2xl">
            Chaque nouveau scan est confié à une conseillère active, à tour de rôle (une cliente déjà suivie garde la sienne).
            Elle est prévenue sur WhatsApp et ouvre le scan dans son espace :{" "}
            <a href={spaceUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-violet-700 underline underline-offset-2">{spaceUrl.replace(/^https?:\/\//, "")}</a>
            , avec son numéro WhatsApp et le mot de passe choisi ici.
          </p>
        </div>
        <button
          onClick={() => { setError(null); setForm({ ...EMPTY }); }}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2A2424] text-white text-sm font-bold"
        >
          <Plus className="w-4 h-4" /> Ajouter une conseillère
        </button>
      </div>

      {activeCount === 0 && (
        <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50 text-sm text-amber-800">
          Aucune conseillère active : les nouveaux scans ne sont confiés à personne et le bouton WhatsApp des clientes
          ouvre le numéro de la boutique.
        </div>
      )}

      {error && !form && <p className="text-sm text-red-600">{error}</p>}

      {form && (
        <div className="bg-white rounded-2xl border border-violet-200 p-6 shadow-sm space-y-4 max-w-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#2A2424]">{form.id ? "Modifier la conseillère" : "Nouvelle conseillère"}</h2>
            <button onClick={() => setForm(null)} className="p-1.5 rounded-lg text-[#2A2424]/40 hover:text-[#2A2424]"><X className="w-4 h-4" /></button>
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#2A2424]/60">Nom</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ex : Aïcha Mballa" className="w-full px-3 py-2.5 rounded-xl border border-[#EDE0E0] text-sm" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#2A2424]/60">Numéro WhatsApp (c&apos;est aussi son identifiant)</span>
            <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="ex : 6 90 12 34 56 ou +237 6 90 12 34 56" inputMode="tel" className="w-full px-3 py-2.5 rounded-xl border border-[#EDE0E0] text-sm" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#2A2424]/60">
              {form.id ? "Nouveau mot de passe (laisser vide pour ne pas le changer)" : "Mot de passe (8 caractères au moins)"}
            </span>
            <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="text" autoComplete="off" className="w-full px-3 py-2.5 rounded-xl border border-[#EDE0E0] text-sm font-mono" />
            <span className="block text-[11px] text-[#2A2424]/40">Transmettez-le-lui de vive voix ou sur WhatsApp. Le changer la déconnecte partout.</span>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => setForm(null)} className="px-4 py-2.5 rounded-xl text-sm font-bold text-[#2A2424]/60">Annuler</button>
            <button onClick={submit} disabled={saving === "form"} className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold disabled:opacity-50 inline-flex items-center gap-2">
              {saving === "form" && <Loader2 className="w-4 h-4 animate-spin" />} Enregistrer
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#EDE0E0] shadow-sm overflow-hidden">
        {advisors.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#2A2424]/40">Aucune conseillère pour l&apos;instant.</p>
        ) : (
          <div className="divide-y divide-[#F5F0EB]">
            {advisors.map((a) => (
              <div key={a.id} className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[#2A2424] truncate">{a.name}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${a.active ? "bg-emerald-50 text-emerald-700" : "bg-[#F5F0EB] text-[#2A2424]/40"}`}>
                      {a.active ? "Active" : "Désactivée"}
                    </span>
                  </div>
                  <p className="text-sm text-[#2A2424]/60 font-mono mt-0.5">{fmtPhone(a.whatsapp)}</p>
                  <p className="text-xs text-[#2A2424]/40 mt-1">
                    {a.scans} scan{a.scans > 1 ? "s" : ""} confié{a.scans > 1 ? "s" : ""} · {a.pending} à relire
                    {a.last_assigned_at ? ` · dernier le ${new Date(a.last_assigned_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setError(null); setForm({ id: a.id, name: a.name, whatsapp: a.whatsapp, password: "" }); }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EDE0E0] text-xs font-bold text-[#2A2424]/70 hover:bg-[#FAF7F5]"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Modifier
                  </button>
                  {!a.has_password && <span className="inline-flex items-center gap-1 text-xs text-amber-700"><KeyRound className="w-3.5 h-3.5" /> sans mot de passe</span>}
                  <button
                    onClick={() => call(`/api/admin/skin-advisors/${a.id}`, { active: !a.active }, a.id)}
                    disabled={saving === a.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50 ${a.active ? "border border-red-100 text-red-600 hover:bg-red-50" : "bg-emerald-600 text-white"}`}
                  >
                    {a.active ? <><PowerOff className="w-3.5 h-3.5" /> Désactiver</> : <><Power className="w-3.5 h-3.5" /> Activer</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
