"use client";
import { useState, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ChartPieSlice, ShareNetwork, Wallet, User, Trophy, WhatsappLogo, InstagramLogo, TiktokLogo, Export,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { sdk } from "@/lib/medusa";
import { DISPLAY_FONT, Eyebrow, SK, SectionTitle } from "@/components/account/account-ui";

// The creator space, in the Skin Coach look (prototype "Créatrices partenaires" validated by the owner,
// 2026-10-15): three tabs (my month, share, earnings), a bottom tab bar on the phone and a side menu on a
// computer, like the customer space.

type Tab = "month" | "share" | "earnings";

const MONTHS_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const MONTHS_SHORT = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
// The programme's defaults, used when an older API answer carries no tiers
const DEFAULT_TIERS = [{ min: 0, max: 599999, rate: 3 }, { min: 600000, max: 999999, rate: 4 }, { min: 1000000, max: null, rate: 6 }];

const fmt = (n: number) => Math.round(Number(n) || 0).toLocaleString("fr-FR");

const NAV: { id: Tab; label: string; icon: typeof Wallet }[] = [
  { id: "month", label: "Mon mois", icon: ChartPieSlice },
  { id: "share", label: "Partager", icon: ShareNetwork },
  { id: "earnings", label: "Gains", icon: Wallet },
];

const STATUS: Record<string, { label: string; bg: string; ink: string }> = {
  pending: { label: "En attente", bg: SK.tint, ink: SK.ink },
  validated: { label: "Validée", bg: SK.accentLight, ink: SK.ink },
  paid: { label: "Payée", bg: SK.accent, ink: "#FFFFFF" },
};

const card = { background: SK.surface, border: `1px solid ${SK.lineSoft}` } as const;

function Amount({ value, size = 24, color = SK.ink, unit = "FCFA" }: { value: number; size?: number; color?: string; unit?: string }) {
  return (
    <span style={{ fontFamily: DISPLAY_FONT, fontSize: size, lineHeight: 1, fontWeight: 700, color, whiteSpace: "nowrap" }}>
      {fmt(value)}<span style={{ fontSize: Math.round(size * 0.5) }}> {unit}</span>
    </span>
  );
}

function SectionHead({ light, bold, action }: { light: string; bold: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <SectionTitle light={light} bold={bold} />
      {action}
    </div>
  );
}

// Shown to a logged-in customer whose account is a creator space: `initialData` is her
// /store/creator/me answer (the API only ever returns the logged-in creator's own figures).
export function DashboardInfluenceur({ initialData }: { initialData: any }) {
  const { t } = useI18n();
  const data = initialData;
  const [tab, setTab] = useState<Tab>("month");
  const [history, setHistory] = useState<any[] | null>(null);
  const [copied, setCopied] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  useEffect(() => {
    sdk.client
      .fetch("/store/creator/history", { method: "GET" })
      .then((res: any) => setHistory(res?.history || []))
      .catch(() => setHistory([]));
  }, []);

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const goTo = (next: Tab) => {
    setTab(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!data) return null;

  const { creator, current_month, next_tier, commissions } = data;
  const tiers: { min: number; max: number | null; rate: number }[] = Array.isArray(data.tiers) && data.tiers.length ? data.tiers : DEFAULT_TIERS;
  const referralLink: string = creator.referral_link || `https://thewelfarecm.com/r/${creator.code}`;
  const shortLink = referralLink.replace(/^https?:\/\//, "");
  const monthName = MONTHS_FR[(current_month.month || new Date().getMonth() + 1) - 1];
  const shareText = `${t("Mes soins K-Beauty préférés sont sur The Welfare. Avec mon code")} ${creator.code}, ${t("profitez de -5 % sur votre 1re commande :")} ${referralLink}`;

  // Ring: the way to the next tier this month (full when the top tier is reached)
  const ringR = 56;
  const ringC = 2 * Math.PI * ringR;
  const progress = next_tier ? Math.min(1, (current_month.eligible_revenue || 0) / next_tier.threshold) : 1;

  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "The Welfare", text: shareText, url: referralLink }); } catch { /* closed */ }
    } else {
      copy(referralLink, "link");
    }
  };

  // ─── earnings: the last 6 months, oldest first ───
  const months = (history || [])
    .slice(0, 6)
    .reverse()
    .map((h: any) => ({
      key: `${h.year}-${h.month}`,
      short: MONTHS_SHORT[h.month - 1],
      name: `${MONTHS_FR[h.month - 1]} ${h.year}`,
      ca: Number(h.total_eligible_revenue) || 0,
      commission: Number(h.total_commission) || 0,
      orders: Number(h.total_orders) || 0,
      rate: h.commission_rate,
      st: STATUS[h.commission_status] ?? STATUS.pending!,
    }));
  const maxCommission = Math.max(1, ...months.map((m) => m.commission));
  const selIdx = selectedMonth ?? months.length - 1;
  const sel = months[selIdx];

  const statusCards = [
    { key: "pending", label: t("En attente"), hint: t("Commandes récentes, en cours de vérification"), value: commissions.pending, dot: SK.accentLight, style: card, ink: SK.ink, sub: SK.muted },
    { key: "validated", label: t("Validée"), hint: t("Sera versée le 1er du mois prochain"), value: commissions.validated, dot: SK.accent, style: { background: SK.tint, border: `1px solid ${SK.tint}` }, ink: SK.ink, sub: SK.muted },
    { key: "paid", label: t("Déjà versée"), hint: t("Depuis votre arrivée"), value: commissions.paid, dot: "#FFFFFF", style: { background: SK.accent, border: `1px solid ${SK.accent}` }, ink: "#FFFFFF", sub: "#FFFFFF" },
  ];

  const stats = [
    { label: t("Ventes"), value: fmt(current_month.total_orders), unit: "", sub: `${t("dont")} ${current_month.new_customers} ${current_month.new_customers > 1 ? t("nouvelles clientes") : t("nouvelle cliente")}` },
    { label: t("Clics sur votre lien"), value: fmt(current_month.total_clicks), unit: "", sub: `${String(current_month.conversion_rate).replace(".", ",")} % ${t("deviennent des ventes")}` },
    { label: t("Panier moyen"), value: fmt(current_month.avg_basket), unit: " FCFA", sub: t("par commande") },
    current_month.rank
      ? { label: t("Classement"), value: String(current_month.rank), unit: current_month.rank === 1 ? "re" : "e", sub: t("parmi les créatrices actives") }
      : { label: t("Nouvelles clientes"), value: fmt(current_month.new_customers), unit: "", sub: t("ce mois-ci") },
  ];

  return (
    <div className="min-h-screen w-full" style={{ background: SK.ground, color: SK.ink }}>
      <div className="w-full max-w-5xl mx-auto md:flex md:gap-10 md:px-8 md:py-10">

        {/* ─── side menu (computer) ─── */}
        <aside className="hidden md:flex md:flex-col md:w-60 shrink-0 gap-2 self-start sticky top-28">
          <div className="mb-4">
            <Eyebrow>{t("Espace créatrice")}</Eyebrow>
            <p className="mt-1" style={{ fontFamily: DISPLAY_FONT, fontSize: 24, fontWeight: 700 }}>{creator.first_name} {creator.last_name}</p>
          </div>
          {NAV.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => goTo(item.id)}
                aria-current={active ? "page" : undefined}
                className="h-12 px-4 rounded-2xl flex items-center gap-3 text-[15px] font-bold text-left"
                style={{ background: active ? SK.tint : "transparent", color: active ? SK.accent : SK.ink }}
              >
                <item.icon weight={active ? "fill" : "regular"} className="w-5 h-5" />
                {t(item.label)}
              </button>
            );
          })}
          <Link href="/account" className="mt-4 h-12 px-4 rounded-2xl flex items-center gap-3 text-[15px] font-semibold" style={{ color: SK.muted }}>
            <User className="w-5 h-5" /> {t("Mon compte client")}
          </Link>
        </aside>

        {/* ─── content ─── */}
        <main className="flex-1 min-w-0 max-w-2xl px-5 pt-6 pb-32 md:px-0 md:pt-0 md:pb-10">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex flex-col gap-6">

              {tab === "month" && (
                <>
                  <div className="flex items-center justify-between md:hidden">
                    <Eyebrow>{t("Espace créatrice")}</Eyebrow>
                    <span className="px-3 py-1.5 rounded-full text-[12px] font-semibold" style={{ background: SK.surface, border: `1px solid ${SK.line}` }}>{monthName} {current_month.year}</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <h1 style={{ margin: 0, fontFamily: DISPLAY_FONT, fontSize: 44, lineHeight: 1.02, fontWeight: 300, letterSpacing: "-0.02em" }}>
                      {t("Bonjour")} {creator.first_name},<br />
                      <span style={{ fontWeight: 700, color: SK.accent }}>{t("votre mois en un coup d'œil.")}</span>
                    </h1>
                    {creator.is_creator_of_month && (
                      <span className="self-start flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-bold text-white" style={{ background: SK.accent }}>
                        <Trophy className="w-4 h-4" weight="fill" />
                        {t("Créatrice du mois")}
                        {creator.creator_of_month_until && ` · ${t("jusqu'au")} ${new Date(creator.creator_of_month_until).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`}
                      </span>
                    )}
                  </div>

                  <div className="rounded-[28px] p-5 flex flex-col gap-4" style={card}>
                    <div className="flex items-center gap-[18px]">
                      <div
                        role="img"
                        aria-label={next_tier
                          ? `${t("Commission actuelle")} ${current_month.commission_rate} %, ${Math.round(progress * 100)} % ${t("du chemin vers")} ${next_tier.rate} %`
                          : `${t("Commission actuelle")} ${current_month.commission_rate} %, ${t("palier maximal")}`}
                        className="relative w-[132px] h-[132px] shrink-0"
                      >
                        <svg width="132" height="132" viewBox="0 0 132 132" className="absolute inset-0" aria-hidden="true">
                          <defs>
                            <linearGradient id="creator-tier" gradientUnits="userSpaceOnUse" x1="10" y1="122" x2="122" y2="10">
                              <stop offset="0" stopColor={SK.accentLight} />
                              <stop offset="1" stopColor={SK.accent} />
                            </linearGradient>
                          </defs>
                          <circle cx="66" cy="66" r={ringR} fill="none" stroke={SK.track} strokeWidth="10" />
                          <circle cx="66" cy="66" r={ringR} fill="none" stroke="url(#creator-tier)" strokeWidth="10" strokeLinecap="round"
                            strokeDasharray={`${progress * ringC} ${ringC}`} transform="rotate(-90 66 66)" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span style={{ fontFamily: DISPLAY_FONT, fontSize: 40, fontWeight: 300, lineHeight: 1 }}>{current_month.commission_rate} %</span>
                          <span className="text-[12px] font-semibold" style={{ color: SK.muted }}>{t("commission")}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <span className="text-[12px] font-bold uppercase tracking-[0.06em]" style={{ color: SK.muted }}>{t("Gagné ce mois")}</span>
                        <Amount value={current_month.total_commission} size={30} color={SK.accent} />
                        <span className="text-[13px] leading-snug" style={{ color: SK.muted }}>{t("Sur")} {fmt(current_month.eligible_revenue)} FCFA {t("de ventes éligibles")}</span>
                      </div>
                    </div>
                    <div className="rounded-[18px] px-3.5 py-3 text-[14px] leading-snug" style={{ background: SK.tint }}>
                      {next_tier ? (
                        <>{t("Plus que")} <strong>{fmt(next_tier.remaining)} FCFA</strong> {t("de ventes pour passer à")} <strong style={{ color: SK.accent }}>{next_tier.rate} %</strong> {t("ce mois-ci.")}</>
                      ) : (
                        <>{t("Palier maximal atteint : tout le mois est à")} <strong style={{ color: SK.accent }}>{current_month.commission_rate} %</strong>.</>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {stats.map((s) => (
                      <div key={s.label} className="rounded-3xl p-4 flex flex-col gap-1.5" style={card}>
                        <span className="text-[12px] font-semibold" style={{ color: SK.muted }}>{s.label}</span>
                        <span style={{ fontFamily: DISPLAY_FONT, fontSize: 28, lineHeight: 1, fontWeight: 700 }}>
                          {s.value}<span className="text-[14px]" style={{ color: SK.muted }}>{s.unit}</span>
                        </span>
                        <span className="text-[12px] leading-snug" style={{ color: SK.muted }}>{s.sub}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3">
                    <SectionHead light={t("Votre")} bold={t("code")} action={<button onClick={() => goTo("share")} className="text-[13px] font-bold">{t("Partager")}</button>} />
                    <div className="rounded-[26px] p-[18px] flex items-center justify-between gap-3 text-white" style={{ background: SK.accent }}>
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="truncate" style={{ fontFamily: DISPLAY_FONT, fontSize: 32, lineHeight: 1, fontWeight: 700, letterSpacing: "0.06em" }}>{creator.code}</span>
                        <span className="text-[12px]">{t("-5 % sur la 1re commande de vos abonnées")}</span>
                      </div>
                      <button onClick={() => copy(creator.code, "code")} className="h-11 px-4 rounded-full bg-white text-[13px] font-bold shrink-0 flex items-center gap-1.5" style={{ color: SK.accent }}>
                        {copied === "code" && <Check className="w-4 h-4" weight="bold" />}
                        {copied === "code" ? t("Copié") : t("Copier")}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <SectionHead light={t("Vos")} bold={t("commissions")} action={<button onClick={() => goTo("earnings")} className="text-[13px] font-bold">{t("Tout voir")}</button>} />
                    <button onClick={() => goTo("earnings")} className="rounded-[26px] p-[18px] grid grid-cols-3 gap-2 text-left" style={card}>
                      {statusCards.map((s) => (
                        <div key={s.key} className="flex flex-col gap-1.5 min-w-0">
                          <span className="flex items-center gap-1.5 text-[12px] font-bold" style={{ color: SK.muted }}>
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.key === "paid" ? SK.accent : s.dot }} />{s.label}
                          </span>
                          <span style={{ fontFamily: DISPLAY_FONT, fontSize: 20, fontWeight: 700 }}>{fmt(s.value)}</span>
                          <span className="text-[11px]" style={{ color: SK.muted }}>FCFA</span>
                        </div>
                      ))}
                    </button>
                  </div>
                </>
              )}

              {tab === "share" && (
                <>
                  <Eyebrow>{t("Espace créatrice")}</Eyebrow>
                  <h1 style={{ margin: 0, fontFamily: DISPLAY_FONT, fontSize: 44, lineHeight: 1.02, fontWeight: 300, letterSpacing: "-0.02em" }}>
                    {t("Partagez")}<br /><span style={{ fontWeight: 700, color: SK.accent }}>{t("votre code.")}</span>
                  </h1>

                  <div className="rounded-[28px] p-[22px] flex flex-col gap-3.5 text-white" style={{ background: SK.accent }}>
                    <span className="text-[12px] font-bold uppercase tracking-[0.08em]">{t("Votre code personnel")}</span>
                    <span className="break-all" style={{ fontFamily: DISPLAY_FONT, fontSize: 48, lineHeight: 1, fontWeight: 700, letterSpacing: "0.08em" }}>{creator.code}</span>
                    <span className="text-[14px] leading-snug">{t("Vos abonnées profitent de")} <strong>-5 %</strong> {t("sur leur 1re commande, puis")} <strong>-2 %</strong> {t("sur les suivantes.")}</span>
                    <button onClick={() => copy(creator.code, "code")} className="h-[52px] rounded-full bg-white text-[15px] font-bold flex items-center justify-center gap-2" style={{ color: SK.accent }}>
                      {copied === "code" && <Check className="w-4 h-4" weight="bold" />}
                      {copied === "code" ? t("Code copié") : t("Copier le code")}
                    </button>
                  </div>

                  <div className="rounded-[28px] p-[18px] flex flex-col gap-3" style={card}>
                    <span className="text-[12px] font-bold uppercase tracking-[0.06em]" style={{ color: SK.muted }}>{t("Votre lien")}</span>
                    <div className="flex items-center gap-2.5 rounded-[18px] py-1.5 pl-3.5 pr-1.5" style={{ background: SK.ground, border: `1px solid ${SK.line}` }}>
                      <span className="flex-1 min-w-0 truncate text-[14px] font-semibold">{shortLink}</span>
                      <button onClick={() => copy(referralLink, "link")} className="h-11 px-4 rounded-full text-white text-[13px] font-bold shrink-0 flex items-center gap-1.5" style={{ background: SK.accent }}>
                        {copied === "link" && <Check className="w-4 h-4" weight="bold" />}
                        {copied === "link" ? t("Copié") : t("Copier")}
                      </button>
                    </div>
                    <span className="text-[13px] leading-snug" style={{ color: SK.muted }}>{t("Chaque clic et chaque vente passés par ce lien sont comptés automatiquement, même sans le code.")}</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <SectionTitle light={t("Partager")} bold={t("en un geste")} />
                    <div className="grid grid-cols-2 gap-3">
                      <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"
                        className="min-h-[104px] rounded-3xl p-4 flex flex-col justify-between" style={{ ...card, border: `1px solid ${SK.line}` }}>
                        <WhatsappLogo className="w-[26px] h-[26px]" style={{ color: SK.accent }} />
                        <span className="flex flex-col gap-0.5">
                          <span style={{ fontFamily: DISPLAY_FONT, fontSize: 18, fontWeight: 700, lineHeight: 1.1 }}>WhatsApp</span>
                          <span className="text-[12px]" style={{ color: SK.muted }}>{t("Message ou statut")}</span>
                        </span>
                      </a>
                      {[
                        { key: "insta", label: "Instagram", icon: InstagramLogo },
                        { key: "tiktok", label: "TikTok", icon: TiktokLogo },
                      ].map((s) => (
                        <button key={s.key} onClick={() => copy(referralLink, s.key)}
                          className="min-h-[104px] rounded-3xl p-4 flex flex-col justify-between text-left" style={{ ...card, border: `1px solid ${SK.line}` }}>
                          <s.icon className="w-[26px] h-[26px]" style={{ color: SK.accent }} />
                          <span className="flex flex-col gap-0.5">
                            <span style={{ fontFamily: DISPLAY_FONT, fontSize: 18, fontWeight: 700, lineHeight: 1.1 }}>{s.label}</span>
                            <span className="text-[12px]" style={{ color: copied === s.key ? SK.accent : SK.muted, fontWeight: copied === s.key ? 700 : 400 }}>
                              {copied === s.key ? t("Lien copié : collez-le dans votre bio") : t("Lien copié pour la bio")}
                            </span>
                          </span>
                        </button>
                      ))}
                      <button onClick={nativeShare}
                        className="min-h-[104px] rounded-3xl p-4 flex flex-col justify-between text-left" style={{ ...card, border: `1px solid ${SK.line}` }}>
                        <Export className="w-[26px] h-[26px]" style={{ color: SK.accent }} />
                        <span className="flex flex-col gap-0.5">
                          <span style={{ fontFamily: DISPLAY_FONT, fontSize: 18, fontWeight: 700, lineHeight: 1.1 }}>{t("Autres apps")}</span>
                          <span className="text-[12px]" style={{ color: SK.muted }}>{t("Partage du téléphone")}</span>
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[28px] p-5 flex flex-col gap-3" style={{ background: SK.tint }}>
                    <SectionTitle light={t("Ce qui")} bold={t("fonctionne le mieux")} size={24} />
                    {[
                      t("Les avis sincères sur un produit que vous utilisez vraiment."),
                      t("Les routines du matin et du soir filmées, étape par étape."),
                      t("Les comparatifs avant / après sur quelques semaines."),
                    ].map((tip, i) => (
                      <div key={i} className="flex gap-2.5 items-start">
                        <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[12px] font-bold shrink-0" style={{ color: SK.accent }}>{i + 1}</span>
                        <span className="text-[14px] leading-relaxed">{tip}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {tab === "earnings" && (
                <>
                  <Eyebrow>{t("Espace créatrice")}</Eyebrow>
                  <h1 style={{ margin: 0, fontFamily: DISPLAY_FONT, fontSize: 44, lineHeight: 1.02, fontWeight: 300, letterSpacing: "-0.02em" }}>
                    {t("Vos")}<br /><span style={{ fontWeight: 700, color: SK.accent }}>{t("gains.")}</span>
                  </h1>

                  <div className="flex flex-col gap-2.5">
                    {statusCards.map((s) => (
                      <div key={s.key} className="rounded-3xl px-[18px] py-4 flex items-center justify-between gap-3" style={{ ...s.style, color: s.ink }}>
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="flex items-center gap-2 text-[13px] font-bold">
                            <span className="w-[9px] h-[9px] rounded-full shrink-0" style={{ background: s.dot }} />{s.label}
                          </span>
                          <span className="text-[12px] leading-snug" style={{ color: s.sub }}>{s.hint}</span>
                        </div>
                        <Amount value={s.value} color={s.ink} />
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[28px] p-5 flex flex-col gap-4" style={card}>
                    <SectionTitle light={t("Vos")} bold={t("derniers mois")} size={24} />
                    {history === null ? (
                      <div className="h-[150px] rounded-2xl animate-pulse" style={{ background: SK.track }} />
                    ) : months.length === 0 ? (
                      <p className="text-[14px] leading-relaxed" style={{ color: SK.muted }}>{t("Votre historique apparaîtra ici dès la fin de votre premier mois.")}</p>
                    ) : (
                      <>
                        <div className="grid gap-2 items-end h-[150px]" style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}>
                          {months.map((m, i) => {
                            const on = i === selIdx;
                            return (
                              <button key={m.key} onClick={() => setSelectedMonth(i)} aria-pressed={on}
                                aria-label={`${m.name} : ${fmt(m.commission)} FCFA`}
                                className="h-full flex flex-col justify-end">
                                <span className="block w-full rounded-xl transition-colors"
                                  style={{ height: Math.max(14, Math.round((m.commission / maxCommission) * 140)), background: on ? SK.accent : SK.accentLight }} />
                              </button>
                            );
                          })}
                        </div>
                        <div className="grid gap-2 -mt-2" style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}>
                          {months.map((m, i) => (
                            <span key={m.key} className="text-center text-[12px]" style={{ color: i === selIdx ? SK.accent : SK.muted, fontWeight: i === selIdx ? 700 : 600 }}>{m.short}</span>
                          ))}
                        </div>
                        {sel && (
                          <div className="rounded-[20px] p-4 flex flex-col gap-2.5" style={{ background: SK.ground, border: `1px solid ${SK.lineSoft}` }}>
                            <div className="flex items-center justify-between gap-3">
                              <span style={{ fontFamily: DISPLAY_FONT, fontSize: 20, fontWeight: 700 }}>{sel.name}</span>
                              <span className="px-3 py-1 rounded-full text-[12px] font-bold" style={{ background: sel.st.bg, color: sel.st.ink }}>{t(sel.st.label)}</span>
                            </div>
                            <div className="flex justify-between text-[14px]"><span style={{ color: SK.muted }}>{t("Ventes éligibles")}</span><strong>{fmt(sel.ca)} FCFA</strong></div>
                            <div className="flex justify-between text-[14px]"><span style={{ color: SK.muted }}>{t("Commandes")}</span><strong>{sel.orders}</strong></div>
                            <div className="flex justify-between text-[14px]"><span style={{ color: SK.muted }}>{t("Taux du mois")}</span><strong>{sel.rate} %</strong></div>
                            <div className="flex justify-between items-baseline pt-2.5" style={{ borderTop: `1px solid ${SK.line}` }}>
                              <span className="text-[14px] font-bold">{t("Commission")}</span>
                              <Amount value={sel.commission} size={22} color={SK.accent} />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="rounded-[28px] p-5 flex flex-col gap-3" style={card}>
                    <SectionTitle light={t("Les")} bold={t("paliers")} size={24} />
                    <span className="text-[13px] leading-snug" style={{ color: SK.muted }}>{t("Votre taux dépend de vos ventes du mois et s'applique à tout le mois.")}</span>
                    {tiers.map((tier) => {
                      const on = tier.rate === current_month.commission_rate;
                      const range = tier.min === 0
                        ? `${t("Jusqu'à")} ${fmt(tier.max ?? 0)} FCFA`
                        : tier.max == null ? `${t("Dès")} ${fmt(tier.min)} FCFA` : `${t("De")} ${fmt(tier.min)} ${t("à")} ${fmt(tier.max)} FCFA`;
                      return (
                        <div key={tier.rate} className="flex items-center gap-3.5 rounded-[18px] px-3.5 py-3"
                          style={{ background: on ? SK.accent : SK.ground, color: on ? "#FFFFFF" : SK.ink }}>
                          <span className="w-14 shrink-0" style={{ fontFamily: DISPLAY_FONT, fontSize: 26, fontWeight: 700 }}>{tier.rate} %</span>
                          <span className="flex-1 text-[14px]">{range}</span>
                          {on && <span className="text-[12px] font-bold">{t("Votre palier")}</span>}
                        </div>
                      );
                    })}
                    <span className="text-[12px] leading-snug" style={{ color: SK.muted }}>{t("Paiement le 1er de chaque mois, par Mobile Money ou virement.")}</span>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ─── bottom tab bar (phone) ─── */}
      <nav
        aria-label={t("Navigation de l'espace créatrice")}
        className="md:hidden fixed left-3 right-3 z-40 h-[68px] rounded-3xl grid grid-cols-4 items-center px-1.5"
        style={{ bottom: "max(1rem, env(safe-area-inset-bottom))", background: SK.surface, border: `1px solid ${SK.line}`, boxShadow: "0 10px 30px rgba(42,36,36,.08)" }}
      >
        {NAV.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => goTo(item.id)}
              aria-current={active ? "page" : undefined}
              className="h-14 rounded-[18px] flex flex-col items-center justify-center gap-1 text-[11px] font-bold"
              style={{ background: active ? SK.tint : "transparent", color: active ? SK.accent : SK.muted }}
            >
              <item.icon weight={active ? "fill" : "regular"} className="w-5 h-5" />
              {t(item.label)}
            </button>
          );
        })}
        <Link href="/account" className="h-14 rounded-[18px] flex flex-col items-center justify-center gap-1 text-[11px] font-bold" style={{ color: SK.muted }}>
          <User className="w-5 h-5" />
          {t("Mon compte")}
        </Link>
      </nav>
    </div>
  );
}
