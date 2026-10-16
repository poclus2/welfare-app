"use client";

import { useI18n } from "@/lib/i18n-context";
import { useState, useRef, useEffect, type ReactNode, type CSSProperties } from "react";
import { motion, useInView, AnimatePresence, useMotionValue, useSpring, useTransform, type Variants } from "framer-motion";
import {
  ArrowRight,
  Users,
  CurrencyCircleDollar,
  ShareNetwork,
  TrendUp,
  Check,
  Star,
  InstagramLogo,
  YoutubeLogo,
  TiktokLogo,
  LinkSimple,
  ChartBar,
  Gift,
  Trophy,
  Tag,
  Camera,
  Play,
  Seal,
  Clock,
  Wallet,
  ChatCircle,
  Plus,
  CircleNotch,
} from "@phosphor-icons/react";
import { DISPLAY_FONT, SK } from "@/components/ui/skin-coach/theme";

// The creator programme page, in the Skin Coach look (prototype "Créatrices partenaires" validated by the
// owner, 2026-10-15): same sections as before, pink-white ground, white cards, magenta as the only accent.

const SHOP_WHATSAPP = "237640236304"; // same number as the order confirmation page

/* ─── FADE-UP ANIMATION VARIANT ───────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 },
  }),
};

/* ─── ANIMATED COUNTER ────────────────────────────────────── */
function Counter({ to, unit = "", unitStyle }: { to: number; unit?: string; unitStyle?: CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString("fr-FR"));

  useEffect(() => { if (inView) mv.set(to); }, [inView, to, mv]);
  return (
    <span ref={ref} className="inline-flex items-baseline whitespace-nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>
      <motion.span>{display}</motion.span>
      <span style={{ fontSize: "0.4em", fontWeight: 700, letterSpacing: "-0.01em", color: SK.accent, marginLeft: unit === "+" ? "0.04em" : "0.22em", ...unitStyle }}>{unit}</span>
    </span>
  );
}

/* ─── SHARED PIECES ───────────────────────────────────────── */
const Eyebrow = ({ children }: { children: ReactNode }) => (
  <span className="inline-block text-[12px] font-bold uppercase tracking-[0.08em] mb-3" style={{ color: SK.muted }}>{children}</span>
);

// "Comment fonctionne le programme ?": light words, bold magenta end
const Title = ({ light, bold, className = "" }: { light: string; bold: string; className?: string }) => (
  <h2 className={`text-[34px] md:text-[44px] ${className}`} style={{ margin: 0, fontFamily: DISPLAY_FONT, lineHeight: 1.05, fontWeight: 300, letterSpacing: "-0.02em", color: SK.ink }}>
    {light} <span style={{ fontWeight: 700, color: SK.accent }}>{bold}</span>
  </h2>
);

const card = { background: SK.surface, border: `1px solid ${SK.lineSoft}` } as const;

/* ─── DATA ─────────────────────────────────────────────────── */
const KPI_STATS = [
  { value: 200, unit: "+", label: "Créatrices partenaires actives", icon: Users },
  { value: 12, unit: "M FCFA", label: "Commissions versées", icon: CurrencyCircleDollar },
  { value: 6, unit: "%", label: "Commission maximale par vente", icon: TrendUp },
  { value: 48, unit: "h", label: "Réponse à votre candidature", icon: Clock },
] as const;

