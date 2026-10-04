"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Power, PowerOff, Trash2, X, Ticket, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type DiscountKind = "percentage" | "fixed" | "free_shipping";

export type PromoCode = {
  id: string;
  code: string;
  status: string;
  discount_kind: DiscountKind;
  value: number;
  currency_code: string | null;
  product_ids: string[];
  collection_ids: string[];
  min_cart_amount: number;
  per_customer_once: boolean;
  starts_at: string | null;
  ends_at: string | null;
  limit: number | null;
  used: number;
  created_at: string;
};

type Option = { id: string; title: string };

type FormState = {
  code: string;
  kind: DiscountKind;
  value: string;
  restrict: boolean;
  productIds: string[];
  collectionIds: string[];
  startsAt: string;
  endsAt: string;
  usageLimit: string;
  perCustomerOnce: boolean;
  minCart: string;
};

const EMPTY_FORM: FormState = {
  code: "",
  kind: "percentage",
  value: "",
  restrict: false,
  productIds: [],
  collectionIds: [],
  startsAt: "",
  endsAt: "",
  usageLimit: "",
  perCustomerOnce: false,
  minCart: "",
};

const inputClass =
  "w-full px-3 py-2.5 bg-[#F5F0EB] border border-[#EDE0E0] rounded-xl text-sm text-[#2A2424] outline-none focus:border-[#C08A8E] placeholder:text-[#2A2424]/30";
const labelClass = "block text-[10px] font-bold uppercase tracking-widest text-[#2A2424]/40 mb-1.5";

function formatPrice(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : null;
}

function currencyLabel(code: string | null) {
  return !code || ["xaf", "xof"].includes(code.toLowerCase()) ? "FCFA" : code.toUpperCase();
}

function describeDiscount(p: PromoCode) {
  if (p.discount_kind === "free_shipping") return "Livraison offerte";
  if (p.discount_kind === "fixed") return `-${formatPrice(p.value)} ${currencyLabel(p.currency_code)}`;
  return `-${p.value} %`;
}

function describeScope(p: PromoCode) {
  const parts: string[] = [];
  if (p.product_ids.length) parts.push(`${p.product_ids.length} produit${p.product_ids.length > 1 ? "s" : ""}`);
  if (p.collection_ids.length) parts.push(`${p.collection_ids.length} marque${p.collection_ids.length > 1 ? "s" : ""}`);
  return parts.length ? parts.join(" + ") : "Toute la commande";
}

function getStatus(p: PromoCode): { label: string; className: string } {
  const now = Date.now();
  if (p.status !== "active") return { label: "Désactivé", className: "bg-gray-100 text-gray-500 border border-gray-200" };
  if (p.ends_at && new Date(p.ends_at).getTime() <= now) return { label: "Expiré", className: "bg-red-50 text-red-500 border border-red-200" };
  if (p.limit != null && p.used >= p.limit) return { label: "Épuisé", className: "bg-amber-50 text-amber-600 border border-amber-200" };
  if (p.starts_at && new Date(p.starts_at).getTime() > now) return { label: "Programmé", className: "bg-blue-50 text-blue-600 border border-blue-200" };
  return { label: "Actif", className: "bg-emerald-50 text-emerald-600 border border-emerald-200" };
}

