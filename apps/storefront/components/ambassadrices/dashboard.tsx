"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Copy, Check, QrCode, TrendUp, Users, ShoppingBag,
  ChartLineUp, Clock, Trophy, CircleNotch, Sparkle
} from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n-context";

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

function formatFCFA(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

function StatCard({ label, value, sub, accent = false }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-6 flex flex-col gap-1 ${
      accent
        ? "bg-[#2A2424] text-white"
        : "bg-white border border-[#EDE0E0]"
    }`}>
      <p className={`text-xs font-bold uppercase tracking-[0.12em] ${
        accent ? "text-[#E5B6B9]/70" : "text-[#2A2424]/45"
      }`}>{label}</p>
      <p className={`text-2xl font-bold mt-1 ${
        accent ? "text-[#E5B6B9]" : "text-[#2A2424]"
      }`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${accent ? "text-white/40" : "text-[#2A2424]/40"}`}>{sub}</p>}
    </div>
  );
}

export function DashboardInfluenceur() {
  const { t } = useI18n();
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const [email, setEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [notFound, setNotFound] = useState(false);

  const loadData = async (emailToUse: string) => {
    setLoading(true);
    setNotFound(false);
    try {
      const headers: Record<string, string> = {};
      if (PUB_KEY) headers["x-publishable-api-key"] = PUB_KEY;
      const [meRes, histRes] = await Promise.all([
        fetch(`${MEDUSA_URL}/store/creator/me?email=${encodeURIComponent(emailToUse)}`, { headers }),
        fetch(`${MEDUSA_URL}/store/creator/history?email=${encodeURIComponent(emailToUse)}`, { headers }),
      ]);
      if (!meRes.ok) { setNotFound(true); setLoading(false); return; }
      const meData = await meRes.json();
      const histData = histRes.ok ? await histRes.json() : { history: [] };
      setData(meData);
      setHistory(histData.history || []);
    } catch (e) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmail(emailInput);
    loadData(emailInput);
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  // Email login screen
  if (!email || notFound) {
    return (
      <div className="w-full max-w-md mx-auto py-24 px-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#F4EAEB] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkle className="w-8 h-8 text-[#C2164A]" weight="fill" />
          </div>
          <h2 className="text-2xl font-bold text-[#2A2424]" style={{ letterSpacing: "-0.02em" }}>
            {t("Mon Espace Créateur")}
          </h2>
          <p className="text-[#2A2424]/60 mt-2 text-sm">
            {t("Entrez votre email pour accéder à votre tableau de bord.")}
          </p>
          {notFound && (
            <p className="text-red-500 text-sm mt-3 font-medium">
              {t("Aucun compte créateur trouvé pour cet email.")}
            </p>
          )}
        </div>
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            value={emailInput}
            onChange={e => setEmailInput(e.target.value)}
            placeholder="votre@email.com"
            required
            className="w-full bg-[#F8F5F2] border border-[#EDE0E0] rounded-xl px-4 py-3.5 text-sm text-[#2A2424] outline-none focus:border-[#E5B6B9] focus:bg-white transition-all"
          />
          <button type="submit" className="w-full bg-[#2A2424] text-white rounded-xl py-3.5 font-bold text-sm hover:bg-black transition-colors">
            {t("Accéder à mon tableau de bord")}
          </button>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-32">
        <CircleNotch className="w-10 h-10 text-[#C2164A] animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { creator, current_month, next_tier, commissions } = data;
  const referralLink = creator.referral_link || `https://thewelfare.store/r/${creator.code}`;

  return (
    <div className="w-full max-w-[1100px] mx-auto py-12 px-6 flex flex-col gap-12">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C08A8E] mb-1">
            {t("Programme Créateurs Partenaires")}
          </p>
          <h1 className="text-3xl font-bold text-[#2A2424]" style={{ letterSpacing: "-0.02em" }}>
            {t("Bonjour")}, {creator.first_name} 👋
          </h1>
          {creator.is_creator_of_month && (
            <span className="inline-flex items-center gap-1.5 mt-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">
              <Trophy className="w-3.5 h-3.5" weight="fill" />
              {t("Créatrice du mois")}
              {creator.creator_of_month_until && ` — jusqu'au ${new Date(creator.creator_of_month_until).toLocaleDateString("fr-FR")}`}
            </span>
          )}
        </div>
        <button
          onClick={() => { setEmail(""); setEmailInput(""); setData(null); setNotFound(false); }}
          className="text-xs text-[#2A2424]/40 hover:text-[#2A2424] transition-colors underline underline-offset-2"
        >
          {t("Changer de compte")}
        </button>
      </div>

      {/* Section 1 — KPIs Ce mois-ci */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#2A2424]">
            {t("Ce mois-ci")} — <span className="text-[#C08A8E]">{MONTHS_FR[(new Date().getMonth())]} {new Date().getFullYear()}</span>
          </h2>
          <span className="inline-flex items-center gap-1.5 bg-[#F4EAEB] text-[#C2164A] text-xs font-bold px-3 py-1.5 rounded-full">
            <ChartLineUp className="w-3.5 h-3.5" />
            {t("Commission actuelle")} : {current_month.commission_rate}%
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label={t("CA net éligible")} value={formatFCFA(current_month.eligible_revenue)} />
          <StatCard label={t("Commission générée")} value={formatFCFA(current_month.total_commission)} accent />
          <StatCard label={t("Commandes")} value={String(current_month.total_orders)} sub={`${current_month.new_customers} ${t("nouveaux clients")}`} />
          <StatCard label={t("Clics")} value={String(current_month.total_clicks)} sub={`${current_month.conversion_rate}% ${t("de conversion")}`} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <StatCard label={t("Panier moyen")} value={formatFCFA(current_month.avg_basket)} />
          {next_tier ? (
            <div className="rounded-2xl p-6 bg-[#F8F5F2] border border-[#EDE0E0] flex flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#2A2424]/45">
                {t("Prochain palier")}
              </p>
              <p className="text-base font-bold text-[#2A2424]">
                {next_tier.rate}% {t("à partir de")} {formatFCFA(next_tier.threshold)}
              </p>
              <div className="w-full bg-[#EDE0E0] rounded-full h-1.5 mt-1">
                <div
                  className="bg-[#C2164A] h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (current_month.eligible_revenue / next_tier.threshold) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-[#2A2424]/40">
                {t("Il vous reste")} {formatFCFA(next_tier.remaining)}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl p-6 bg-gradient-to-br from-[#2A2424] to-[#3D3030] flex flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#E5B6B9]/60">{t("Niveau maximum")}</p>
              <p className="text-xl font-bold text-[#E5B6B9]">🏆 {current_month.commission_rate}% — {t("Palier maximal atteint !")}</p>
            </div>
          )}
        </div>
      </section>

      {/* Section 2 — Statut commissions */}
      <section>
        <h2 className="text-lg font-bold text-[#2A2424] mb-5">{t("Commissions")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[#EDE0E0] p-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#2A2424]/45">{t("En attente")}</p>
            </div>
            <p className="text-2xl font-bold text-[#2A2424]">{formatFCFA(commissions.pending)}</p>
            <p className="text-xs text-[#2A2424]/40 mt-1">{t("Commandes récentes — en cours de validation")}</p>
          </div>
          <div className="rounded-2xl border border-[#EDE0E0] p-6">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4 text-green-500" weight="bold" />
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#2A2424]/45">{t("Validée")}</p>
            </div>
            <p className="text-2xl font-bold text-[#2A2424]">{formatFCFA(commissions.validated)}</p>
            <p className="text-xs text-[#2A2424]/40 mt-1">{t("Prête à être payée")}</p>
          </div>
          <div className="rounded-2xl border border-[#EDE0E0] p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendUp className="w-4 h-4 text-[#C2164A]" />
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#2A2424]/45">{t("Payée")}</p>
            </div>
            <p className="text-2xl font-bold text-[#2A2424]">{formatFCFA(commissions.paid)}</p>
            <p className="text-xs text-[#2A2424]/40 mt-1">{t("Versements effectués")}</p>
          </div>
        </div>
      </section>

      {/* Section 3 — Code & Lien */}
      <section>
        <h2 className="text-lg font-bold text-[#2A2424] mb-5">{t("Mon Code & Lien Personnel")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Code */}
          <div className="bg-[#F8F5F2] rounded-2xl p-6 border border-[#EDE0E0]">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#2A2424]/45 mb-2">{t("Votre code personnel")}</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-[#C2164A] tracking-wider">{creator.code}</span>
              <button
                onClick={() => copy(creator.code, "code")}
                className="ml-auto bg-[#2A2424] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-black transition-colors"
              >
                {copied === "code" ? <Check className="w-4 h-4" weight="bold" /> : <Copy className="w-4 h-4" />}
                {copied === "code" ? t("Copié !") : t("Copier")}
              </button>
            </div>
            <p className="text-xs text-[#2A2424]/40 mt-3">
              {t("Offre")} <strong>5%</strong> {t("sur la 1ère commande, 2% sur les suivantes")}
            </p>
          </div>

          {/* Lien traçable */}
          <div className="bg-[#F8F5F2] rounded-2xl p-6 border border-[#EDE0E0]">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#2A2424]/45 mb-2">{t("Votre lien traçable")}</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={referralLink}
                className="flex-1 bg-white border border-[#EDE0E0] rounded-xl px-3 py-2.5 text-xs text-[#2A2424] font-medium outline-none truncate"
              />
              <button
                onClick={() => copy(referralLink, "link")}
                className="bg-[#2A2424] text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-black transition-colors shrink-0"
              >
                {copied === "link" ? <Check className="w-4 h-4" weight="bold" /> : <Copy className="w-4 h-4" />}
                {copied === "link" ? t("Copié !") : t("Copier")}
              </button>
            </div>
            <p className="text-xs text-[#2A2424]/40 mt-3">
              {t("Partagez ce lien sur vos réseaux — les clics sont tracés automatiquement")}
            </p>
          </div>
        </div>
      </section>

      {/* Section 4 — Classement */}
      {current_month.rank && (
        <section className="bg-gradient-to-br from-[#2A2424] to-[#3D3030] rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-[#E5B6B9]/20 border-2 border-[#E5B6B9] flex items-center justify-center shrink-0">
            <Trophy className="w-9 h-9 text-[#E5B6B9]" weight="fill" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E5B6B9]/60 mb-1">{t("Classement ce mois")}</p>
            <p className="text-4xl font-black text-white">
              {current_month.rank}<span className="text-xl text-white/50">e</span>
            </p>
            <p className="text-sm text-white/40 mt-1">{t("Parmi toutes les créatrices partenaires actives")}</p>
          </div>
        </section>
      )}

      {/* Section 5 — Historique mensuel */}
      {history.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-[#2A2424] mb-5">{t("Historique mensuel")}</h2>
          <div className="bg-white rounded-2xl border border-[#EDE0E0] overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8F5F2] text-[#2A2424]/50 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">{t("Mois")}</th>
                  <th className="px-6 py-4 font-bold text-right">{t("CA éligible")}</th>
                  <th className="px-6 py-4 font-bold text-right">{t("Commissions")}</th>
                  <th className="px-6 py-4 font-bold text-center">{t("Taux")}</th>
                  <th className="px-6 py-4 font-bold text-center">{t("Commandes")}</th>
                  <th className="px-6 py-4 font-bold text-center">{t("Statut")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4EAEB]">
                {history.map((h: any, i: number) => (
                  <tr key={i} className="hover:bg-[#FDFDFC] transition-colors">
                    <td className="px-6 py-4 font-medium text-[#2A2424]">
                      {MONTHS_FR[h.month - 1]} {h.year}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#2A2424] text-right">
                      {formatFCFA(h.total_eligible_revenue)}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#C2164A] text-right">
                      {formatFCFA(h.total_commission)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-[#F4EAEB] text-[#C2164A] text-xs font-bold px-2 py-1 rounded-full">
                        {h.commission_rate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-[#2A2424]/60">{h.total_orders}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        h.commission_status === 'paid'
                          ? 'bg-green-50 text-green-700'
                          : h.commission_status === 'validated'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {h.commission_status === 'paid' ? t('Payée') : h.commission_status === 'validated' ? t('Validée') : t('En attente')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

    </div>
  );
}
