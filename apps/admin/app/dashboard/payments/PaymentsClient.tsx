"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wallet, ArrowUpRight, RefreshCw, Download, Search, Smartphone, TrendingUp, Receipt, Percent,
  AlertTriangle, CheckCircle2, Clock, XCircle, Loader2, X, Info, Scale,
} from "lucide-react";
import { requestPayoutAction } from "../../actions/payments";

// Admin "Paiements": the Mobile Money money thewelfarecm.com customers paid through PawaPay, the shop's
// balance computed from those payments (never the PawaPay wallet balance, which can include other
// activities), and withdrawals to the shop's own Mobile Money account. Data: GET /admin/pawapay/overview.

export type PaymentRow = {
  payment_id: string;
  order_id: string;
  display_id: number | null;
  created_at: string;
  customer: string;
  email: string | null;
  payer: string | null;
  order_amount: number;
  charged: number;
  fee: number;
  deposit_id: string | null;
  refunded: number;
  order_status: string;
};

export type PayoutRow = {
  payoutId: string;
  amount: number;
  currency: string;
  correspondent: string;
  msisdn: string;
  status: string;
  failure?: string;
  note?: string;
  created_at: string;
};

export type Overview = {
  balance: { amount: number; currency: string };
  stats: {
    received: number;
    payments_count: number;
    fees: number;
    received_this_month: number;
    refunded: number;
    withdrawn: number;
    withdrawing: number;
  };
  daily: { date: string; amount: number; count: number }[];
  payments: PaymentRow[];
  payouts: PayoutRow[];
  payout: {
    enabled: boolean;
    correspondents: { correspondent: string; min: number; max: number }[];
    recipients: string[];
    config_error: string | null;
  };
};

const fcfa = (n: number) => `${new Intl.NumberFormat("fr-FR").format(Math.round(n || 0))} FCFA`;
const num = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n || 0));

function formatMsisdn(m?: string | null) {
  if (!m) return "—";
  const local = m.startsWith("237") ? m.slice(3) : m;
  if (local.length !== 9) return m;
  return `+237 ${local[0]} ${local.slice(1, 3)} ${local.slice(3, 5)} ${local.slice(5, 7)} ${local.slice(7)}`;
}

function formatDate(iso: string, withTime = true) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

const PAYOUT_STATUS: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  COMPLETED: { label: "Reçu", className: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  ACCEPTED: { label: "En cours", className: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="w-3.5 h-3.5" /> },
  ENQUEUED: { label: "En file", className: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="w-3.5 h-3.5" /> },
  SUBMITTED: { label: "Envoyé", className: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="w-3.5 h-3.5" /> },
  REJECTED: { label: "Refusé", className: "bg-red-50 text-red-600 border-red-200", icon: <XCircle className="w-3.5 h-3.5" /> },
  FAILED: { label: "Échoué", className: "bg-red-50 text-red-600 border-red-200", icon: <XCircle className="w-3.5 h-3.5" /> },
};

function Kpi({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#EDE0E0] p-5 shadow-sm">
      <div className="flex items-center gap-2 text-[#2A2424]/50">
        <span className="w-8 h-8 rounded-xl bg-[#F4EAEB] text-[#C08A8E] flex items-center justify-center">{icon}</span>
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="text-xl font-bold text-[#2A2424] mt-3" style={{ letterSpacing: "-0.02em" }}>{value}</p>
      {hint && <p className="text-[11px] text-[#2A2424]/40 mt-1">{hint}</p>}
    </div>
  );
}

