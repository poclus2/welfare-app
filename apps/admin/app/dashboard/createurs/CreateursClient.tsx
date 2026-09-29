"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Users, Search, Filter, BarChart2, FileText, ShoppingBag, DollarSign,
  X, ExternalLink, Loader2, Plus, Trophy, MousePointerClick, TrendingUp,
  SlidersHorizontal, Crown, Save, AlertCircle, CheckCircle2, Copy, Check,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────

function fmt(n: number | undefined | null) {
  return new Intl.NumberFormat("fr-FR").format(n || 0);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    pending: { cls: "bg-amber-50 text-amber-700 border-amber-200", label: "En attente" },
    approved: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Approuvée" },
    rejected: { cls: "bg-rose-50 text-rose-700 border-rose-200", label: "Refusée" },
    active: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Actif" },
    suspended: { cls: "bg-rose-50 text-rose-700 border-rose-200", label: "Suspendu" },
    ambassador: { cls: "bg-[#C08A8E]/10 text-[#C08A8E] border-[#C08A8E]/30", label: "⭐ Ambassadeur" },
  };
  const m = map[status] || { cls: "bg-gray-100 text-gray-700 border-gray-200", label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${m.cls}`}>
      {m.label}
    </span>
  );
}

function formatUrl(val: string, platform: string) {
  if (!val) return "#";
  if (val.startsWith("http")) return val;
  const v = val.replace(/^@/, "").trim();
  if (platform === "instagram") return `https://instagram.com/${v}`;
  if (platform === "tiktok") return `https://tiktok.com/@${v}`;
  if (platform === "youtube") return `https://youtube.com/@${v}`;
  return val;
}

function formatDisplay(val: string) {
  if (!val) return "";
  if (val.startsWith("http")) {
    try {
      const url = new URL(val);
      const path = url.pathname !== "/" ? url.pathname : "";
      return (url.hostname.replace("www.", "") + path).substring(0, 30) + (val.length > 30 ? "..." : "");
    } catch {
      return val.substring(0, 30);
    }
  }
  return val.startsWith("@") ? val : `@${val}`;
}

type Tab = "overview" | "creators" | "applications" | "settings";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "overview", label: "Vue d'ensemble", icon: BarChart2 },
  { id: "creators", label: "Créateurs", icon: Users },
  { id: "applications", label: "Candidatures", icon: FileText },
  { id: "settings", label: "Réglages du programme", icon: SlidersHorizontal },
];

