"use client";

import { useEffect, useState } from "react";
import { sdk } from "@/lib/medusa";
import { claimPendingScans } from "@/lib/pending-scans";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SignOut, Sparkle, House, Package, User, ShoppingBag, Scan } from "@phosphor-icons/react";
import Link from "next/link";
import { OrderCard } from "@/components/account/OrderCard";
import { OrderDetailsTab } from "@/components/account/OrderDetailsTab";
import ProfileTab from "@/components/account/ProfileTab";
import { ORDER_FIELDS, getOrderStage } from "@/lib/order-view";
import { useSkinCoachStore } from "@/lib/store/use-skin-coach-store";
import { useI18n } from "@/lib/i18n-context";
import { DISPLAY_FONT, Eyebrow, METRIC_KEYS, MiniRing, SK, SectionTitle, levelOf, splitSkinType } from "@/components/account/account-ui";

// The customer space, in the Skin Coach look (prototype "Espace client" validated by the owner, 2026-10-15):
// one column on the phone with a bottom tab bar, a side menu on a computer.

type Tab = "dashboard" | "orders" | "scans" | "profile";
type TierType = { name: string; min: number; max: number };

// 1 point = 1000 FCFA spent (rule applied by the API when an order is placed). The tiers sit at
// 50 000 / 150 000 / 300 000 FCFA of purchases.
const loyaltyTiers: TierType[] = [
  { name: "Découverte", min: 0, max: 50 },
  { name: "Bien-être", min: 50, max: 150 },
  { name: "Prestige", min: 150, max: 300 },
  { name: "Élite", min: 300, max: Infinity },
];

function getTier(points: number): TierType {
  return loyaltyTiers.find((t) => points >= t.min && points < t.max) ?? loyaltyTiers[0]!;
}

function getNextTier(points: number): TierType | null {
  const idx = loyaltyTiers.findIndex((t) => points >= t.min && points < t.max);
  return idx >= 0 && idx < loyaltyTiers.length - 1 ? loyaltyTiers[idx + 1]! : null;
}

// Older records were saved with this placeholder instead of the real message
const PLACEHOLDER_SUMMARY = "Generated from UI";
// Scans saved on 2026-10-12 morning carry their notices at the end of the message, as "[kind] text" blocks:
// they are taken out of the message and shown as notices
const LEGACY_NOTICE = /\n*\[(referral|caution|budget|missing)\] ([^\n]+)/g;
const scanMessage = (scan: any): string => {
  const v = typeof scan?.claude_raw_summary === "string" ? scan.claude_raw_summary.replace(LEGACY_NOTICE, "").trim() : "";
  return v && v !== PLACEHOLDER_SUMMARY ? v : "";
};
const scanNotices = (scan: any) => {
  if (Array.isArray(scan?.notices)) return scan.notices;
  const raw = typeof scan?.claude_raw_summary === "string" ? scan.claude_raw_summary : "";
  return [...raw.matchAll(LEGACY_NOTICE)].map((m) => ({ kind: m[1], text: m[2] }));
};

const NAV: { id: Tab; label: string; icon: typeof House }[] = [
  { id: "dashboard", label: "Accueil", icon: House },
  { id: "orders", label: "Commandes", icon: Package },
  { id: "scans", label: "Diagnostics", icon: Scan },
  { id: "profile", label: "Profil", icon: User },
];