const PROFILES = [
  { name: "Aminata D.", img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&h=120&fit=crop&crop=face" },
  { name: "Fatoumata K.", img: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&h=120&fit=crop&crop=face" },
  { name: "Mariama S.", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&h=120&fit=crop&crop=face" },
  { name: "Rokhaya T.", img: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=120&h=120&fit=crop&crop=face" },
];

const TIKTOKS = [
  {
    id: 1,
    creator: "@sofiabeauty_cm",
    avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
    followers: "42K",
    caption: "Ma routine glass skin avec Cosrx #kbeauty #skincare #thewelfare",
    views: "238K",
    thumbnail: "https://images.pexels.com/photos/4202325/pexels-photo-4202325.jpeg?auto=compress&cs=tinysrgb&w=400",
    earnings: "85 000 FCFA",
    verified: true,
  },
  {
    id: 2,
    creator: "@aminataglows",
    avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
    followers: "18K",
    caption: "J'ai testé la routine anti-taches pendant 30 jours #thewelfare",
    views: "91K",
    thumbnail: "https://images.pexels.com/photos/4041391/pexels-photo-4041391.jpeg?auto=compress&cs=tinysrgb&w=400",
    earnings: "41 000 FCFA",
    verified: true,
  },
  {
    id: 3,
    creator: "@laetibeauty",
    avatar: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
    followers: "9,2K",
    caption: "Ces produits coréens ont changé ma peau en 2 semaines #kbeauty",
    views: "55K",
    thumbnail: "https://images.pexels.com/photos/5938260/pexels-photo-5938260.jpeg?auto=compress&cs=tinysrgb&w=400",
    earnings: "22 500 FCFA",
    verified: false,
  },
];

const STEPS = [
  { n: "01", icon: LinkSimple, title: "Postulez et recevez votre lien", body: "Remplissez le formulaire en bas de page. Sous 48 h, vous recevez votre lien et votre code personnels, avec jusqu'à 6 % de commission sur chaque vente.", note: "100 % gratuit, aucun engagement" },
  { n: "02", icon: Camera, title: "Créez, partagez, inspirez", body: "Publiez vos routines sincères, vos hauls K-Beauty, vos avis. Votre lien unique compte toutes les ventes : Instagram, TikTok, YouTube, lien en bio.", note: "Tous les réseaux acceptés" },
  { n: "03", icon: Wallet, title: "Encaissez chaque mois", body: "Jusqu'à 6 % sur chaque vente faite avec votre lien. Paiement mensuel par Mobile Money (Wave, Orange Money) ou virement bancaire.", note: "Paiement le 1er de chaque mois" },
];

const PERKS = [
  { icon: TrendUp, title: "Commission progressive jusqu'à 6 %", sub: "Sur chaque vente, sans plafond" },
  { icon: ChartBar, title: "Tableau de bord en temps réel", sub: "Clics, ventes, commissions" },
  { icon: Gift, title: "Produits offerts", sub: "Un panier de base offert à la sélection" },
  { icon: Trophy, title: "Classement des créatrices", sub: "Défis et récompenses chaque mois" },
  { icon: Tag, title: "-15 % sur vos achats", sub: "Sur tous vos achats personnels" },
  { icon: ShareNetwork, title: "Accompagnement dédié", sub: "Une équipe disponible 7 j/7" },
] as const;

const FAQ = [
  { q: "Le programme est-il vraiment gratuit ?", a: "Oui, entièrement. Aucun frais d'adhésion, aucun produit obligatoire, aucun engagement. Vous postulez, vous êtes acceptée, et vous commencez à partager votre lien." },
  { q: "Combien d'abonnés faut-il avoir ?", a: "Aucun minimum. Nano-créatrice (500 abonnés) ou grande influenceuse (500K+), toutes sont les bienvenues. L'authenticité compte plus que la taille de l'audience." },
  { q: "Comment sont calculées les commissions ?", a: "Vous gagnez de 3 à 6 % du montant net de chaque commande passée avec votre lien ou votre code, selon vos ventes du mois. Vos commissions s'affichent en temps réel dans votre espace." },
  { q: "Quels contenus fonctionnent le mieux ?", a: "Les avis sincères, les routines du matin et du soir filmées, les hauls mensuels et les comparatifs avant/après. L'authenticité génère bien plus de ventes que le contenu sponsorisé générique." },
  { q: "Puis-je recevoir des produits offerts ?", a: "Si vous êtes sélectionnée, vous recevez un panier de soins de base. Ensuite, vous profitez de 15 % de réduction sur tous vos achats personnels." },
];

/* ─── FAQ ITEM ──────────────────────────────────────────────── */
function FaqItem({ q, a, i }: { q: string; a: string; i: number }) {
  const [open, setOpen] = useState(i === 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[22px] overflow-hidden transition-colors duration-300"
      style={{ background: SK.surface, border: `1px solid ${open ? SK.accentLight : SK.lineSoft}` }}
    >
      <button
        className="w-full min-h-[60px] flex items-center justify-between px-5 py-4 text-left gap-4 text-[15px] md:text-base font-bold"
        style={{ color: SK.ink }}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {q}
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 w-[30px] h-[30px] rounded-full flex items-center justify-center"
          style={{ background: open ? SK.accent : SK.tint, color: open ? "#FFFFFF" : SK.ink }}
        >
          <Plus className="w-3.5 h-3.5" weight="bold" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.3 }}>
            <p className="px-5 pb-5 text-[14px] leading-relaxed" style={{ color: SK.muted }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── KPI BENTO ───────────────────────────────────────────── */
// The money in a large magenta block, the three other figures around it, each with its own detail.
function KpiBento() {
  const [creators, paid, rate, reply] = KPI_STATS;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-3 md:gap-4">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="relative overflow-hidden col-span-2 md:row-span-2 rounded-[32px] p-6 md:p-9 flex flex-col justify-between gap-10 min-h-[260px] md:min-h-[360px] text-white"
        style={{ background: `radial-gradient(130% 100% at 100% 0%, #EE3E93 0%, ${SK.accent} 42%, #B30E60 100%)`, boxShadow: "0 40px 70px -40px rgba(179,14,96,.55)" }}>
        {/* the Skin Coach ring motif, as texture */}
        <svg aria-hidden="true" viewBox="0 0 320 320" className="absolute -right-20 -top-20 w-[300px] md:w-[380px] pointer-events-none">
          {[150, 118, 86].map((r) => <circle key={r} cx="160" cy="160" r={r} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="1" />)}
          <circle cx="160" cy="160" r="118" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="3" strokeLinecap="round" strokeDasharray="160 742" transform="rotate(95 160 160)" />
        </svg>
        <div className="relative flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,.16)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.22)" }}>
            <paid.icon className="w-5 h-5" weight="bold" />
          </span>
          <span className="text-[12px] font-bold uppercase tracking-[0.1em]">{paid.label}</span>
        </div>
        <div className="relative">
          <span style={{ fontFamily: DISPLAY_FONT, fontSize: "clamp(76px, 9vw, 120px)", lineHeight: 0.85, fontWeight: 300, letterSpacing: "-0.055em" }}>
            <Counter to={paid.value} unit={paid.unit} unitStyle={{ color: "#FFFFFF", fontSize: "0.3em", marginLeft: "0.12em" }} />
          </span>
          <p className="mt-4 text-[14px] md:text-[15px] leading-relaxed max-w-[36ch]">
            Reversés aux créatrices partenaires, chaque mois par Mobile Money ou virement bancaire.
          </p>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
        className="rounded-[28px] p-5 md:p-6 flex flex-col justify-between gap-5" style={card}>
        <div className="flex -space-x-2.5">
          {PROFILES.map((p) => (
            <img key={p.name} src={p.img} alt="" className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover" style={{ border: `2px solid ${SK.surface}` }} />
          ))}
        </div>
        <div>
          <span style={{ fontFamily: DISPLAY_FONT, fontSize: "clamp(40px, 4vw, 52px)", lineHeight: 0.95, fontWeight: 300, letterSpacing: "-0.045em" }}>
            <Counter to={creators.value} unit={creators.unit} />
          </span>
          <p className="mt-2 text-[13px] leading-snug" style={{ color: SK.muted }}>{creators.label}</p>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2}
        className="rounded-[28px] p-5 md:p-6 flex flex-col justify-between gap-5" style={{ background: SK.tint }}>
        {/* the three real commission tiers */}
        <div aria-hidden="true" className="flex items-end gap-1.5 h-9">
          {CALC_TIERS.map((t) => (
            <span key={t.rate} className="w-3 rounded-full" style={{ height: `${(t.rate / 6) * 100}%`, background: t.rate === 6 ? SK.accent : SK.accentLight }} />
          ))}
        </div>
        <div>
          <span style={{ fontFamily: DISPLAY_FONT, fontSize: "clamp(40px, 4vw, 52px)", lineHeight: 0.95, fontWeight: 300, letterSpacing: "-0.045em" }}>
            <Counter to={rate.value} unit={rate.unit} />
          </span>
          <p className="mt-2 text-[13px] leading-snug" style={{ color: SK.muted }}>{rate.label}</p>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={3}
        className="col-span-2 rounded-[28px] p-5 md:p-6 flex items-center justify-between gap-4" style={card}>
        <div className="flex items-center gap-4 min-w-0">
          <span style={{ fontFamily: DISPLAY_FONT, fontSize: "clamp(40px, 4vw, 52px)", lineHeight: 0.95, fontWeight: 300, letterSpacing: "-0.045em" }}>
            <Counter to={reply.value} unit={reply.unit} />
          </span>
          <p className="min-w-0 text-[13px] leading-snug max-w-[16ch]" style={{ color: SK.muted }}>{reply.label}</p>
        </div>
        <span className="shrink-0 flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[12px] font-bold" style={{ background: SK.tint, color: SK.accent }}>
          <ChatCircle className="w-4 h-4" weight="bold" />
          <span className="hidden sm:inline md:hidden lg:inline">Réponse sur</span> WhatsApp
        </span>
      </motion.div>
    </div>
  );
}

/* ─── DASHBOARD GLIMPSE ──────────────────────────────────────── */
// A glimpse of the creator space (same look as the real one).
function DashboardGlimpse() {
  return (
    <div className="rounded-[26px] p-4 md:p-5 flex flex-col gap-3" style={{ background: SK.ground, border: `1px solid ${SK.line}` }}>
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: DISPLAY_FONT, fontSize: 22, fontWeight: 300, color: SK.ink }}>Bonjour <span style={{ fontWeight: 700, color: SK.accent }}>Aminata</span></span>
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: SK.surface, border: `1px solid ${SK.line}`, color: SK.ink }}>Ce mois-ci</span>
      </div>
      <div className="rounded-[22px] p-3.5 flex items-center gap-3.5" style={card}>
        <div className="relative w-[88px] h-[88px] shrink-0">
          <svg width="88" height="88" viewBox="0 0 88 88" className="absolute inset-0">
            <circle cx="44" cy="44" r="36" fill="none" stroke={SK.track} strokeWidth="8" />
            <circle cx="44" cy="44" r="36" fill="none" stroke={SK.accent} strokeWidth="8" strokeLinecap="round" strokeDasharray="163 226" transform="rotate(-90 44 44)" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center" style={{ fontFamily: DISPLAY_FONT, fontSize: 24, fontWeight: 700, color: SK.ink }}>4&nbsp;%</div>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[12px] font-semibold" style={{ color: SK.muted }}>Commission du mois</span>
          <span className="whitespace-nowrap" style={{ fontFamily: DISPLAY_FONT, fontSize: 24, fontWeight: 700, color: SK.accent }}>28&nbsp;600 FCFA</span>
          <span className="text-[12px]" style={{ color: SK.muted }}>18 ventes · 1&nbsp;243 clics</span>
        </div>
      </div>
      <div className="flex items-center gap-2.5 rounded-[18px] py-2 pl-3.5 pr-2" style={card}>
        <span className="flex-1 truncate text-[13px] font-semibold" style={{ color: SK.muted }}>thewelfarecm.com/r/AMINATA</span>
        <span className="h-9 px-3.5 rounded-full flex items-center text-[12px] font-bold text-white" style={{ background: SK.accent }}>Copier</span>
      </div>
    </div>
  );
}