function MultiPicker({
  title,
  options,
  selected,
  onChange,
}: {
  title: string;
  options: Option[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const shown = useMemo(
    () => options.filter((o) => o.title.toLowerCase().includes(q.toLowerCase())),
    [options, q]
  );
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  return (
    <div>
      <label className={labelClass}>
        {title} {selected.length > 0 && `(${selected.length} sélectionné${selected.length > 1 ? "s" : ""})`}
      </label>
      <div className="border border-[#EDE0E0] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 bg-[#F5F0EB] border-b border-[#EDE0E0]">
          <Search className="w-3.5 h-3.5 text-[#2A2424]/30" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher..."
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-[#2A2424]/30"
          />
        </div>
        <div className="max-h-36 overflow-y-auto divide-y divide-[#EDE0E0]/60">
          {shown.length === 0 && <p className="px-3 py-3 text-xs text-[#2A2424]/40">Aucun résultat</p>}
          {shown.map((o) => (
            <label key={o.id} className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#2A2424] cursor-pointer hover:bg-[#F5F0EB]/60">
              <input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggle(o.id)} className="accent-[#2A2424]" />
              <span className="truncate">{o.title}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PromotionsClient({
  promoCodes,
  collections,
  products,
  currencyCode,
}: {
  promoCodes: PromoCode[];
  collections: Option[];
  products: Option[];
  currencyCode: string;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const openForm = () => {
    setForm(EMPTY_FORM);
    setError("");
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          discount_kind: form.kind,
          value: form.kind === "free_shipping" ? undefined : Number(form.value),
          currency_code: form.kind === "fixed" ? currencyCode : undefined,
          product_ids: form.kind !== "free_shipping" && form.restrict ? form.productIds : [],
          collection_ids: form.kind !== "free_shipping" && form.restrict ? form.collectionIds : [],
          starts_at: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
          ends_at: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
          usage_limit: form.usageLimit ? Number(form.usageLimit) : undefined,
          per_customer_once: form.perCustomerOnce,
          min_cart_amount: form.minCart ? Number(form.minCart) : 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || "Impossible de créer ce code promo.");
      setShowForm(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (p: PromoCode) => {
    setBusyId(p.id);
    try {
      const res = await fetch(`/api/admin/promo-codes/${p.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: p.status === "active" ? "inactive" : "active" }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Échec");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (p: PromoCode) => {
    if (!confirm(`Supprimer définitivement le code ${p.code} ?`)) return;
    setBusyId(p.id);
    try {
      const res = await fetch(`/api/admin/promo-codes/${p.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Échec");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-5 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2A2424]" style={{ letterSpacing: "-0.02em" }}>Codes promo</h1>
          <p className="text-sm text-[#2A2424]/40 mt-0.5">
            Codes dédiés à une promotion précise. Les codes des créatrices se gèrent dans « Créateurs Partenaires ».
          </p>
        </div>
        <button
          onClick={openForm}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2A2424] text-white rounded-xl text-sm font-bold hover:bg-[#1A1616] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Nouveau code
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#EDE0E0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5F0EB] border-b border-[#EDE0E0]">
                {["Code", "Remise", "Portée", "Conditions", "Validité", "Utilisations", "Statut", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-[#2A2424]/40 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {promoCodes.map((p) => {
                const status = getStatus(p);
                const conditions = [
                  p.min_cart_amount > 0 ? `Dès ${formatPrice(p.min_cart_amount)} FCFA` : null,
                  p.per_customer_once ? "1 fois / client" : null,
                ].filter(Boolean);
                return (
                  <tr key={p.id} className="border-b border-[#EDE0E0] hover:bg-[#F5F0EB]/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="flex items-center gap-2 text-xs font-bold text-[#2A2424] font-mono">
                        <Ticket className="w-3.5 h-3.5 text-[#C08A8E]" /> {p.code}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-bold text-[#C08A8E] whitespace-nowrap">{describeDiscount(p)}</td>
                    <td className="px-4 py-3.5 text-xs text-[#2A2424]/70">{describeScope(p)}</td>
                    <td className="px-4 py-3.5 text-[11px] text-[#2A2424]/60">{conditions.length ? conditions.join(" · ") : "—"}</td>
                    <td className="px-4 py-3.5 text-[11px] text-[#2A2424]/60 whitespace-nowrap">
                      {p.starts_at || p.ends_at
                        ? `${formatDate(p.starts_at) ?? "…"} → ${formatDate(p.ends_at) ?? "sans fin"}`
                        : "Illimitée"}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-[#2A2424]">
                      {p.used}{p.limit != null ? ` / ${p.limit}` : ""}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${status.className}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleStatus(p)}
                          disabled={busyId === p.id}
                          title={p.status === "active" ? "Désactiver" : "Activer"}
                          className="p-2 rounded-lg text-[#2A2424]/40 hover:text-[#2A2424] hover:bg-[#F5F0EB] transition-colors disabled:opacity-40"
                        >
                          {p.status === "active" ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => remove(p)}
                          disabled={busyId === p.id}
                          title="Supprimer"
                          className="p-2 rounded-lg text-[#2A2424]/40 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {promoCodes.length === 0 && (
            <div className="text-center py-12 text-sm text-[#2A2424]/30">Aucun code promo pour le moment.</div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !saving && setShowForm(false)}
              className="fixed inset-0 z-40 bg-black/40"
            />
            <motion.form
              onSubmit={submit}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[460px] bg-white shadow-2xl overflow-y-auto"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#EDE0E0] sticky top-0 bg-white z-10">
                <h2 className="text-sm font-bold text-[#2A2424]">Nouveau code promo</h2>
                <button type="button" onClick={() => setShowForm(false)} className="p-2 text-[#2A2424]/30 hover:text-[#2A2424] hover:bg-[#F5F0EB] rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {error && (
                  <div className="rounded-xl border border-red-100 bg-red-50/60 px-4 py-3 text-xs text-red-600">{error}</div>
                )}

                <div>
                  <label className={labelClass}>Code</label>
                  <input
                    required
                    value={form.code}
                    onChange={(e) => set("code", e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
                    placeholder="RENTREE10"
                    maxLength={32}
                    className={`${inputClass} font-mono`}
                  />
                </div>

                <div>
                  <label className={labelClass}>Type de remise</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      ["percentage", "Pourcentage"],
                      ["fixed", `Montant (${currencyLabel(currencyCode)})`],
                      ["free_shipping", "Livraison offerte"],
                    ] as [DiscountKind, string][]).map(([k, label]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => set("kind", k)}
                        className={`px-2 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                          form.kind === k ? "bg-[#2A2424] text-white border-[#2A2424]" : "bg-white text-[#2A2424]/60 border-[#EDE0E0] hover:border-[#C08A8E]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {form.kind !== "free_shipping" && (
                  <div>
                    <label className={labelClass}>
                      {form.kind === "percentage" ? "Pourcentage de remise" : `Montant de la remise (${currencyLabel(currencyCode)})`}
                    </label>
                    <input
                      required
                      type="number"
                      min={1}
                      max={form.kind === "percentage" ? 100 : undefined}
                      step={1}
                      value={form.value}
                      onChange={(e) => set("value", e.target.value)}
                      placeholder={form.kind === "percentage" ? "10" : "2000"}
                      className={inputClass}
                    />
                  </div>
                )}

                {form.kind !== "free_shipping" && (
                  <div className="space-y-3">
                    <label className="flex items-center gap-2.5 text-xs font-semibold text-[#2A2424] cursor-pointer">
                      <input type="checkbox" checked={form.restrict} onChange={(e) => set("restrict", e.target.checked)} className="accent-[#2A2424]" />
                      Limiter à certains produits ou marques
                    </label>
                    {form.restrict && (
                      <>
                        <MultiPicker title="Marques" options={collections} selected={form.collectionIds} onChange={(ids) => set("collectionIds", ids)} />
                        <MultiPicker title="Produits" options={products} selected={form.productIds} onChange={(ids) => set("productIds", ids)} />
                        <p className="text-[10px] text-[#2A2424]/40">
                          La remise ne s'applique qu'aux articles qui correspondent à une marque OU à un produit sélectionné.
                        </p>
                      </>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Début (optionnel)</label>
                    <input type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Fin (optionnel)</label>
                    <input type="datetime-local" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Utilisations max</label>
                    <input type="number" min={1} step={1} value={form.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} placeholder="Illimité" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Panier minimum (FCFA)</label>
                    <input type="number" min={0} step={1} value={form.minCart} onChange={(e) => set("minCart", e.target.value)} placeholder="Aucun" className={inputClass} />
                  </div>
                </div>

                <label className="flex items-center gap-2.5 text-xs font-semibold text-[#2A2424] cursor-pointer">
                  <input type="checkbox" checked={form.perCustomerOnce} onChange={(e) => set("perCustomerOnce", e.target.checked)} className="accent-[#2A2424]" />
                  1 seule utilisation par client (réservé aux clients connectés)
                </label>
              </div>

              <div className="px-6 pb-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-[#2A2424] text-white rounded-xl text-sm font-bold hover:bg-[#1A1616] transition-colors disabled:opacity-50"
                >
                  {saving ? "Création..." : "Créer le code"}
                </button>
                <p className="text-[10px] text-[#2A2424]/40 text-center mt-2">
                  Un code créé n'est pas modifiable : pour changer ses conditions, supprimez-le et recréez-le.
                </p>
              </div>
            </motion.form>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