const MONTHS_FR = ["", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

// ─────────────────────────────────────────────────────────────────────────

export function CreateursClient({
  applications,
  leaderboard,
  period,
  creators,
  initialConfig,
}: {
  applications: any[];
  leaderboard: any[];
  period: { year: number; month: number };
  creators: any[];
  initialConfig: any;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState("");

  const pendingCount = applications.filter((a) => a.status === "pending").length;

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setIsUpdating(newStatus);
    try {
      const res = await fetch(`/api/admin/ambassador-applications/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Erreur");
      setSelectedApp((prev: any) => (prev ? { ...prev, status: newStatus } : null));
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la mise à jour");
    } finally {
      setIsUpdating(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  // Overview KPIs
  const totalEligible = leaderboard.reduce((s, r) => s + (r.total_eligible_revenue || 0), 0);
  const totalCommissionDue = leaderboard.reduce((s, r) => s + (r.commission_status !== "paid" ? r.total_commission || 0 : 0), 0);
  const totalClicks = leaderboard.reduce((s, r) => s + (r.total_clicks || 0), 0);
  const totalOrders = leaderboard.reduce((s, r) => s + (r.total_orders || 0), 0);
  const conversionRate = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0;

  return (
    <div className="p-5 lg:p-8 space-y-6 max-w-[1200px] w-full pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-[#C08A8E]/10 rounded-xl text-[#C08A8E]">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-[#2A2424]">Créateurs Partenaires</h1>
          </div>
          <p className="text-[#2A2424]/60">
            Candidatures, codes, performance et réglages du programme — {MONTHS_FR[period.month]} {period.year}
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex overflow-x-auto hide-scrollbar bg-white p-1.5 rounded-2xl border border-[#EDE0E0] shadow-sm max-w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id ? "bg-[#2A2424] text-white shadow-md" : "text-[#2A2424]/60 hover:bg-[#F5F0EB] hover:text-[#2A2424]"
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
            {tab.id === "applications" && pendingCount > 0 && (
              <span className="bg-[#C2164A] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <OverviewTab
          leaderboard={leaderboard}
          totalEligible={totalEligible}
          totalCommissionDue={totalCommissionDue}
          totalClicks={totalClicks}
          conversionRate={conversionRate}
          activeCreators={creators.filter((c) => c.status !== "suspended").length}
        />
      )}

      {activeTab === "creators" && (
        <CreatorsTab
          creators={creators}
          config={initialConfig}
          onChanged={() => router.refresh()}
          copiedCode={copiedCode}
          onCopy={copyToClipboard}
        />
      )}

      {activeTab === "applications" && (
        <ApplicationsTab
          applications={applications}
          selectedApp={selectedApp}
          setSelectedApp={setSelectedApp}
          handleUpdateStatus={handleUpdateStatus}
          isUpdating={isUpdating}
        />
      )}

      {activeTab === "settings" && <SettingsTab initialConfig={initialConfig} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Vue d'ensemble
// ─────────────────────────────────────────────────────────────────────────

function Kpi({ icon: Icon, iconBg, iconColor, label, value }: any) {
  return (
    <div className="p-4 border border-[#EDE0E0] rounded-xl flex items-start gap-4 bg-white">
      <div className={`p-2 rounded-lg ${iconBg} ${iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-[#2A2424] mt-1">{value}</p>
      </div>
    </div>
  );
}

function OverviewTab({ leaderboard, totalEligible, totalCommissionDue, totalClicks, conversionRate, activeCreators }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Kpi icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" label="Créateurs actifs" value={activeCreators} />
        <Kpi icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="CA net éligible (mois)" value={`${fmt(totalEligible)} FCFA`} />
        <Kpi icon={DollarSign} iconBg="bg-rose-50" iconColor="text-rose-600" label="Commissions dues" value={`${fmt(totalCommissionDue)} FCFA`} />
        <Kpi icon={MousePointerClick} iconBg="bg-purple-50" iconColor="text-purple-600" label={`Clics · ${conversionRate.toFixed(1)}% conversion`} value={fmt(totalClicks)} />
      </div>

      <div className="bg-white border border-[#EDE0E0] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#EDE0E0] flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#C08A8E]" />
          <h2 className="text-sm font-bold text-[#2A2424]">Classement du mois</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 text-gray-500 font-medium border-b border-[#EDE0E0]">
              <tr>
                <th className="py-3 px-6 font-medium">#</th>
                <th className="py-3 px-6 font-medium">Créateur</th>
                <th className="py-3 px-6 font-medium text-right">CA net éligible</th>
                <th className="py-3 px-6 font-medium text-right">Commandes</th>
                <th className="py-3 px-6 font-medium text-right">Taux</th>
                <th className="py-3 px-6 font-medium text-right">Commission</th>
                <th className="py-3 px-6 font-medium text-right">Statut paiement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE0E0]">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    Aucune performance enregistrée ce mois-ci.
                  </td>
                </tr>
              ) : (
                leaderboard.map((row: any) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-[#2A2424]/50">{row.rank}</td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-[#2A2424] flex items-center gap-1.5">
                        {row.creator?.first_name} {row.creator?.last_name}
                        {row.creator?.is_creator_of_month && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">{row.creator?.code}</div>
                    </td>
                    <td className="py-4 px-6 text-right font-medium">{fmt(row.total_eligible_revenue)} FCFA</td>
                    <td className="py-4 px-6 text-right">{row.total_orders}</td>
                    <td className="py-4 px-6 text-right">{row.commission_rate}%</td>
                    <td className="py-4 px-6 text-right font-medium text-[#C08A8E]">{fmt(row.total_commission)} FCFA</td>
                    <td className="py-4 px-6 text-right">
                      <StatusBadge status={row.commission_status === "paid" ? "active" : row.commission_status === "validated" ? "ambassador" : "pending"} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Créateurs
// ─────────────────────────────────────────────────────────────────────────

function CreatorsTab({ creators, config, onChanged, copiedCode, onCopy }: any) {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const defaultDiscount = config?.new_customer_discount_pct ?? 5;
  const defaultTiers = Array.isArray(config?.commission_tiers) ? config.commission_tiers : [{ rate: 3 }];
  const defaultRate = [...defaultTiers].sort((a: any, b: any) => a.min - b.min)[0]?.rate ?? 3;

  const [form, setForm] = useState({
    code: "",
    first_name: "",
    last_name: "",
    email: "",
    discount: defaultDiscount,
    rate: defaultRate,
    customer_id: "",
  });

  const filtered = creators.filter((c: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.code?.toLowerCase().includes(q) ||
      c.first_name?.toLowerCase().includes(q) ||
      c.last_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  const handleCreate = async () => {
    setCreateError("");
    if (!form.code.trim()) return setCreateError("Le code promo est requis.");
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
      return setCreateError("Prénom, nom et email sont requis.");
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/creator-partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.trim(),
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim(),
          discount: form.discount,
          rate: form.rate,
          customer_id: form.customer_id.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setCreateError(data.error || "Une erreur est survenue.");
      setForm({ code: "", first_name: "", last_name: "", email: "", discount: defaultDiscount, rate: defaultRate, customer_id: "" });
      setShowCreate(false);
      onChanged();
    } catch (e) {
      setCreateError("Impossible de contacter le serveur.");
    } finally {
      setCreating(false);
    }
  };

  const toggleCreatorOfMonth = async (creator: any) => {
    setUpdatingId(creator.id);
    try {
      const willActivate = !creator.is_creator_of_month;
      const durationHours = config?.creator_of_month_duration_hours ?? 72;
      const until = willActivate ? new Date(Date.now() + durationHours * 3600 * 1000).toISOString() : null;
      const res = await fetch(`/api/admin/creator-partners/${creator.id}/creator-of-month`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active: willActivate,
          until,
          bonus_pct: config?.creator_of_month_bonus_pct ?? 2,
          free_shipping: config?.creator_of_month_free_shipping ?? true,
        }),
      });
      if (!res.ok) throw new Error();
      onChanged();
    } catch (e) {
      alert("Erreur lors de la mise à jour du statut Créateur du mois.");
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un créateur, un code, un email..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C08A8E]/20"
          />
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="bg-[#2A2424] text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-[#2A2424]/90 transition-colors"
        >
          {showCreate ? "Fermer" : <><Plus className="w-4 h-4" /> Nouveau créateur</>}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
          <h2 className="text-sm font-bold text-[#2A2424] mb-4">Créer un créateur partenaire</h2>

          {createError && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm px-4 py-3">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {createError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Code Promo (ex: AWA5)">
              <input className="admin-input font-bold" placeholder="Code unique" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            </Field>
            <Field label="Prénom">
              <input className="admin-input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </Field>
            <Field label="Nom">
              <input className="admin-input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </Field>
            <Field label="Email">
              <input type="email" className="admin-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Réduction Client (%)">
              <input type="number" min={1} max={100} className="admin-input" value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} />
            </Field>
            <Field label="Commission de départ (%)">
              <input type="number" min={0} max={100} className="admin-input" value={form.rate} onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })} />
            </Field>
            <div className="md:col-span-2">
              <Field label="ID Client Medusa (optionnel)">
                <input className="admin-input" placeholder="cus_..." value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} />
              </Field>
            </div>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="self-end bg-[#E5B6B9] text-[#2A2424] font-bold px-4 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-[#D5A6A9] transition-colors disabled:opacity-60"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Créer le code"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-[#EDE0E0] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 text-gray-500 font-medium border-b border-[#EDE0E0]">
              <tr>
                <th className="py-3 px-6 font-medium">Créateur</th>
                <th className="py-3 px-6 font-medium">Code</th>
                <th className="py-3 px-6 font-medium">Statut</th>
                <th className="py-3 px-6 font-medium text-right">Créateur du mois</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE0E0]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">Aucun créateur trouvé.</td>
                </tr>
              ) : (
                filtered.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-[#2A2424]">{c.first_name} {c.last_name}</div>
                      <div className="text-xs text-gray-500">{c.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => onCopy(c.referral_link || c.code)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-lg text-xs font-mono hover:bg-gray-200 transition-colors"
                        title="Copier le lien de parrainage"
                      >
                        {c.code}
                        {copiedCode === (c.referral_link || c.code) ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-gray-400" />}
                      </button>
                    </td>
                    <td className="py-4 px-6"><StatusBadge status={c.status} /></td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => toggleCreatorOfMonth(c)}
                        disabled={updatingId === c.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                          c.is_creator_of_month ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {updatingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crown className="w-3.5 h-3.5" />}
                        {c.is_creator_of_month ? "Actif" : "Désigner"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#2A2424]/60 mb-1">{label}</label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Candidatures
// ─────────────────────────────────────────────────────────────────────────

function ApplicationsTab({ applications, selectedApp, setSelectedApp, handleUpdateStatus, isUpdating }: any) {
  const [search, setSearch] = useState("");
  const filtered = applications.filter((a: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return `${a.first_name} ${a.last_name} ${a.email}`.toLowerCase().includes(q);
  });

  return (
    <div className="bg-white rounded-2xl border border-[#EDE0E0] overflow-hidden shadow-sm">
      <div className="p-4 border-b border-[#EDE0E0] flex items-center justify-between gap-4 bg-gray-50/50">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une candidature..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C08A8E]/20"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/80 text-gray-500 font-medium border-b border-[#EDE0E0]">
            <tr>
              <th className="py-3 px-6 font-medium">Candidat(e)</th>
              <th className="py-3 px-6 font-medium">Contact</th>
              <th className="py-3 px-6 font-medium">Localisation</th>
              <th className="py-3 px-6 font-medium">Réseaux</th>
              <th className="py-3 px-6 font-medium">Statut</th>
              <th className="py-3 px-6 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDE0E0]">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-gray-500">Aucune candidature trouvée.</td></tr>
            ) : (
              filtered.map((app: any) => (
                <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-semibold text-[#2A2424]">{app.first_name} {app.last_name}</div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-[200px]" title={app.motivation}>{app.motivation}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-[#2A2424]">{app.email}</div>
                    <div className="text-xs text-gray-500">{app.phone || "-"}</div>
                  </td>
                  <td className="py-4 px-6 text-[#2A2424]/80">
                    {[app.city, app.country].filter(Boolean).join(", ") || "-"}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1 text-xs text-blue-600">
                      {app.instagram && <a href={formatUrl(app.instagram, "instagram")} target="_blank" rel="noreferrer" className="hover:underline">Instagram</a>}
                      {app.tiktok && <a href={formatUrl(app.tiktok, "tiktok")} target="_blank" rel="noreferrer" className="hover:underline">TikTok</a>}
                      {app.youtube && <a href={formatUrl(app.youtube, "youtube")} target="_blank" rel="noreferrer" className="hover:underline">YouTube</a>}
                      {app.media_kit_url && <a href={app.media_kit_url} target="_blank" rel="noreferrer" className="hover:underline">Media kit</a>}
                    </div>
                  </td>
                  <td className="py-4 px-6"><StatusBadge status={app.status} /></td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      Voir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedApp && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedApp(null)}
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-[#EDE0E0]">
                <div>
                  <h2 className="text-xl font-bold text-[#2A2424]">Fiche Candidature</h2>
                  <p className="text-sm text-gray-500 mt-1">Candidature au programme Créateurs Partenaires</p>
                </div>
                <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#F5F0EB] rounded-full flex items-center justify-center text-[#2A2424] text-xl font-bold">
                      {selectedApp.first_name[0]}{selectedApp.last_name[0]}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-[#2A2424]">{selectedApp.first_name} {selectedApp.last_name}</h3>
                      <p className="text-[#2A2424]/60">{selectedApp.email}</p>
                    </div>
                  </div>
                  <StatusBadge status={selectedApp.status} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Informations générales</h4>
                    <ul className="space-y-3">
                      <li className="flex justify-between text-sm"><span className="text-gray-500">Téléphone</span><span className="font-medium text-[#2A2424]">{selectedApp.phone || "-"}</span></li>
                      <li className="flex justify-between text-sm"><span className="text-gray-500">Localisation</span><span className="font-medium text-[#2A2424]">{[selectedApp.city, selectedApp.country].filter(Boolean).join(", ") || "-"}</span></li>
                      <li className="flex justify-between text-sm"><span className="text-gray-500">Taille communauté</span><span className="font-medium text-[#2A2424]">{selectedApp.followers}</span></li>
                      <li className="flex justify-between text-sm"><span className="text-gray-500">Type de contenu</span><span className="font-medium text-[#2A2424]">{selectedApp.content_type}</span></li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Réseaux & media kit</h4>
                    <ul className="space-y-3">
                      {selectedApp.instagram && (
                        <li className="flex justify-between text-sm items-center"><span className="text-gray-500">Instagram</span>
                          <a href={formatUrl(selectedApp.instagram, "instagram")} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium text-blue-600 hover:underline text-right break-all ml-4">{formatDisplay(selectedApp.instagram)} <ExternalLink className="w-3 h-3 flex-shrink-0" /></a>
                        </li>
                      )}
                      {selectedApp.tiktok && (
                        <li className="flex justify-between text-sm items-center"><span className="text-gray-500">TikTok</span>
                          <a href={formatUrl(selectedApp.tiktok, "tiktok")} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium text-blue-600 hover:underline text-right break-all ml-4">{formatDisplay(selectedApp.tiktok)} <ExternalLink className="w-3 h-3 flex-shrink-0" /></a>
                        </li>
                      )}
                      {selectedApp.youtube && (
                        <li className="flex justify-between text-sm items-center"><span className="text-gray-500">YouTube</span>
                          <a href={formatUrl(selectedApp.youtube, "youtube")} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium text-blue-600 hover:underline text-right break-all ml-4">{formatDisplay(selectedApp.youtube)} <ExternalLink className="w-3 h-3 flex-shrink-0" /></a>
                        </li>
                      )}
                      {selectedApp.other_link && (
                        <li className="flex justify-between text-sm items-center"><span className="text-gray-500">Autre lien</span>
                          <a href={formatUrl(selectedApp.other_link, "other")} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium text-blue-600 hover:underline text-right break-all ml-4">{formatDisplay(selectedApp.other_link)} <ExternalLink className="w-3 h-3 flex-shrink-0" /></a>
                        </li>
                      )}
                      {selectedApp.media_kit_url && (
                        <li className="flex justify-between text-sm items-center"><span className="text-gray-500">Media kit</span>
                          <a href={selectedApp.media_kit_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium text-blue-600 hover:underline text-right break-all ml-4">{formatDisplay(selectedApp.media_kit_url)} <ExternalLink className="w-3 h-3 flex-shrink-0" /></a>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Motivation</h4>
                  <div className="bg-gray-50 p-4 rounded-xl text-sm text-[#2A2424] whitespace-pre-wrap leading-relaxed border border-gray-100">{selectedApp.motivation}</div>
                </div>
              </div>

              <div className="p-6 border-t border-[#EDE0E0] bg-gray-50/50 flex items-center justify-end gap-3">
                <button onClick={() => setSelectedApp(null)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors">Fermer</button>
                {selectedApp.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedApp.id, "rejected")}
                      disabled={isUpdating !== null}
                      className="flex items-center justify-center min-w-[120px] px-5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-200 disabled:opacity-50"
                    >
                      {isUpdating === "rejected" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refuser"}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedApp.id, "approved")}
                      disabled={isUpdating !== null}
                      className="flex items-center justify-center min-w-[200px] px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#2A2424] hover:bg-black transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isUpdating === "approved" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approuver la candidature"}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Réglages du programme
// ─────────────────────────────────────────────────────────────────────────

type Tier = { min: number; max: number | null; rate: number };

function SettingsTab({ initialConfig }: { initialConfig: any }) {
  const cfg = initialConfig || {};
  const [newDiscount, setNewDiscount] = useState<number>(cfg.new_customer_discount_pct ?? 5);
  const [returningDiscount, setReturningDiscount] = useState<number>(cfg.returning_customer_discount_pct ?? 2);
  const [tiers, setTiers] = useState<Tier[]>(
    Array.isArray(cfg.commission_tiers) && cfg.commission_tiers.length
      ? cfg.commission_tiers
      : [{ min: 0, max: 599999, rate: 3 }, { min: 600000, max: 999999, rate: 4 }, { min: 1000000, max: null, rate: 6 }]
  );
  const feeRates = cfg.payment_fee_rates || { default: 2.5, pawapay: 2.5, card: 2.5 };
  const [feeDefault, setFeeDefault] = useState<number>(feeRates.default ?? 2.5);
  const [feePawapay, setFeePawapay] = useState<number>(feeRates.pawapay ?? 2.5);
  const [feeCard, setFeeCard] = useState<number>(feeRates.card ?? 2.5);
  const [launchActive, setLaunchActive] = useState<boolean>(!!cfg.launch_promo_active);
  const [launchDiscount, setLaunchDiscount] = useState<number>(cfg.launch_promo_discount_pct ?? 10);
  const [launchEndsAt, setLaunchEndsAt] = useState<string>(cfg.launch_promo_ends_at ? String(cfg.launch_promo_ends_at).slice(0, 16) : "");
  const [comBonus, setComBonus] = useState<number>(cfg.creator_of_month_bonus_pct ?? 2);
  const [comFreeShipping, setComFreeShipping] = useState<boolean>(cfg.creator_of_month_free_shipping ?? true);
  const [comDuration, setComDuration] = useState<number>(cfg.creator_of_month_duration_hours ?? 72);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const addTier = () => {
    const last = tiers[tiers.length - 1];
    setTiers([...tiers, { min: (last?.max ?? 0) + 1, max: null, rate: (last?.rate ?? 3) + 1 }]);
  };
  const removeTier = (idx: number) => setTiers(tiers.filter((_, i) => i !== idx));
  const updateTier = (idx: number, patch: Partial<Tier>) => setTiers(tiers.map((t, i) => (i === idx ? { ...t, ...patch } : t)));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/admin/program-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_customer_discount_pct: newDiscount,
          returning_customer_discount_pct: returningDiscount,
          commission_tiers: tiers,
          payment_fee_rates: { default: feeDefault, pawapay: feePawapay, card: feeCard },
          launch_promo_active: launchActive,
          launch_promo_discount_pct: launchDiscount,
          launch_promo_ends_at: launchEndsAt || null,
          creator_of_month_bonus_pct: comBonus,
          creator_of_month_free_shipping: comFreeShipping,
          creator_of_month_duration_hours: comDuration,
        }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError("Impossible d'enregistrer les réglages. Veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm px-4 py-3">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}

      <Section title="Réduction client par code créateur">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nouvelle cliente — 1ère commande (%)">
            <input type="number" min={0} max={100} className="admin-input" value={newDiscount} onChange={(e) => setNewDiscount(Number(e.target.value))} />
          </Field>
          <Field label="Cliente récurrente — commandes suivantes (%)">
            <input type="number" min={0} max={100} className="admin-input" value={returningDiscount} onChange={(e) => setReturningDiscount(Number(e.target.value))} />
          </Field>
        </div>
      </Section>

      <Section title="Paliers de commission mensuelle" description="S'applique au CA net éligible cumulé du mois. Le taux ne s'applique qu'aux ventes réalisées après le franchissement d'un palier (jamais rétroactif).">
        <div className="space-y-2">
          {tiers.map((t, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
              <Field label={i === 0 ? "De (FCFA)" : ""}>
                <input type="number" className="admin-input" value={t.min} onChange={(e) => updateTier(i, { min: Number(e.target.value) })} />
              </Field>
              <Field label={i === 0 ? "À (vide = illimité)" : ""}>
                <input
                  type="number"
                  className="admin-input"
                  value={t.max ?? ""}
                  placeholder="∞"
                  onChange={(e) => updateTier(i, { max: e.target.value === "" ? null : Number(e.target.value) })}
                />
              </Field>
              <Field label={i === 0 ? "Taux (%)" : ""}>
                <input type="number" className="admin-input" value={t.rate} onChange={(e) => updateTier(i, { rate: Number(e.target.value) })} />
              </Field>
              <button onClick={() => removeTier(i)} className="p-2.5 text-gray-400 hover:text-rose-600 transition-colors" title="Supprimer ce palier">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button onClick={addTier} className="flex items-center gap-1.5 text-xs font-semibold text-[#C08A8E] hover:text-[#2A2424] transition-colors mt-2">
            <Plus className="w-3.5 h-3.5" /> Ajouter un palier
          </button>
        </div>
      </Section>

      <Section title="Frais de paiement (déduits du CA net éligible)">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Par défaut (%)"><input type="number" step={0.1} className="admin-input" value={feeDefault} onChange={(e) => setFeeDefault(Number(e.target.value))} /></Field>
          <Field label="PawaPay (%)"><input type="number" step={0.1} className="admin-input" value={feePawapay} onChange={(e) => setFeePawapay(Number(e.target.value))} /></Field>
          <Field label="Carte (%)"><input type="number" step={0.1} className="admin-input" value={feeCard} onChange={(e) => setFeeCard(Number(e.target.value))} /></Field>
        </div>
      </Section>

      <Section title="Offre de lancement" description="Non cumulable avec les codes créateurs — le client bénéficie du taux le plus fort, la vente reste attribuée au créateur.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <label className="flex items-center gap-2 text-sm font-medium text-[#2A2424]">
            <input type="checkbox" checked={launchActive} onChange={(e) => setLaunchActive(e.target.checked)} className="w-4 h-4 rounded accent-[#2A2424]" />
            Offre active
          </label>
          <Field label="Réduction (%)"><input type="number" className="admin-input" value={launchDiscount} onChange={(e) => setLaunchDiscount(Number(e.target.value))} /></Field>
          <Field label="Fin de l'offre"><input type="datetime-local" className="admin-input" value={launchEndsAt} onChange={(e) => setLaunchEndsAt(e.target.value)} /></Field>
        </div>
      </Section>

      <Section title="Avantage « Créateur du mois »" description="Valeurs par défaut appliquées quand un créateur est désigné depuis l'onglet Créateurs.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Field label="Bonus commission (+%)"><input type="number" className="admin-input" value={comBonus} onChange={(e) => setComBonus(Number(e.target.value))} /></Field>
          <label className="flex items-center gap-2 text-sm font-medium text-[#2A2424]">
            <input type="checkbox" checked={comFreeShipping} onChange={(e) => setComFreeShipping(e.target.checked)} className="w-4 h-4 rounded accent-[#2A2424]" />
            Livraison offerte
          </label>
          <Field label="Durée (heures)"><input type="number" className="admin-input" value={comDuration} onChange={(e) => setComDuration(Number(e.target.value))} /></Field>
        </div>
      </Section>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#2A2424] text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-black transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Enregistrer les réglages
        </button>
        <AnimatePresence>
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-sm font-medium text-emerald-600"
            >
              <CheckCircle2 className="w-4 h-4" /> Réglages enregistrés
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
      <h2 className="text-sm font-bold text-[#2A2424] mb-1">{title}</h2>
      {description && <p className="text-xs text-gray-500 mb-4">{description}</p>}
      {!description && <div className="mb-4" />}
      {children}
    </div>
  );
}