function PayoutModal({ overview, onClose }: { overview: Overview; onClose: () => void }) {
  const router = useRouter();
  const { recipients, correspondents, enabled } = overview.payout;
  const balance = Math.floor(overview.balance.amount || 0);
  const limit = correspondents.find((c) => c.correspondent.startsWith("MTN")) || correspondents[0];
  const maxAllowed = Math.max(0, Math.min(balance, limit?.max || balance));

  const [msisdn, setMsisdn] = useState(recipients[0] || "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const value = Math.floor(Number(amount) || 0);
  const amountError =
    !amount ? "" :
    value <= 0 ? "Montant invalide." :
    value > balance ? "Supérieur au solde disponible." :
    limit && value < limit.min ? `Minimum ${num(limit.min)} FCFA par retrait.` :
    limit && limit.max > 0 && value > limit.max ? `Maximum ${num(limit.max)} FCFA par retrait.` : "";
  const blocked = !enabled || !recipients.length || balance <= 0;
  const canSend = !blocked && !!msisdn && value > 0 && !amountError && confirmed && !sending;

  const send = async () => {
    setSending(true);
    const res = await requestPayoutAction(value, msisdn, note);
    setSending(false);
    if (res.success) {
      setResult({ ok: true, message: `Retrait de ${fcfa(value)} lancé vers ${formatMsisdn(msisdn)}. Il apparaît dans l'historique ; son statut se met à jour à chaque visite de la page.` });
      router.refresh();
    } else {
      setResult({ ok: false, message: res.error || "Retrait refusé." });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => !sending && onClose()}>
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-[#2A2424]">Retirer vers Mobile Money</h3>
            <p className="text-xs text-[#2A2424]/50 mt-0.5">Solde disponible : <strong className="text-[#2A2424]">{fcfa(balance)}</strong></p>
          </div>
          <button onClick={onClose} disabled={sending} className="p-1.5 rounded-full hover:bg-[#F5F0EB]" aria-label="Fermer"><X className="w-4 h-4" /></button>
        </div>

        {!enabled && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
            <p className="font-bold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Retraits non activés</p>
            <p className="mt-1 text-xs leading-relaxed">
              Votre compte PawaPay n&apos;a pas encore l&apos;autorisation d&apos;envoyer de l&apos;argent (« payouts »). Demandez à votre
              contact PawaPay d&apos;activer les payouts pour <strong>MTN_MOMO_CMR</strong> : le bouton fonctionnera dès que c&apos;est fait.
            </p>
          </div>
        )}
        {enabled && !recipients.length && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 leading-relaxed">
            <p className="font-bold text-sm flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Aucun numéro de retrait configuré</p>
            Par sécurité, les numéros qui peuvent recevoir un retrait sont définis sur le serveur
            (variable <code>PAWAPAY_PAYOUT_RECIPIENTS</code>), pas dans l&apos;admin.
          </div>
        )}

        {result ? (
          <div className={`rounded-2xl p-4 text-sm ${result.ok ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-red-50 border border-red-200 text-red-700"}`}>
            {result.message}
            <button onClick={onClose} className="mt-3 w-full py-2.5 rounded-xl bg-[#2A2424] text-white text-sm font-bold">Fermer</button>
          </div>
        ) : (
          <div className={`space-y-4 ${blocked ? "opacity-50 pointer-events-none" : ""}`}>
            <div>
              <label className="block text-[11px] font-bold text-[#2A2424]/60 mb-1.5 uppercase tracking-widest">Compte Mobile Money</label>
              {recipients.length > 1 ? (
                <select value={msisdn} onChange={(e) => setMsisdn(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-[#EDE0E0] bg-[#FDFBF7] text-sm font-mono">
                  {recipients.map((r) => <option key={r} value={r}>{formatMsisdn(r)}</option>)}
                </select>
              ) : (
                <div className="px-4 py-3 rounded-xl border border-[#EDE0E0] bg-[#FDFBF7] text-sm font-mono flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#C08A8E]" /> {formatMsisdn(recipients[0])}
                </div>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#2A2424]/60 mb-1.5 uppercase tracking-widest">Montant</label>
              <div className="relative">
                <input
                  type="number" inputMode="numeric" min="1" value={amount} onChange={(e) => { setAmount(e.target.value); setConfirmed(false); }}
                  placeholder="0" className="w-full pl-4 pr-28 py-3 rounded-xl border border-[#EDE0E0] bg-[#FDFBF7] text-lg font-bold outline-none focus:border-[#C08A8E]"
                />
                <button type="button" onClick={() => { setAmount(String(maxAllowed)); setConfirmed(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-[#F4EAEB] text-[#A0646A] text-xs font-bold">
                  Tout ({num(maxAllowed)})
                </button>
              </div>
              {amountError && <p className="text-[11px] text-red-600 mt-1">{amountError}</p>}
              {limit && <p className="text-[11px] text-[#2A2424]/40 mt-1">Limites PawaPay : {num(limit.min)} à {num(limit.max)} FCFA par retrait.</p>}
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#2A2424]/60 mb-1.5 uppercase tracking-widest">Note (optionnel)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} placeholder="ex : retrait fin de semaine" className="w-full px-4 py-2.5 rounded-xl border border-[#EDE0E0] bg-[#FDFBF7] text-sm" />
            </div>
            <label className="flex items-start gap-2 text-xs text-[#2A2424]/70 cursor-pointer">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5" />
              <span>Je confirme le retrait de <strong>{value > 0 ? fcfa(value) : "—"}</strong> vers <strong>{formatMsisdn(msisdn)}</strong>. Cette opération ne peut pas être annulée.</span>
            </label>
            <button
              onClick={send} disabled={!canSend}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#2A2424] text-white text-sm font-bold disabled:opacity-40"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
              Lancer le retrait
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentsClient({ overview, error }: { overview: Overview | null; error: string }) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [showPayout, setShowPayout] = useState(false);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<"7" | "30" | "all">("30");

  const payments = useMemo(() => overview?.payments ?? [], [overview]);
  const filtered = useMemo(() => {
    const since = period === "all" ? 0 : Date.now() - Number(period) * 24 * 3600 * 1000;
    const q = search.trim().toLowerCase();
    return payments.filter((p) =>
      new Date(p.created_at).getTime() >= since &&
      (!q || [p.customer, p.email, p.payer, p.display_id ? `wlf-${p.display_id}` : "", p.deposit_id].some((v) => v && String(v).toLowerCase().includes(q)))
    );
  }, [payments, search, period]);
  const filteredTotal = filtered.reduce((s, p) => s + p.charged, 0);

  const refresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 1200);
  };

  const exportCsv = () => {
    const header = ["Date", "Commande", "Client", "Email", "Numéro débité", "Montant commande", "Frais Mobile Money", "Montant débité", "Remboursement enregistré", "Statut commande", "Référence PawaPay"];
    const lines = filtered.map((p) => [
      new Date(p.created_at).toISOString(), p.display_id ? `WLF-${p.display_id}` : p.order_id, p.customer, p.email || "",
      p.payer || "", p.order_amount, p.fee, p.charged, p.refunded, p.order_status, p.deposit_id || "",
    ]);
    const csv = [header, ...lines].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `paiements-pawapay-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!overview) {
    return (
      <div className="p-5 lg:p-8">
        <h1 className="text-2xl font-bold text-[#2A2424]">Paiements</h1>
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 text-sm">{error || "Impossible de charger les paiements."}</div>
      </div>
    );
  }

  const { stats, balance, payout } = overview;
  const maxDay = Math.max(1, ...overview.daily.map((d) => d.amount));
  const avg = stats.payments_count ? stats.received / stats.payments_count : 0;

  return (
    <div className="p-5 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2A2424]" style={{ letterSpacing: "-0.02em" }}>Paiements</h1>
          <p className="text-sm text-[#2A2424]/40 mt-0.5">Mobile Money encaissé via PawaPay</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="flex items-center gap-2 px-3 py-2 bg-white border border-[#EDE0E0] rounded-xl text-sm font-semibold text-[#2A2424]/70 hover:text-[#2A2424]">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Actualiser
          </button>
          <button onClick={exportCsv} className="flex items-center gap-2 px-3 py-2 bg-white border border-[#EDE0E0] rounded-xl text-sm font-semibold text-[#2A2424]/70 hover:text-[#2A2424]">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Balance + KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:row-span-2 relative overflow-hidden rounded-3xl bg-[#2A2424] text-white p-6 shadow-lg">
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-[#C08A8E]/25 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-white/60 text-xs font-semibold">
              <Wallet className="w-4 h-4" /> Solde disponible
            </div>
            <p className="text-4xl font-bold mt-3" style={{ letterSpacing: "-0.03em" }}>
              {num(balance.amount)} <span className="text-base font-semibold text-white/50">{balance.currency}</span>
            </p>
            <p className="text-[11px] text-white/40 mt-1">Paiements thewelfarecm.com validés, moins remboursements et retraits</p>

            <button
              onClick={() => setShowPayout(true)}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white text-[#2A2424] text-sm font-bold hover:bg-[#F4EAEB] transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" /> Retirer vers Mobile Money
            </button>
            {!payout.enabled && (
              <p className="mt-3 text-[11px] text-amber-200/90 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" /> Retraits pas encore activés par PawaPay sur ce compte.
              </p>
            )}
            {stats.withdrawing > 0 && (
              <p className="mt-2 text-[11px] text-white/60">{fcfa(stats.withdrawing)} en cours de retrait.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <Kpi icon={<TrendingUp className="w-4 h-4" />} label="Total encaissé" value={fcfa(stats.received)} hint="Paiements Mobile Money validés" />
          <Kpi icon={<Receipt className="w-4 h-4" />} label="Ce mois-ci" value={fcfa(stats.received_this_month)} hint={new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })} />
          <Kpi icon={<Smartphone className="w-4 h-4" />} label="Paiements" value={num(stats.payments_count)} hint={`Panier moyen ${fcfa(avg)}`} />
          <Kpi icon={<Percent className="w-4 h-4" />} label="Frais Mobile Money perçus" value={fcfa(stats.fees)} hint="Les 3 % payés par les clients" />
        </div>
      </div>

      {/* Reconciliation + chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-[#EDE0E0] p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[#2A2424] flex items-center gap-2 mb-4"><Scale className="w-4 h-4 text-[#C08A8E]" /> Détail du solde</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between text-[#2A2424]/60"><dt>Paiements validés</dt><dd>{fcfa(stats.received)}</dd></div>
            {stats.refunded > 0 && <div className="flex justify-between text-[#2A2424]/60"><dt>Remboursements</dt><dd>−{fcfa(stats.refunded)}</dd></div>}
            <div className="flex justify-between text-[#2A2424]/60"><dt>Retraits effectués</dt><dd>−{fcfa(stats.withdrawn)}</dd></div>
            {stats.withdrawing > 0 && <div className="flex justify-between text-[#2A2424]/60"><dt>Retraits en cours</dt><dd>−{fcfa(stats.withdrawing)}</dd></div>}
            <div className="flex justify-between font-bold text-[#2A2424] pt-2 border-t border-[#F5F0EB]"><dt>Solde disponible</dt><dd>{fcfa(balance.amount)}</dd></div>
          </dl>
          <p className="text-[11px] text-[#2A2424]/40 mt-3 leading-relaxed flex gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0 mt-px" /> Calculé uniquement à partir des commandes payées sur thewelfarecm.com. La commission éventuelle de PawaPay n&apos;est pas déduite.
          </p>
          {stats.refunded > 0 && (
            <p className="text-[11px] text-amber-700 mt-2 leading-relaxed">
              Les remboursements enregistrés dans l&apos;admin doivent être effectués depuis PawaPay : ils ne sont pas automatiques.
            </p>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EDE0E0] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#2A2424]">Encaissements des 30 derniers jours</h2>
            <span className="text-xs text-[#2A2424]/40">{fcfa(overview.daily.reduce((s, d) => s + d.amount, 0))}</span>
          </div>
          <div className="flex items-end gap-[3px] h-36">
            {overview.daily.map((d) => (
              <div key={d.date} className="flex-1 h-full flex flex-col justify-end group relative">
                <div
                  className={`w-full rounded-t-md ${d.amount > 0 ? "bg-[#C08A8E] group-hover:bg-[#2A2424]" : "bg-[#F5F0EB]"} transition-colors`}
                  style={{ height: d.amount > 0 ? `${Math.max(6, (d.amount / maxDay) * 100)}%` : "4px" }}
                />
                <div className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap bg-[#2A2424] text-white text-[11px] rounded-lg px-2 py-1 z-10">
                  {new Date(d.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} · {fcfa(d.amount)} · {d.count} paiement{d.count > 1 ? "s" : ""}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-[#2A2424]/35 mt-2">
            <span>{new Date(overview.daily[0]?.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</span>
            <span>Aujourd&apos;hui</span>
          </div>
        </div>
      </div>

      {/* Payments */}
      <div className="bg-white rounded-2xl border border-[#EDE0E0] shadow-sm mb-6">
        <div className="p-4 border-b border-[#F5F0EB] flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-bold text-[#2A2424] mr-auto">Paiements reçus <span className="text-[#2A2424]/40 font-semibold">· {filtered.length} · {fcfa(filteredTotal)}</span></h2>
          <div className="flex items-center gap-2 bg-[#F5F0EB] border border-[#EDE0E0] rounded-xl px-3 py-2 w-full sm:w-64">
            <Search className="w-4 h-4 text-[#2A2424]/30 shrink-0" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Client, commande, numéro…" className="bg-transparent text-sm outline-none w-full" />
          </div>
          <div className="flex rounded-xl border border-[#EDE0E0] overflow-hidden text-xs font-semibold">
            {([["7", "7 j"], ["30", "30 j"], ["all", "Tout"]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setPeriod(v)} className={`px-3 py-2 ${period === v ? "bg-[#2A2424] text-white" : "bg-white text-[#2A2424]/60"}`}>{l}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-[#2A2424]/40">Aucun paiement Mobile Money sur cette période.</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-[#2A2424]/40">
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Commande</th>
                    <th className="px-4 py-3 font-semibold">Client</th>
                    <th className="px-4 py-3 font-semibold">Numéro débité</th>
                    <th className="px-4 py-3 font-semibold text-right">Commande</th>
                    <th className="px-4 py-3 font-semibold text-right">Frais</th>
                    <th className="px-4 py-3 font-semibold text-right">Débité</th>
                    <th className="px-4 py-3 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.payment_id} className="border-t border-[#F5F0EB] hover:bg-[#FDFBF7]">
                      <td className="px-4 py-3 text-[#2A2424]/60 whitespace-nowrap">{formatDate(p.created_at)}</td>
                      <td className="px-4 py-3"><Link href={`/dashboard/orders/${p.order_id}`} className="font-bold text-[#2A2424] hover:text-[#C08A8E]">{p.display_id ? `WLF-${p.display_id}` : "—"}</Link></td>
                      <td className="px-4 py-3 text-[#2A2424]">{p.customer}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#2A2424]/70">{formatMsisdn(p.payer)}</td>
                      <td className="px-4 py-3 text-right text-[#2A2424]/70">{num(p.order_amount)}</td>
                      <td className="px-4 py-3 text-right text-[#2A2424]/50">{p.fee ? `+${num(p.fee)}` : "—"}</td>
                      <td className="px-4 py-3 text-right font-bold text-[#2A2424]">{num(p.charged)}</td>
                      <td className="px-4 py-3">
                        {p.order_status === "canceled" ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">Commande annulée</span>
                        ) : p.refunded > 0 ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-300">Remb. {num(p.refunded)}</span>
                        ) : (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Payé</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <ul className="md:hidden divide-y divide-[#F5F0EB]">
              {filtered.map((p) => (
                <li key={p.payment_id} className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#2A2424]">
                      <Link href={`/dashboard/orders/${p.order_id}`}>{p.display_id ? `WLF-${p.display_id}` : "—"}</Link>
                      <span className="font-normal text-[#2A2424]/60"> · {p.customer}</span>
                    </p>
                    <p className="text-[11px] text-[#2A2424]/45 mt-0.5">{formatDate(p.created_at)} · {formatMsisdn(p.payer)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#2A2424]">{num(p.charged)}</p>
                    <p className={`text-[10px] font-bold ${p.order_status === "canceled" ? "text-red-600" : "text-emerald-700"}`}>{p.order_status === "canceled" ? "Annulée" : "Payé"}</p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Payouts history */}
      <div className="bg-white rounded-2xl border border-[#EDE0E0] shadow-sm">
        <div className="p-4 border-b border-[#F5F0EB]">
          <h2 className="text-sm font-bold text-[#2A2424]">Historique des retraits</h2>
        </div>
        {overview.payouts.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#2A2424]/40">Aucun retrait pour l&apos;instant.</p>
        ) : (
          <ul className="divide-y divide-[#F5F0EB]">
            {overview.payouts.map((p) => {
              const st = PAYOUT_STATUS[p.status] || PAYOUT_STATUS.ACCEPTED;
              return (
                <li key={p.payoutId} className="p-4 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[180px]">
                    <p className="text-sm font-bold text-[#2A2424]">{fcfa(p.amount)} <span className="font-normal text-[#2A2424]/50">→ {formatMsisdn(p.msisdn)}</span></p>
                    <p className="text-[11px] text-[#2A2424]/45 mt-0.5">{formatDate(p.created_at)}{p.note ? ` · ${p.note}` : ""}</p>
                    {p.failure && <p className="text-[11px] text-red-600 mt-0.5">{p.failure}</p>}
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${st.className}`}>{st.icon} {st.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showPayout && <PayoutModal overview={overview} onClose={() => setShowPayout(false)} />}
    </div>
  );
}