/* ─── PERKS: FEATURE + GROUPED LIST ──────────────────────────── */
// The commission as a magenta feature card with the real tiers, the five other perks grouped in one
// white card, the dashboard with two floating notes.
function PerksFeature() {
  const [lead, ...rest] = PERKS;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex flex-col gap-3">
        <div className="mb-5">
          <Eyebrow>Votre tableau de bord</Eyebrow>
          <Title light="Tout pour" bold="réussir" />
          <p className="mt-3 text-[15px] leading-relaxed max-w-[52ch]" style={{ color: SK.muted }}>
            Un espace personnel pour suivre vos résultats, partager votre lien et encaisser vos commissions, depuis votre téléphone.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-[28px] p-5 md:p-6 text-white"
          style={{ background: `radial-gradient(120% 120% at 100% 0%, #EE3E93 0%, ${SK.accent} 45%, #B30E60 100%)` }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p style={{ fontFamily: DISPLAY_FONT, fontSize: 24, lineHeight: 1.1, fontWeight: 700 }}>{lead.title}</p>
              <p className="mt-1.5 text-[14px]">Plus vous vendez dans le mois, plus votre taux monte.</p>
            </div>
            <span className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,.16)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.22)" }}>
              <lead.icon className="w-5 h-5" weight="bold" />
            </span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {CALC_TIERS.map((t) => (
              <div key={t.rate} className="rounded-2xl px-2 py-2.5 flex flex-col items-center gap-0.5"
                style={t.rate === 6 ? { background: "#FFFFFF", color: SK.accent } : { background: "rgba(255,255,255,.14)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.2)" }}>
                <span style={{ fontFamily: DISPLAY_FONT, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{t.rate}&nbsp;%</span>
                <span className="text-[11px] font-semibold text-center leading-tight">{t.range}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] px-5 md:px-6" style={card}>
          {rest.map((perk, i) => (
            <div key={perk.title} className="flex items-center gap-4 py-4" style={i > 0 ? { borderTop: `1px solid ${SK.lineSoft}` } : undefined}>
              <span className="w-10 h-10 rounded-[13px] flex items-center justify-center shrink-0" style={{ background: SK.tint }}>
                <perk.icon className="w-[18px] h-[18px]" weight="bold" style={{ color: SK.accent }} />
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-bold leading-snug" style={{ color: SK.ink }}>{perk.title}</p>
                <p className="text-[13px] leading-snug" style={{ color: SK.muted }}>{perk.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2}
        className="relative w-full max-w-[460px] mx-auto py-8" aria-hidden="true">
        <div className="rounded-[36px] p-4 md:p-6" style={{ background: SK.tint, boxShadow: "0 50px 80px -50px rgba(224,24,124,.45)" }}>
          <DashboardGlimpse />
        </div>
        <div className="absolute top-0 left-0 sm:-left-8 flex items-center gap-2.5 rounded-2xl pl-2 pr-4 py-2" style={{ background: SK.surface, border: `1px solid ${SK.lineSoft}`, boxShadow: "0 18px 40px -18px rgba(42,36,36,.25)" }}>
          <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: SK.accent }}>
            <CurrencyCircleDollar className="w-4 h-4 text-white" weight="bold" />
          </span>
          <div className="leading-tight">
            <p className="text-[11px] font-semibold" style={{ color: SK.muted }}>Nouvelle vente</p>
            <p className="text-[14px] font-bold" style={{ color: SK.ink }}>+1&nbsp;060 FCFA</p>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 sm:-right-6 flex items-center gap-2 rounded-full px-4 h-10 text-[12px] font-bold text-white" style={{ background: SK.ink, boxShadow: "0 18px 40px -18px rgba(42,36,36,.45)" }}>
          <Wallet className="w-4 h-4" weight="bold" />
          Paiement le 1er du mois
        </div>
      </motion.div>
    </div>
  );
}

/* ─── REVENUE CALCULATOR ─────────────────────────────────────── */
const CALC_TIERS = [
  { rate: 3, range: "jusqu'à 599 999" },
  { rate: 4, range: "dès 600 000" },
  { rate: 6, range: "dès 1 000 000" },
];

function RevenueCalculator() {
  const [community, setCommunity] = useState(10000);
  const [engagement, setEngagement] = useState(3);
  const [posts, setPosts] = useState(4);
  const clicks = Math.round((community * engagement / 100) * posts * 0.05);
  const orders = Math.round(clicks * 0.04);
  const caEligible = orders * 18000;
  // same tiers as the programme's defaults (API: commission_tiers)
  const rate = caEligible >= 1000000 ? 6 : caEligible >= 600000 ? 4 : 3;
  const revenue = Math.round(caEligible * rate / 100);

  const sliders = [
    { id: "calc-community", label: "Taille de votre communauté", val: community, set: setCommunity, min: 500, max: 200000, step: 500, fmt: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toString() },
    { id: "calc-engagement", label: "Taux d'engagement", val: engagement, set: setEngagement, min: 0.5, max: 15, step: 0.5, fmt: (v: number) => `${String(v).replace(".", ",")} %` },
    { id: "calc-posts", label: "Publications par mois", val: posts, set: setPosts, min: 1, max: 20, step: 1, fmt: (v: number) => `${v} post${v > 1 ? "s" : ""}` },
  ];

  return (
    <section className="w-full py-16 md:py-24" style={{ background: SK.ground }}>
      <div className="max-w-[1120px] mx-auto px-5 md:px-6">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="md:text-center mb-8 md:mb-14">
          <Eyebrow>Simulateur</Eyebrow>
          <Title light="Calculez vos" bold="revenus mensuels" />
          <p className="mt-3 text-[15px] md:max-w-md md:mx-auto" style={{ color: SK.muted }}>
            Ajustez les curseurs selon votre profil pour une estimation personnalisée.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-stretch">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
            className="rounded-[28px] p-5 md:p-8 flex flex-col gap-6" style={card}>
            {sliders.map((s) => (
              <div key={s.id} className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center gap-3">
                  <label htmlFor={s.id} className="text-[14px] font-semibold" style={{ color: SK.ink }}>{s.label}</label>
                  <span className="text-[13px] font-bold px-3 py-1 rounded-full whitespace-nowrap" style={{ background: SK.tint, color: SK.accent }}>{s.fmt(s.val)}</span>
                </div>
                <input id={s.id} type="range" min={s.min} max={s.max} step={s.step} value={s.val}
                  onChange={(e) => s.set(Number(e.target.value))}
                  className="w-full h-7 cursor-pointer"
                  style={{ accentColor: SK.accent }}
                />
              </div>
            ))}

            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold" style={{ color: SK.muted }}>Votre palier de commission</span>
              <div className="grid grid-cols-3 gap-1.5">
                {CALC_TIERS.map((t) => {
                  const on = t.rate === rate;
                  return (
                    <div key={t.rate} className="rounded-2xl px-2 py-2.5 flex flex-col items-center gap-0.5 transition-colors"
                      style={{ background: on ? SK.accent : SK.ground, color: on ? "#FFFFFF" : SK.ink }}>
                      <span style={{ fontFamily: DISPLAY_FONT, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{t.rate} %</span>
                      <span className="text-[11px] font-semibold text-center leading-tight">{t.range}</span>
                    </div>
                  );
                })}
              </div>
              <span className="text-[12px]" style={{ color: SK.muted }}>Calculé sur un panier moyen de 18 000 FCFA</span>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2}
            className="rounded-[28px] p-6 md:p-8 flex flex-col gap-5 text-white" style={{ background: SK.accent }}>
            <span className="text-[12px] font-bold uppercase tracking-[0.08em]">Estimation mensuelle</span>
            <AnimatePresence mode="wait">
              <motion.div key={revenue} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                className="flex items-baseline gap-2 flex-wrap">
                <span style={{ fontFamily: DISPLAY_FONT, fontSize: 56, lineHeight: 1, fontWeight: 300, letterSpacing: "-0.03em" }}>{revenue.toLocaleString("fr-FR")}</span>
                <span style={{ fontFamily: DISPLAY_FONT, fontSize: 20, fontWeight: 700 }}>FCFA / mois</span>
              </motion.div>
            </AnimatePresence>
            <div className="flex flex-col gap-2.5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,.3)" }}>
              {[
                { l: "Commandes estimées", v: `${orders} / mois` },
                { l: "Clics estimés", v: clicks.toLocaleString("fr-FR") },
                { l: "Taux appliqué", v: `${rate} %` },
              ].map((r) => (
                <div key={r.l} className="flex justify-between items-center text-[14px]">
                  <span>{r.l}</span>
                  <strong>{r.v}</strong>
                </div>
              ))}
            </div>
            <p className="text-[12px] leading-relaxed">
              Estimation indicative : les résultats varient selon la qualité du contenu et l'engagement de votre audience.
            </p>
            <a href="#postuler" className="mt-auto h-[54px] rounded-full flex items-center justify-center gap-2 text-[15px] font-bold bg-white transition-transform active:scale-[0.98] group" style={{ color: SK.accent }}>
              Je veux rejoindre le programme
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" weight="bold" />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── APPLICATION FORM ──────────────────────────────────────── */
const inputClass = "w-full h-[52px] rounded-2xl px-4 text-[15px] outline-none transition-colors focus:bg-white";
const inputStyle = { background: SK.ground, border: `1px solid ${SK.line}`, color: SK.ink } as const;
const labelClass = "block text-[13px] font-semibold mb-1.5";

function ApplicationForm() {
  const { t } = useI18n();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", instagram: "", tiktok: "", youtube: "", followers: "", content: "", motivation: "", other: "", country: "", city: "", media_kit_url: "" });

  const set = (e: any) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  if (sent) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 text-center gap-4">
      <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center" style={{ background: SK.tint }}>
        <Check className="w-9 h-9" weight="bold" style={{ color: SK.accent }} />
      </div>
      <h3 style={{ margin: 0, fontFamily: DISPLAY_FONT, fontSize: 26, fontWeight: 300, color: SK.ink }}>
        {t("Candidature")} <span style={{ fontWeight: 700, color: SK.accent }}>{t("reçue")}</span>
      </h3>
      <p className="max-w-sm text-[14px] leading-relaxed" style={{ color: SK.muted }}>{t("Notre équipe examine votre candidature et vous contacte sous 48 heures sur WhatsApp.")}</p>
    </motion.div>
  );

  const socials = [
    { name: "instagram", icon: InstagramLogo, placeholder: t("@votre.compte Instagram"), label: "Instagram" },
    { name: "tiktok", icon: TiktokLogo, placeholder: t("@votre.compte TikTok"), label: "TikTok" },
    { name: "youtube", icon: YoutubeLogo, placeholder: t("Nom de votre chaîne YouTube"), label: "YouTube" },
    { name: "other", icon: LinkSimple, placeholder: t("Autre lien"), label: t("Autre lien") },
  ] as const;

  return (
    <form onSubmit={async e => {
      e.preventDefault();
      setLoading(true);
      setSubmitError("");
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"}/store/creator-applications`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
          },
          body: JSON.stringify({
            first_name: form.firstName,
            last_name: form.lastName,
            email: form.email,
            phone: form.phone,
            instagram: form.instagram,
            tiktok: form.tiktok,
            youtube: form.youtube,
            other_link: form.other,
            followers: form.followers,
            content_type: form.content,
            motivation: form.motivation,
            country: form.country,
            city: form.city,
            media_kit_url: form.media_kit_url,
          })
        });
        if (res.ok) setSent(true);
        else {
          const data = await res.json().catch(() => ({}));
          setSubmitError(data.message || t("Impossible d'envoyer votre candidature. Réessayez."));
        }
      } catch (e) {
        console.error(e);
        setSubmitError(t("Impossible d'envoyer votre candidature. Réessayez."));
      }
      finally { setLoading(false) }
    }} className="flex flex-col gap-4">

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="app-first" className={labelClass} style={{ color: SK.ink }}>{t("Prénom *")}</label>
          <input id="app-first" name="firstName" value={form.firstName} onChange={set} placeholder="Aminata" required autoComplete="given-name" className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="app-last" className={labelClass} style={{ color: SK.ink }}>{t("Nom *")}</label>
          <input id="app-last" name="lastName" value={form.lastName} onChange={set} placeholder="Diallo" required autoComplete="family-name" className={inputClass} style={inputStyle} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="app-phone" className={labelClass} style={{ color: SK.ink }}>{t("Téléphone WhatsApp *")}</label>
          <input id="app-phone" name="phone" type="tel" value={form.phone} onChange={set} placeholder="+237 6 00 00 00 00" required autoComplete="tel" className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="app-email" className={labelClass} style={{ color: SK.ink }}>{t("Email *")}</label>
          <input id="app-email" name="email" type="email" value={form.email} onChange={set} placeholder="aminata@email.com" required autoComplete="email" className={inputClass} style={inputStyle} />
        </div>
      </div>
      <p className="-mt-2 text-[12px] leading-relaxed" style={{ color: SK.muted }}>
        {t("Utilisez le numéro WhatsApp de votre compte The Welfare : c'est lui qui ouvrira votre espace créatrice.")}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="app-country" className={labelClass} style={{ color: SK.ink }}>{t("Pays *")}</label>
          <input id="app-country" name="country" value={form.country} onChange={set} placeholder="Cameroun" required autoComplete="country-name" className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="app-city" className={labelClass} style={{ color: SK.ink }}>{t("Ville *")}</label>
          <input id="app-city" name="city" value={form.city} onChange={set} placeholder="Douala" required autoComplete="address-level2" className={inputClass} style={inputStyle} />
        </div>
      </div>

      <div>
        <span className={labelClass} style={{ color: SK.ink }}>{t("Vos réseaux sociaux")}</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {socials.map((s) => (
            <div key={s.name} className="flex items-center gap-2.5 h-[52px] rounded-2xl px-4 focus-within:bg-white transition-colors" style={inputStyle}>
              <s.icon className="w-[18px] h-[18px] shrink-0" weight={s.name === "other" ? "regular" : "fill"} style={{ color: SK.muted }} />
              <input aria-label={s.label} name={s.name} value={(form as any)[s.name]} onChange={set} placeholder={s.placeholder} className="flex-1 min-w-0 h-full text-[15px] bg-transparent outline-none" style={{ color: SK.ink }} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="app-followers" className={labelClass} style={{ color: SK.ink }}>{t("Abonnés (total) *")}</label>
          <select id="app-followers" name="followers" value={form.followers} onChange={set} required className={`${inputClass} px-3 text-[14px]`} style={inputStyle}>
            <option value="">{t("Sélectionner")}</option>
            {["< 1 000", "1K - 5K", "5K - 20K", "20K - 100K", "+ 100K"].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="app-content" className={labelClass} style={{ color: SK.ink }}>{t("Type de contenu *")}</label>
          <select id="app-content" name="content" value={form.content} onChange={set} required className={`${inputClass} px-3 text-[14px]`} style={inputStyle}>
            <option value="">{t("Sélectionner")}</option>
            {["Skincare / Routines", "Makeup & Beauté", "Lifestyle / Vlogs", "Autre"].map(v => <option key={v} value={v}>{t(v)}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="app-motivation" className={`${labelClass} leading-snug`} style={{ color: SK.ink }}>{t("Pourquoi souhaitez-vous rejoindre le programme ? *")}</label>
        <textarea id="app-motivation" name="motivation" value={form.motivation} onChange={set} required rows={4}
          placeholder={t("Votre passion pour la K-Beauty, votre lien avec votre communauté, pourquoi The Welfare vous correspond…")}
          className="w-full rounded-2xl px-4 py-3.5 text-[15px] leading-relaxed outline-none transition-colors focus:bg-white resize-none" style={inputStyle} />
      </div>

      <div>
        <label htmlFor="app-kit" className={labelClass} style={{ color: SK.ink }}>{t("Media kit, statistiques ou portfolio")}</label>
        <input id="app-kit" name="media_kit_url" value={form.media_kit_url} onChange={set} placeholder={t("Lien Google Drive, Notion, Linktree…")} className={inputClass} style={inputStyle} />
        <p className="mt-1.5 text-[12px]" style={{ color: SK.muted }}>{t("Facultatif")}</p>
      </div>

      {submitError && (
        <p className="text-[14px] font-medium rounded-2xl px-4 py-3" style={{ background: "#FDECEC", color: "#9F1C12" }}>{submitError}</p>
      )}

      <button type="submit" disabled={loading} className="w-full h-14 rounded-full text-white text-[16px] font-bold mt-1 transition-opacity disabled:opacity-60" style={{ background: SK.accent }}>
        {loading ? <CircleNotch className="w-5 h-5 animate-spin mx-auto" /> : t("Envoyer ma candidature")}
      </button>
    </form>
  );
}

/* ─── HERO VIDEO SLIDER ─────────────────────────────────────── */
function HeroVideoSlider() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % TIKTOKS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full flex flex-col items-center gap-3">
      <div className="relative w-[250px] h-[430px] md:w-[280px] md:h-[490px]" style={{ perspective: 1000 }}>
        {TIKTOKS.map((v, i) => {
          const off = (i - activeIdx + TIKTOKS.length) % TIKTOKS.length;
          const isCenter = off === 0;
          const x = off === 1 ? 128 : off === TIKTOKS.length - 1 ? -128 : 0;

          return (
            <motion.div
              key={v.id}
              initial={false}
              animate={{ x, scale: isCenter ? 1 : 0.84, zIndex: isCenter ? 10 : 5, opacity: isCenter ? 1 : 0.5, rotateY: off === 1 ? -10 : off === 2 ? 10 : 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className={`absolute inset-0 rounded-[30px] overflow-hidden origin-center ${isCenter ? "" : "pointer-events-none"}`}
              style={{ background: SK.tint, boxShadow: "0 24px 50px rgba(42,36,36,.14)" }}
              aria-hidden={!isCenter}
            >
              <img src={v.thumbnail} alt="" className="w-full h-full object-cover" />

              <div className="absolute inset-0 flex items-center justify-center pb-24">
                <span className="w-[60px] h-[60px] rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <Play className="w-6 h-6 ml-0.5" weight="fill" style={{ color: SK.accent }} />
                </span>
              </div>

              <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 bg-white/90 px-2.5 py-1.5 rounded-full text-[12px] font-bold" style={{ color: SK.ink }}>
                <TrendUp className="w-3.5 h-3.5" weight="bold" style={{ color: SK.accent }} />
                {v.views} vues
              </div>

              <div className="absolute left-2.5 right-2.5 bottom-2.5 p-3 rounded-[22px] bg-white flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <img src={v.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[13px] font-bold truncate" style={{ color: SK.ink }}>{v.creator}</span>
                      {v.verified && <Seal className="w-3.5 h-3.5 shrink-0" weight="fill" style={{ color: SK.accent }} />}
                    </div>
                    <span className="text-[11px]" style={{ color: SK.muted }}>{v.followers} abonnés</span>
                  </div>
                </div>
                <p className="text-[12px] leading-snug line-clamp-2" style={{ color: SK.ink }}>{v.caption}</p>
                <span className="self-start px-2.5 py-1 rounded-full text-[12px] font-bold" style={{ background: SK.tint, color: SK.accent }}>{v.earnings} gagnés</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex gap-1">
        {TIKTOKS.map((_, i) => (
          <button key={i} onClick={() => setActiveIdx(i)} aria-label={`Voir la vidéo ${i + 1}`} className="w-11 h-8 flex items-center justify-center">
            <span className="block h-2 rounded-full transition-all duration-300" style={{ width: i === activeIdx ? 28 : 8, background: i === activeIdx ? SK.accent : "#E6CFD9" }} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════ */
export function LandingAmbassadrice({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <div className="w-full flex flex-col" style={{ background: SK.ground, color: SK.ink }}>

      {/* ━━ HERO ━━ */}
      <section className="relative w-full overflow-hidden rounded-b-[40px] md:rounded-b-[56px]" style={{ background: SK.tint }}>
        <div className="relative w-full max-w-[1200px] mx-auto px-5 md:px-12 pt-8 pb-10 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          <div className="flex flex-col gap-5 md:gap-6">
            <motion.span variants={fadeUp} initial="hidden" animate="visible" custom={0}
              className="self-start px-3 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-[0.06em]"
              style={{ background: SK.surface, border: `1px solid ${SK.line}`, color: SK.muted }}>
              Programme créatrices partenaires
            </motion.span>

            <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
              style={{ margin: 0, fontFamily: DISPLAY_FONT, fontSize: "clamp(2.75rem, 5.5vw, 4.75rem)", lineHeight: 1.02, fontWeight: 300, letterSpacing: "-0.02em" }}>
              Gagnez des revenus en <span style={{ fontWeight: 700, color: SK.accent }}>partageant</span> ce que vous aimez
            </motion.h1>

            <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="text-[16px] md:text-lg leading-relaxed max-w-[520px]">
              Rejoignez plus de <strong>200 créatrices</strong> qui monétisent leur passion pour la K-Beauty avec{" "}
              <strong>jusqu'à 6 % de commission</strong> progressive. Sans abonnement minimum, sans engagement.
            </motion.p>

            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <a href="#postuler"
                className="h-14 px-8 rounded-full flex items-center justify-center gap-2 text-white text-[16px] font-bold transition-transform active:scale-[0.98] group"
                style={{ background: SK.accent }}>
                Rejoindre le programme
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" weight="bold" />
              </a>
              <a href="#comment" className="h-14 px-8 rounded-full flex items-center justify-center text-[16px] font-bold"
                style={{ background: SK.surface, border: `1px solid ${SK.line}`, color: SK.ink }}>
                Comment ça marche ?
              </a>
            </motion.div>

            {/* Approved creators reach their dashboard through their customer account */}
            <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={3} className="text-[14px] leading-relaxed" style={{ color: SK.muted }}>
              {isLoggedIn ? (
                <>Déjà créatrice partenaire ? Votre espace s&apos;ouvre avec le compte inscrit sur le numéro WhatsApp de votre candidature.</>
              ) : (
                <>Déjà créatrice partenaire ?{" "}
                  <a href="/account/login?redirect=%2Fambassadrices" className="font-bold underline underline-offset-2" style={{ color: SK.accent }}>
                    Connectez-vous à votre espace
                  </a>
                </>
              )}
            </motion.p>

            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4} className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {PROFILES.map((p) => (
                  <img key={p.name} src={p.img} alt="" className="w-9 h-9 rounded-full object-cover" style={{ border: `2px solid ${SK.tint}` }} />
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-1" role="img" aria-label="5 étoiles sur 5">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5" weight="fill" style={{ color: SK.accent }} />)}
                </div>
                <p className="text-[12px]" style={{ color: SK.muted }}>+200 créatrices actives en Afrique de l'Ouest</p>
              </div>
            </motion.div>
          </div>

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2} className="w-full">
            <HeroVideoSlider />
          </motion.div>
        </div>
      </section>

      {/* ━━ KPI ━━ */}
      <section className="w-full pt-7 md:pt-14">
        <div className="max-w-[1120px] mx-auto px-5 md:px-6">
          <KpiBento />
        </div>
      </section>

      {/* ━━ HOW IT WORKS ━━ */}
      <section id="comment" className="w-full py-12 md:py-24 scroll-mt-24">
        <div className="max-w-[1120px] mx-auto px-5 md:px-6">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="md:text-center mb-6 md:mb-14">
            <Eyebrow>Simple et transparent</Eyebrow>
            <Title light="Comment fonctionne" bold="le programme ?" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 md:gap-5">
            {STEPS.map((s, i) => {
              const strong = i === STEPS.length - 1;
              return (
                <motion.div key={s.n} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                  className="rounded-[28px] p-6 md:p-8 flex flex-col gap-3"
                  style={strong ? { background: SK.accent, color: "#FFFFFF" } : card}>
                  <div className="flex items-center justify-between">
                    <span className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: strong ? "rgba(255,255,255,.18)" : SK.tint }}>
                      <s.icon className="w-[22px] h-[22px]" weight="bold" style={{ color: strong ? "#FFFFFF" : SK.accent }} />
                    </span>
                    <span style={{ fontFamily: DISPLAY_FONT, fontSize: 44, fontWeight: 300, lineHeight: 1, color: strong ? "rgba(255,255,255,.55)" : SK.accentLight }}>{s.n}</span>
                  </div>
                  <h3 style={{ margin: 0, fontFamily: DISPLAY_FONT, fontSize: 23, lineHeight: 1.1, fontWeight: 700 }}>{s.title}</h3>
                  <p className="text-[14px] leading-relaxed" style={{ color: strong ? "#FFFFFF" : SK.muted }}>{s.body}</p>
                  <span className="mt-auto flex items-center gap-2 text-[13px] font-bold" style={{ color: strong ? "#FFFFFF" : SK.accent }}>
                    <Check className="w-4 h-4 shrink-0" weight="bold" />
                    {s.note}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ━━ CALCULATOR ━━ */}
      <RevenueCalculator />

      {/* ━━ PERKS ━━ */}
      <section className="w-full py-12 md:py-24">
        <div className="max-w-[1120px] mx-auto px-5 md:px-6">
          <PerksFeature />
        </div>
      </section>

      {/* ━━ FORM ━━ */}
      <section id="postuler" className="w-full py-12 md:py-24 scroll-mt-24">
        <div className="max-w-[1120px] mx-auto px-5 md:px-6 grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-16">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="lg:col-span-2">
            <Eyebrow>Rejoindre</Eyebrow>
            <Title light="Déposez votre" bold="candidature" />
            <p className="mt-3 mb-6 text-[15px] leading-relaxed" style={{ color: SK.muted }}>
              Notre équipe étudie votre profil et vous contacte sous <strong style={{ color: SK.ink }}>48 heures</strong> avec votre lien personnel. Toutes les créatrices passionnées sont les bienvenues.
            </p>
            <div className="flex flex-col gap-2.5">
              {[
                "Jusqu'à 6 % de commission sur chaque vente",
                "Tableau de bord personnel en temps réel",
                "Paiement mensuel par Mobile Money",
                "Accès prioritaire aux nouveautés",
                "Défis et récompenses chaque mois",
                "Accompagnement dédié 7 j/7",
              ].map((b) => (
                <div key={b} className="flex items-center gap-2.5">
                  <span className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0" style={{ background: SK.accent }}>
                    <Check className="w-3 h-3 text-white" weight="bold" />
                  </span>
                  <span className="text-[14px]">{b}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
            className="lg:col-span-3 rounded-[28px] p-5 md:p-8" style={card}>
            <ApplicationForm />
          </motion.div>
        </div>
      </section>

      {/* ━━ FAQ ━━ */}
      <section className="w-full pt-4 pb-16 md:pb-24">
        <div className="max-w-[820px] mx-auto px-5 md:px-6">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="md:text-center mb-6 md:mb-10">
            <Eyebrow>On répond à tout</Eyebrow>
            <Title light="Questions" bold="fréquentes" />
          </motion.div>

          <div className="flex flex-col gap-2.5 mb-8">
            {FAQ.map((f, i) => <FaqItem key={f.q} q={f.q} a={f.a} i={i} />)}
          </div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="rounded-[28px] px-6 py-7 md:p-10 flex flex-col items-center gap-2.5 text-center" style={{ background: SK.tint }}>
            <span className="w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center">
              <ChatCircle className="w-6 h-6" weight="bold" style={{ color: SK.accent }} />
            </span>
            <h3 style={{ margin: 0, fontFamily: DISPLAY_FONT, fontSize: 24, fontWeight: 300 }}>Une autre <span style={{ fontWeight: 700, color: SK.accent }}>question ?</span></h3>
            <p className="text-[14px] leading-relaxed" style={{ color: SK.muted }}>Notre équipe créatrices est disponible 7 j/7 pour vous accompagner.</p>
            <a href={`https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent("Bonjour, j'ai une question sur le programme créatrices partenaires.")}`}
              target="_blank" rel="noopener noreferrer"
              className="mt-1 h-[52px] px-7 rounded-full flex items-center gap-2 text-white text-[15px] font-bold" style={{ background: SK.accent }}>
              Nous écrire sur WhatsApp
            </a>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