// ─── one diagnostic: date, skin type, three levels ───────────────────────────
function ScanCard({ scan, onOpen, compact = false }: { scan: any; onOpen: () => void; compact?: boolean }) {
  const { t, locale } = useI18n();
  const date = new Date(scan.created_at).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "long", year: compact ? undefined : "numeric" });
  const [light, bold] = splitSkinType(scan.final_skin_type || "");
  const rings = METRIC_KEYS.filter((m) => m.key !== "acne")
    .map((m) => ({ ...m, level: levelOf(m.key, scan.metrics?.[m.field]) }))
    .filter((m) => m.level);
  return (
    <div className="rounded-[26px] p-[18px] flex flex-col gap-3.5" style={{ background: SK.surface, border: `1px solid ${SK.lineSoft}` }}>
      <div className="flex items-center justify-between gap-2.5">
        <span className="text-[13px]" style={{ color: SK.muted }}>{compact ? `${t("Dernier diagnostic")} · ${date}` : date}</span>
        {scan.review_status && (
          <span className="px-2.5 py-[5px] rounded-full text-[12px] font-bold" style={{ background: "#EEF6F1", color: "#0B6B45" }}>
            {scan.review_status === "corrected" ? t("Revu par une conseillère") : t("Validé par une conseillère")}
          </span>
        )}
      </div>
      <p style={{ fontFamily: DISPLAY_FONT, fontSize: compact ? 24 : 22, lineHeight: 1.12, fontWeight: 300, color: SK.ink }}>
        {light} <span style={{ fontWeight: 700 }}>{bold}</span>
      </p>
      {rings.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {rings.map((r) => (
            <div key={r.key} className="flex flex-col items-center gap-1.5">
              <MiniRing thirds={r.level!.thirds} label={t(r.level!.label)} size={compact ? 74 : 70} />
              <span className="text-[12px] font-semibold" style={{ color: SK.muted }}>{t(r.label)}</span>
            </div>
          ))}
        </div>
      )}
      <button onClick={onOpen} className="h-12 rounded-full text-[14px] font-bold" style={{ border: `1px solid ${SK.ink}`, color: SK.ink, background: SK.surface }}>
        {compact ? t("Revoir ma routine") : t("Revoir le diagnostic")}
      </button>
    </div>
  );
}

function EmptyCard({ title, text, href, cta }: { title: string; text: string; href: string; cta: string }) {
  return (
    <div className="rounded-[26px] p-6 flex flex-col items-start gap-3" style={{ background: SK.surface, border: `1px dashed ${SK.line}` }}>
      <p style={{ fontFamily: DISPLAY_FONT, fontSize: 20, fontWeight: 700 }}>{title}</p>
      <p className="text-[14px] leading-relaxed" style={{ color: SK.muted }}>{text}</p>
      <Link href={href} className="h-[46px] px-[18px] rounded-full flex items-center text-[14px] font-bold" style={{ background: SK.accent, color: "#FFFFFF" }}>
        {cta}
      </Link>
    </div>
  );
}

export default function AccountPage() {
  const { t, locale } = useI18n();
  const numLocale = locale === "en" ? "en-GB" : "fr-FR";
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [isCreator, setIsCreator] = useState(false); // her account opens a creator space (/ambassadrices)
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false); // the account itself could not be loaded (network...)
  const [partialError, setPartialError] = useState(false); // orders or diagnostics could not be loaded
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [orderFilter, setOrderFilter] = useState<"all" | "open" | "done">("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const router = useRouter();

  const setSkinCoachResult = useSkinCoachStore((state) => state.setResult);

  const fetchCustomer = async () => {
    try {
      setIsLoading(true);
      setLoadError(false);
      setPartialError(false);
      const { customer } = await sdk.store.customer.retrieve();
      if (!customer) {
        router.push("/account/login");
        return;
      }
      setCustomer(customer);
      await claimPendingScans(); // a diagnostic run before logging in joins the list below

      // orders and diagnostics load side by side; one failing must not hide the other
      const [ordersRes, scansRes] = await Promise.all([
        // the default list carries no address, shipping or fulfillments: ask for what the pages need
        sdk.store.order.list({ fields: ORDER_FIELDS, order: "-created_at", limit: 50 }).catch((e: any) => { console.error("Failed to fetch orders", e); return null; }),
        sdk.client.fetch("/store/skin-scans", { method: "GET" }).catch((e: any) => { console.error("Failed to fetch skin scans", e); return null; }),
      ]);
      if (ordersRes) setOrders((ordersRes as any).orders || []);
      if (scansRes) setScans((scansRes as any).scans || []);
      if (!ordersRes || !scansRes) setPartialError(true);

      // 404 = not a creator: nothing to show, not an error
      sdk.client.fetch("/store/creator/me", { method: "GET" }).then(() => setIsCreator(true)).catch(() => setIsCreator(false));
    } catch (err: any) {
      console.error(err);
      // Only "not logged in" goes back to the login page: a network hiccup shouldn't log her out of the page
      if (err?.status === 401 || /unauthorized/i.test(String(err?.message))) {
        router.push("/account/login");
      } else {
        setLoadError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleLogout = async () => {
    try {
      await sdk.auth.logout();
      router.push("/account/login");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewScan = (scan: any) => {
    setSkinCoachResult({
      final_skin_type: scan.final_skin_type,
      estimated_skin_age: scan.estimated_skin_age,
      melanin_phototype: scan.melanin_phototype,
      empathetic_message: scanMessage(scan) || t("Voici votre diagnostic personnalisé."),
      // a routine corrected by a skin advisor replaces the one the Skin Coach proposed
      kbeauty_routine: (Array.isArray(scan.reviewed_routine) && scan.reviewed_routine.length ? scan.reviewed_routine : scan.routine) || [],
      notices: scanNotices(scan),
      review: scan.review_status ? { status: scan.review_status, corrections: scan.review_corrections || [] } : undefined,
      metrics: scan.metrics,
      id: scan.id,
    } as any);
    router.push("/skin-coach/result");
  };

  // an order opened from the home page belongs to "Commandes" in the menus
  const navTab: Tab = selectedOrder ? "orders" : activeTab;

  const goTo = (tab: Tab) => {
    setSelectedOrder(null);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // The balance is kept on the customer by the API (credited when an order is placed, taken back if it is
  // canceled).
  const loyaltyPoints = Math.max(0, Math.floor(Number(customer?.metadata?.loyalty_points) || 0));
  const memberSince = (() => {
    const y = new Date(customer?.created_at).getFullYear();
    return Number.isFinite(y) ? y : new Date().getFullYear();
  })();
  const tier = getTier(loyaltyPoints);
  const nextTier = getNextTier(loyaltyPoints);
  const progress = nextTier ? Math.min(1, (loyaltyPoints - tier.min) / (nextTier.min - tier.min)) : 1;

  const isOpen = (o: any) => {
    const stage = getOrderStage(o);
    return stage !== "delivered" && stage !== "canceled";
  };
  const currentOrder = orders.find(isOpen) || orders[0];
  const filteredOrders = orders.filter((o) => orderFilter === "all" || (orderFilter === "open" ? isOpen(o) : !isOpen(o)));

  // how her skin moved between her two last diagnostics (same levels as the rings)
  const evolution = (() => {
    const [latest, previous] = scans;
    if (!latest || !previous) return null;
    const rows = METRIC_KEYS.map((m) => {
      const before = levelOf(m.key, previous.metrics?.[m.field]);
      const after = levelOf(m.key, latest.metrics?.[m.field]);
      if (!before || !after) return null;
      const better = m.key === "hydration" ? after.thirds > before.thirds : after.thirds < before.thirds;
      return { label: m.label, before: before.label, after: after.label, better };
    }).filter(Boolean) as { label: string; before: string; after: string; better: boolean }[];
    if (!rows.length) return null;
    const since = new Date(previous.created_at).toLocaleDateString(numLocale, { month: "long" });
    return { rows, since };
  })();

  if (loadError) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6" style={{ background: SK.ground }}>
        <div className="text-center max-w-sm">
          <p className="font-semibold mb-2" style={{ color: SK.ink }}>{t("Impossible de charger votre espace pour le moment.")}</p>
          <p className="text-[14px] mb-6" style={{ color: SK.muted }}>{t("Vérifiez votre connexion et réessayez.")}</p>
          <button onClick={fetchCustomer} className="h-12 px-6 rounded-full text-[15px] font-bold" style={{ background: SK.accent, color: "#FFFFFF" }}>
            {t("Réessayer")}
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center" style={{ background: SK.ground }}>
        <div className="flex flex-col items-center gap-4" role="status" aria-label={t("Chargement")}>
          <div className="w-12 h-12 rounded-full animate-spin" style={{ border: `4px solid ${SK.track}`, borderTopColor: SK.accent }} />
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: SK.muted }}>{t("Chargement")}</p>
        </div>
      </div>
    );
  }

  const ringR = 56;
  const ringC = 2 * Math.PI * ringR;

  return (
    <div className="min-h-screen" style={{ background: SK.ground, color: SK.ink }}>
      <div className="w-full max-w-5xl mx-auto md:flex md:gap-10 md:px-8 md:py-10">

        {/* ─── side menu (computer) ─── */}
        <aside className="hidden md:flex md:flex-col md:w-60 shrink-0 gap-2 self-start sticky top-28">
          <div className="mb-4">
            <Eyebrow>{t("Mon espace")}</Eyebrow>
            <p className="mt-1" style={{ fontFamily: DISPLAY_FONT, fontSize: 24, fontWeight: 700 }}>{customer?.first_name} {customer?.last_name}</p>
          </div>
          {NAV.map((item) => {
            const active = navTab === item.id;
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
          {isCreator && (
            <Link href="/ambassadrices" className="h-12 px-4 rounded-2xl flex items-center gap-3 text-[15px] font-bold" style={{ color: SK.ink }}>
              <Sparkle className="w-5 h-5" /> {t("Espace créatrice")}
            </Link>
          )}
          <button onClick={handleLogout} className="mt-4 h-12 px-4 rounded-2xl flex items-center gap-3 text-[15px] font-semibold text-left" style={{ color: SK.muted }}>
            <SignOut className="w-5 h-5" /> {t("Se déconnecter")}
          </button>
        </aside>

        {/* ─── content ─── */}
        <main className="flex-1 min-w-0 max-w-2xl px-5 pt-6 pb-32 md:px-0 md:pt-0 md:pb-10">
          {partialError && (
            <div className="mb-6 flex items-center justify-between gap-4 rounded-[18px] px-4 py-3 text-[14px]" style={{ background: "#FDECEC", color: "#9F1C12" }}>
              <span>{t("Certaines informations n'ont pas pu être chargées.")}</span>
              <button onClick={fetchCustomer} className="font-bold underline underline-offset-2">{t("Réessayer")}</button>
            </div>
          )}

          {selectedOrder ? (
            <OrderDetailsTab order={selectedOrder} onBack={() => setSelectedOrder(null)} />
          ) : (
            <AnimatePresence mode="wait">
              {/* ─────────── ACCUEIL ─────────── */}
              {activeTab === "dashboard" && (
                <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-[26px]">
                  <div className="flex items-center justify-between gap-3">
                    <Eyebrow>{t("Mon espace")}</Eyebrow>
                    <span className="px-3 py-[7px] rounded-full text-[12px] font-semibold" style={{ background: SK.surface, border: `1px solid ${SK.line}` }}>
                      {t("Membre depuis")} {memberSince}
                    </span>
                  </div>

                  <h1 style={{ margin: 0, fontFamily: DISPLAY_FONT, fontSize: 44, lineHeight: 1.02, fontWeight: 300, letterSpacing: "-0.02em" }}>
                    {t("Bonjour")} {customer?.first_name},<br />
                    <span style={{ fontWeight: 700, color: SK.accent }}>{t("belle journée à vous.")}</span>
                  </h1>

                  {/* loyalty */}
                  <div className="rounded-[28px] p-5 flex items-center gap-[18px]" style={{ background: SK.surface, border: `1px solid ${SK.lineSoft}` }}>
                    <div role="img" aria-label={`${loyaltyPoints} ${t("points fidélité")}, ${t(tier.name)}`} className="relative w-[132px] h-[132px] shrink-0">
                      <svg width="132" height="132" viewBox="0 0 132 132" className="absolute inset-0" aria-hidden="true">
                        <defs>
                          <linearGradient id="loyaltyRing" gradientUnits="userSpaceOnUse" x1="10" y1="122" x2="122" y2="10">
                            <stop offset="0" stopColor={SK.accentLight} />
                            <stop offset="1" stopColor={SK.accent} />
                          </linearGradient>
                        </defs>
                        <circle cx="66" cy="66" r={ringR} fill="none" stroke={SK.track} strokeWidth="10" />
                        <circle
                          cx="66" cy="66" r={ringR} fill="none" stroke="url(#loyaltyRing)" strokeWidth="10" strokeLinecap="round"
                          strokeDasharray={`${Math.max(progress, 0.02) * ringC} ${ringC}`} transform="rotate(-90 66 66)"
                          style={{ transition: "stroke-dasharray 1s ease-out" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span style={{ fontFamily: DISPLAY_FONT, fontSize: 38, fontWeight: 300, lineHeight: 1 }}>{loyaltyPoints.toLocaleString(numLocale)}</span>
                        <span className="text-[12px] font-semibold" style={{ color: SK.muted }}>{t("points")}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <p className="text-[12px] font-bold uppercase tracking-[0.06em]" style={{ color: SK.muted }}>{t("Fidélité")}</p>
                      <p style={{ fontFamily: DISPLAY_FONT, fontSize: 26, lineHeight: 1.05, fontWeight: 700, color: SK.accent }}>{t(tier.name)}</p>
                      {nextTier ? (
                        <p className="text-[14px] leading-snug">
                          {t("Plus que")} <span className="font-bold">{(nextTier.min - loyaltyPoints).toLocaleString(numLocale)} {t("points")}</span> {t("avant")} {t(nextTier.name)}
                        </p>
                      ) : (
                        <p className="text-[14px] leading-snug">{t("Vous avez atteint le plus haut niveau.")}</p>
                      )}
                      <p className="text-[12px]" style={{ color: SK.muted }}>{t("1 point pour 1 000 FCFA d'achats")}</p>
                    </div>
                  </div>

                  {/* shortcuts */}
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/skin-coach" className="min-h-[112px] rounded-3xl p-4 flex flex-col justify-between" style={{ background: SK.accent, color: "#FFFFFF" }}>
                      <Scan className="w-[26px] h-[26px]" />
                      <span style={{ fontFamily: DISPLAY_FONT, fontSize: 19, lineHeight: 1.1, fontWeight: 700 }}>{t("Nouveau diagnostic")}</span>
                    </Link>
                    <Link href="/shop" className="min-h-[112px] rounded-3xl p-4 flex flex-col justify-between" style={{ background: SK.surface, border: `1px solid ${SK.line}`, color: SK.ink }}>
                      <ShoppingBag className="w-[26px] h-[26px]" />
                      <span style={{ fontFamily: DISPLAY_FONT, fontSize: 19, lineHeight: 1.1, fontWeight: 700 }}>{t("Voir la boutique")}</span>
                    </Link>
                  </div>

                  {/* current order */}
                  <section className="flex flex-col gap-3">
                    <div className="flex items-end justify-between gap-3">
                      <SectionTitle light={t(currentOrder && isOpen(currentOrder) ? "Commande" : "Dernière")} bold={t(currentOrder && isOpen(currentOrder) ? "en cours" : "commande")} />
                      {orders.length > 0 && (
                        <button onClick={() => goTo("orders")} className="text-[13px] font-bold shrink-0 underline-offset-2 hover:underline">{t("Tout voir")} ({orders.length})</button>
                      )}
                    </div>
                    {currentOrder ? (
                      <OrderCard order={currentOrder} onViewDetails={setSelectedOrder} />
                    ) : (
                      <EmptyCard title={t("Aucune commande pour l'instant")} text={t("Vos commandes et leur suivi apparaîtront ici.")} href="/shop" cta={t("Visiter la boutique")} />
                    )}
                  </section>

                  {/* skin */}
                  <section className="flex flex-col gap-3">
                    <div className="flex items-end justify-between gap-3">
                      <SectionTitle light={t("Votre")} bold={t("peau")} />
                      {scans.length > 0 && (
                        <button onClick={() => goTo("scans")} className="text-[13px] font-bold shrink-0 underline-offset-2 hover:underline">{t("Historique")} ({scans.length})</button>
                      )}
                    </div>
                    {scans[0] ? (
                      <ScanCard scan={scans[0]} onOpen={() => handleViewScan(scans[0])} compact />
                    ) : (
                      <EmptyCard
                        title={t("Découvrez les besoins de votre peau")}
                        text={t("Le Skin Coach analyse trois photos de votre visage et vos réponses pour vous proposer une routine adaptée.")}
                        href="/skin-coach"
                        cta={t("Faire mon diagnostic")}
                      />
                    )}
                  </section>
                </motion.div>
              )}

              {/* ─────────── COMMANDES ─────────── */}
              {activeTab === "orders" && (
                <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-5">
                  <Eyebrow>{t("Mon espace")}</Eyebrow>
                  <SectionTitle as="h1" light={t("Mes")} bold={t("commandes")} size={42} />
                  {orders.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {([["all", "Toutes"], ["open", "En cours"], ["done", "Livrées"]] as const).map(([id, label]) => {
                        const on = orderFilter === id;
                        return (
                          <button
                            key={id}
                            onClick={() => setOrderFilter(id)}
                            aria-pressed={on}
                            className="h-11 px-4 rounded-full text-[14px] font-bold"
                            style={on ? { background: SK.accent, color: "#FFFFFF" } : { background: SK.surface, color: SK.ink, border: `1px solid ${SK.line}` }}
                          >
                            {t(label)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {orders.length === 0 ? (
                    <EmptyCard title={t("Aucune commande")} text={t("Vous n'avez pas encore passé de commande sur notre boutique.")} href="/shop" cta={t("Visiter la boutique")} />
                  ) : filteredOrders.length === 0 ? (
                    <p className="text-[14px] p-5 rounded-[22px] text-center" style={{ color: SK.muted, background: SK.surface, border: `1px dashed ${SK.line}` }}>
                      {orderFilter === "open" ? t("Aucune commande en cours.") : t("Aucune commande livrée pour l'instant.")}
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3.5">
                      {filteredOrders.map((order) => (
                        <OrderCard key={order.id} order={order} onViewDetails={setSelectedOrder} />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ─────────── DIAGNOSTICS ─────────── */}
              {activeTab === "scans" && (
                <motion.div key="scans" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-[22px]">
                  <Eyebrow>{t("Mon espace")}</Eyebrow>
                  <SectionTitle as="h1" light={t("Mes")} bold={t("diagnostics")} size={42} />
                  <Link href="/skin-coach" className="h-[58px] rounded-full flex items-center justify-center gap-2.5 text-[16px] font-bold" style={{ background: SK.accent, color: "#FFFFFF" }}>
                    <Scan className="w-5 h-5" /> {t("Faire un nouveau diagnostic")}
                  </Link>

                  {evolution && (
                    <div className="rounded-[26px] p-[18px] flex flex-col gap-3" style={{ background: SK.tint }}>
                      <p style={{ fontFamily: DISPLAY_FONT, fontSize: 22, lineHeight: 1.15, fontWeight: 400 }}>
                        {t("Votre peau")} <span style={{ fontWeight: 700 }}>{t("depuis")} {evolution.since}</span>
                      </p>
                      {evolution.rows.map((r) => (
                        <div key={r.label} className="flex items-center justify-between gap-2.5 rounded-2xl px-3 py-2.5" style={{ background: SK.surface }}>
                          <span className="text-[14px] font-semibold">{t(r.label)}</span>
                          <span className="flex items-center gap-2 text-[13px]">
                            <span style={{ color: SK.muted }}>{t(r.before)}</span>
                            <span aria-hidden="true" style={{ color: SK.muted }}>→</span>
                            <span className="font-bold" style={{ color: r.better ? "#0B6B45" : SK.ink }}>{t(r.after)}</span>
                          </span>
                        </div>
                      ))}
                      <p className="text-[12px] leading-relaxed" style={{ color: SK.muted }}>
                        {t("Comparaison de vos deux derniers diagnostics. Les estimations varient aussi avec la lumière des photos.")}
                      </p>
                    </div>
                  )}

                  {scans.length === 0 ? (
                    <EmptyCard
                      title={t("Découvrez les besoins de votre peau")}
                      text={t("Le Skin Coach analyse trois photos de votre visage et vos réponses pour vous proposer une routine adaptée.")}
                      href="/skin-coach"
                      cta={t("Faire mon diagnostic")}
                    />
                  ) : (
                    <div className="flex flex-col gap-3.5">
                      {scans.map((scan) => (
                        <ScanCard key={scan.id} scan={scan} onOpen={() => handleViewScan(scan)} />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ─────────── PROFIL ─────────── */}
              {activeTab === "profile" && (
                <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-5">
                  <Eyebrow>{t("Mon espace")}</Eyebrow>
                  <ProfileTab
                    customer={customer}
                    onUpdate={fetchCustomer}
                    isCreator={isCreator}
                    onLogout={handleLogout}
                    loyalty={{ tier: tier.name, points: loyaltyPoints }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* ─── bottom tab bar (phone) ─── */}
      <nav
        aria-label={t("Navigation de l'espace client")}
        className="md:hidden fixed left-3 right-3 z-40 h-[68px] rounded-3xl grid grid-cols-4 items-center px-1.5"
        style={{ bottom: "max(1rem, env(safe-area-inset-bottom))", background: SK.surface, border: `1px solid ${SK.line}`, boxShadow: "0 10px 30px rgba(42,36,36,.08)" }}
      >
        {NAV.map((item) => {
          const active = navTab === item.id;
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
      </nav>
    </div>
  );
}
