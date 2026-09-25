"use client";

import { useI18n } from "@/lib/i18n-context";
import { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence, useMotionValue, useSpring, useTransform, type Variants } from "framer-motion";
import {
  Sparkle,
  ArrowRight,
  ArrowUpRight,
  Users,
  CurrencyCircleDollar,
  ShareNetwork,
  TrendUp,
  Check,
  CaretDown,
  Star,
  InstagramLogo,
  YoutubeLogo,
  TiktokLogo,
  LinkSimple,
  ChartLineUp,
  Gift,
  Crown,
  Heart,
  Camera,
  Play,
  Seal,
  CircleNotch,
} from "@phosphor-icons/react";
import Link from "next/link";

/* ─── PALETTE (identique au site) ─────────────────────────── */
const C = {
  charcoal: "#2A2424",
  rose:     "#E5B6B9",
  crimson:  "#C2164A",
  mauve:    "#C08A8E",
  cream:    "#F8F5F2",
  blush:    "#F4EAEB",
  border:   "#EDE0E0",
  white:    "#FFFFFF",
};

/* ─── FADE-UP ANIMATION VARIANT ───────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 },
  }),
};

/* ─── ANIMATED COUNTER ────────────────────────────────────── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => `${Math.round(v).toLocaleString("fr-FR")}${suffix}`);

  useEffect(() => { if (inView) mv.set(to); }, [inView, to, mv]);
  return <motion.span ref={ref}>{display}</motion.span>;
}

/* ─── DATA ─────────────────────────────────────────────────── */
const KPI_STATS = [
  { value: 200, suffix: "+", label: "Créatrices Partenaires actives", icon: <Users className="w-5 h-5" weight="fill" /> },
  { value: 12,  suffix: "M FCFA", label: "Commissions versées", icon: <CurrencyCircleDollar className="w-5 h-5" weight="fill" /> },
  { value: 15,  suffix: "%", label: "Commission par vente", icon: <TrendUp className="w-5 h-5" weight="fill" /> },
  { value: 48,  suffix: "h", label: "Réponse candidature", icon: <Sparkle className="w-5 h-5" weight="fill" /> },
];

const PROFILES = [
  { name: "Aminata D.", handle: "@aminata.glow", platform: "instagram", followers: "42K", earnings: "285 000", img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&h=650&fit=crop&crop=face", tag: "Routines K-Beauty" },
  { name: "Fatoumata K.", handle: "@fatou.beauty", platform: "tiktok", followers: "128K", earnings: "620 000", img: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=500&h=650&fit=crop&crop=face", tag: "Reviews Produits" },
  { name: "Mariama S.", handle: "@mariama.skin", platform: "instagram", followers: "8K", earnings: "95 000", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&h=650&fit=crop&crop=face", tag: "Nano-créatrice" },
  { name: "Rokhaya T.", handle: "@rokhaya.talks", platform: "youtube", followers: "67K", earnings: "410 000", img: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=500&h=650&fit=crop&crop=face", tag: "Soin & Lifestyle" },
];

const TIKTOKS = [
  {
    id: 1,
    creator: "@sofiabeauty_cm",
    avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
    followers: "42K",
    caption: "Ma routine glass skin avec Cosrx 🫧✨ #kbeauty #skincare #wellfareshop",
    likes: "12.4K",
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
    caption: "J'ai testé la routine anti-taches pendant 30 jours 👀 résultats CHOQUANTS #thewelfare",
    likes: "8.9K",
    views: "91K",
    thumbnail: "https://images.pexels.com/photos/4041391/pexels-photo-4041391.jpeg?auto=compress&cs=tinysrgb&w=400",
    earnings: "41 000 FCFA",
    verified: true,
  },
  {
    id: 3,
    creator: "@laetibeauty",
    avatar: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
    followers: "9.2K",
    caption: "Ces produits coréens ont changé ma peau en 2 semaines 🤍 #kbeauty",
    likes: "5.1K",
    views: "55K",
    thumbnail: "https://images.pexels.com/photos/5938260/pexels-photo-5938260.jpeg?auto=compress&cs=tinysrgb&w=400",
    earnings: "22 500 FCFA",
    verified: false,
  },
];

const STEPS = [
  { n: "01", icon: <LinkSimple className="w-6 h-6" weight="bold" />, title: "Postulez & recevez votre lien", body: "Remplissez le formulaire en bas de page. Sous 48h, vous recevez votre lien et code personnalisés avec Jusqu'à 6% de commission sur chaque vente.", note: "100% gratuit, aucun engagement", bg: C.blush, accent: C.mauve },
  { n: "02", icon: <Camera className="w-6 h-6" weight="bold" />, title: "Créez, partagez, inspirez", body: "Publiez vos routines sincères, vos hauls K-Beauty, vos avis. Votre lien unique traque toutes les ventes — Instagram, TikTok, YouTube, lien en bio.", note: "Tous les réseaux supportés", bg: C.rose, accent: C.crimson },
  { n: "03", icon: <CurrencyCircleDollar className="w-6 h-6" weight="bold" />, title: "Encaissez chaque mois", body: "Jusqu'à 6% sur chaque vente via votre lien. Paiement mensuel garanti par Mobile Money (Wave, Orange Money) ou virement bancaire.", note: "Paiement le 1er de chaque mois", bg: C.charcoal, accent: C.rose },
];

const PERKS = [
  { icon: <TrendUp className="w-5 h-5" />, title: "Commissions progressives (jusqu'à 6%)", sub: "Sur chaque vente, sans plafond" },
  { icon: <ChartLineUp className="w-5 h-5" />, title: "Dashboard temps réel", sub: "Clics, ventes, commissions live" },
  { icon: <Gift className="w-5 h-5" />, title: "Produits offerts", sub: "Top 10 mensuel = cadeaux exclusifs" },
  { icon: <Crown className="w-5 h-5" />, title: "Classement créatrices partenaires", sub: "Challenges et récompenses mensuelles" },
  { icon: <Heart className="w-5 h-5" />, title: "-20% sur vos achats", sub: "Dès 5 ventes réalisées / mois" },
  { icon: <ShareNetwork className="w-5 h-5" />, title: "Support dédié", sub: "Équipe disponible 7j/7" },
];

const FAQ = [
  { q: "Le programme est-il vraiment gratuit ?", a: "Oui, entièrement. Aucun frais d'adhésion, aucun produit obligatoire, aucun engagement. Vous postulez, vous êtes acceptée, et vous commencez à partager votre lien." },
  { q: "Combien de followers faut-il avoir ?", a: "Aucun minimum. Nano-créatrice (500 abonnés) ou macro-influenceuse (500K+), toutes sont les bienvenues. L'authenticité prime sur la taille de l'audience." },
  { q: "Comment sont calculées les commissions ?", a: "Vous gagnez jusqu'à 6% sur le montant net HT de chaque commande passée via votre lien ou code. Vos commissions s'accumulent en temps réel dans votre tableau de bord personnel." },
  { q: "Quels types de contenus fonctionnent le mieux ?", a: "Les revues sincères, routines morning/evening filmées, hauls mensuels et comparatifs avant/après. L'authenticité génère 3x plus de conversions que le contenu sponsorisé générique." },
  { q: "Puis-je bénéficier de produits offerts ?", a: "À partir de 5 ventes/mois, vous avez -20% sur vos achats. Le Top 10 mensuel reçoit des produits en avant-première, avant même leur sortie officielle sur le site." },
];

/* ─── PLATFORM ICON ─────────────────────────────────────────── */
function PIcon({ p }: { p: string }) {
  if (p === "instagram") return <InstagramLogo className="w-4 h-4" weight="fill" />;
  if (p === "tiktok")    return <TiktokLogo className="w-4 h-4" weight="fill" />;
  return <YoutubeLogo className="w-4 h-4" weight="fill" />;
}

/* ─── FAQ ITEM ──────────────────────────────────────────────── */
function FaqItem({ q, a, i }: { q: string; a: string; i: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`border rounded-2xl overflow-hidden transition-all duration-300 ${open ? "border-[#E5B6B9] shadow-[0_8px_30px_rgba(229,182,185,0.15)]" : "border-[#EDE0E0]"} bg-white`}
    >
      <button className="w-full flex items-center justify-between px-7 py-5 text-left gap-4 group" onClick={() => setOpen(!open)}>
        <span className={`font-semibold text-sm md:text-base transition-colors ${open ? "text-[#C2164A]" : "text-[#2A2424] group-hover:text-[#C2164A]"}`}>{q}</span>
        <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}
          className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${open ? "bg-[#C2164A] text-white" : "bg-[#F4EAEB] text-[#2A2424]"}`}>
          <ArrowRight className="w-3.5 h-3.5 -rotate-45" weight="bold" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.3 }}>
            <p className="px-7 pb-6 text-sm text-[#2A2424]/65 leading-relaxed border-t border-[#F4EAEB] pt-4">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── REVENUE CALCULATOR ─────────────────────────────────────── */
function RevenueCalculator() {
  const [community, setCommunity] = useState(10000);
  const [engagement, setEngagement] = useState(3);
  const [posts, setPosts] = useState(4);
  const clicks   = Math.round((community * engagement / 100) * posts * 0.05);
  const orders   = Math.round(clicks * 0.04);
  const caEligible = orders * 18000;
  let rate = 0.03;
  if (caEligible >= 1000000) rate = 0.06;
  else if (caEligible >= 600000) rate = 0.04;
  const revenue = Math.round(caEligible * rate);
  const currentRateStr = (rate * 100) + "%";

  const sliders = [
    { label: "Taille de votre communauté", val: community, set: setCommunity, min: 500, max: 200000, step: 500, fmt: (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v.toString() },
    { label: "Taux d'engagement", val: engagement, set: setEngagement, min: 0.5, max: 15, step: 0.5, fmt: (v: number) => `${v}%` },
    { label: "Posts par mois", val: posts, set: setPosts, min: 1, max: 20, step: 1, fmt: (v: number) => `${v} posts` },
  ];

  return (
    <section className="w-full py-24 md:py-32 bg-[#F8F5F2] border-t border-[#EDE0E0] overflow-hidden relative">
      {/* Decorative */}
      <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-[#E5B6B9]/15 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />

      <div className="relative max-w-[1120px] mx-auto px-6">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
          <span className="inline-block text-[10px] font-bold uppercase tracking-[0.25em] text-[#C08A8E] mb-4">Simulateur</span>
          <h2 className="text-3xl md:text-[2.75rem] font-bold text-[#2A2424] leading-tight mb-4" style={{ letterSpacing: "-0.025em" }}>
            Calculez vos revenus<br className="hidden md:block" /> mensuels potentiels
          </h2>
          <p className="text-[#2A2424]/55 max-w-md mx-auto">
            Ajustez les curseurs selon votre profil pour une estimation personnalisée.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          {/* Controls */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
            className="bg-white rounded-3xl p-8 md:p-10 border border-[#EDE0E0] shadow-[0_20px_60px_rgba(42,36,36,0.06)] flex flex-col gap-8">
            {sliders.map((s, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-semibold text-[#2A2424]">{s.label}</span>
                  <span className="text-sm font-bold text-[#C2164A] bg-[#F4EAEB] px-3 py-1 rounded-full">{s.fmt(s.val)}</span>
                </div>
                <div className="relative">
                  <input type="range" min={s.min} max={s.max} step={s.step} value={s.val}
                    onChange={e => s.set(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: C.crimson, background: `linear-gradient(to right, #C2164A ${((s.val - s.min) / (s.max - s.min)) * 100}%, #F4EAEB ${((s.val - s.min) / (s.max - s.min)) * 100}%)` }}
                  />
                </div>
              </div>
            ))}

            <div className="flex items-center gap-3 bg-[#F4EAEB]/60 rounded-2xl p-4 mt-2">
              <div className="w-10 h-10 rounded-xl bg-[#2A2424] flex items-center justify-center shrink-0">
                <TrendUp className="w-4 h-4 text-[#E5B6B9]" weight="bold" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#2A2424]">Commission progressive The Welfare</p>
                <p className="text-xs text-[#2A2424]/55">{currentRateStr} sur ce volume — Panier moyen 18 000 FCFA</p>
              </div>
            </div>
          </motion.div>

          {/* Result card */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2}
            className="relative bg-[#2A2424] rounded-3xl p-8 md:p-10 shadow-[0_50px_100px_rgba(42,36,36,0.30)] flex flex-col gap-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#E5B6B9]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#C2164A]/10 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Estimation mensuelle</p>
              <AnimatePresence mode="wait">
                <motion.div key={revenue} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                  <p className="text-5xl md:text-6xl font-bold text-white leading-none" style={{ letterSpacing: "-0.04em" }}>
                    {revenue.toLocaleString("fr-FR")}
                  </p>
                  <p className="text-2xl font-bold text-[#E5B6B9] mt-1">FCFA / mois</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative z-10 flex flex-col gap-3 border-t border-white/10 pt-6">
              {[
                { l: "Commandes estimées", v: `${orders} / mois` },
                { l: "Clics estimés", v: clicks.toLocaleString("fr-FR") },
                { l: "Panier moyen", v: "18 000 FCFA" },
              ].map((r, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm text-white/50">{r.l}</span>
                  <span className="text-sm font-bold text-white">{r.v}</span>
                </div>
              ))}
            </div>

            <p className="text-white/25 text-[11px] leading-relaxed relative z-10">
              * Estimation indicative. Les résultats varient selon la qualité du contenu et l'engagement de votre audience.
            </p>

            <a href="#postuler" className="relative z-10 flex items-center justify-center gap-2 bg-[#E5B6B9] text-[#2A2424] py-4 rounded-2xl font-bold text-sm hover:bg-white transition-all duration-200 group">
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
function ApplicationForm() {
  const { t } = useI18n();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ firstName:"", lastName:"", email:"", phone:"", instagram:"", tiktok:"", youtube:"", followers:"", content:"", motivation:"", other:"", country:"", city:"", media_kit_url:"" });
  
  const set = (e: any) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  if (sent) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16 text-center gap-5">
      <div className="w-20 h-20 rounded-full bg-[#E5B6B9]/20 border-2 border-[#E5B6B9] flex items-center justify-center">
        <Check className="w-10 h-10 text-[#C2164A]" weight="bold" />
      </div>
      <h3 className="text-2xl font-bold text-[#2A2424]" style={{ letterSpacing: "-0.02em" }}>{t("Candidature reçue !")}</h3>
      <p className="text-[#2A2424]/60 max-w-sm leading-relaxed">{t("Notre équipe examine votre candidature et vous contacte sous 7 jours ouvrés.")}</p>
    </motion.div>
  );

  return (
    <form onSubmit={async e => { 
      e.preventDefault(); 
      setLoading(true); 
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
        if(res.ok) setSent(true);
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }} className="flex flex-col gap-5">
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#2A2424]/45 mb-2">{t("Prénom *")}</label>
          <input name="firstName" value={form.firstName} onChange={set} placeholder="Aminata" required className="w-full bg-[#F8F5F2] border border-[#EDE0E0] rounded-xl px-4 py-3.5 text-sm text-[#2A2424] outline-none focus:border-[#E5B6B9] focus:bg-white transition-all duration-200" />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#2A2424]/45 mb-2">{t("Nom *")}</label>
          <input name="lastName" value={form.lastName} onChange={set} placeholder="Diallo" required className="w-full bg-[#F8F5F2] border border-[#EDE0E0] rounded-xl px-4 py-3.5 text-sm text-[#2A2424] outline-none focus:border-[#E5B6B9] focus:bg-white transition-all duration-200" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#2A2424]/45 mb-2">{t("Email *")}</label>
          <input name="email" type="email" value={form.email} onChange={set} placeholder="aminata@email.com" required className="w-full bg-[#F8F5F2] border border-[#EDE0E0] rounded-xl px-4 py-3.5 text-sm text-[#2A2424] outline-none focus:border-[#E5B6B9] focus:bg-white transition-all duration-200" />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#2A2424]/45 mb-2">{t("Téléphone WhatsApp")}</label>
          <input name="phone" value={form.phone} onChange={set} placeholder="+221 77 000 00 00" className="w-full bg-[#F8F5F2] border border-[#EDE0E0] rounded-xl px-4 py-3.5 text-sm text-[#2A2424] outline-none focus:border-[#E5B6B9] focus:bg-white transition-all duration-200" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#2A2424]/45 mb-2">{t("Pays *")}</label>
          <input name="country" value={form.country} onChange={set} placeholder="Sénégal" required className="w-full bg-[#F8F5F2] border border-[#EDE0E0] rounded-xl px-4 py-3.5 text-sm text-[#2A2424] outline-none focus:border-[#E5B6B9] focus:bg-white transition-all duration-200" />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#2A2424]/45 mb-2">{t("Ville *")}</label>
          <input name="city" value={form.city} onChange={set} placeholder="Dakar" required className="w-full bg-[#F8F5F2] border border-[#EDE0E0] rounded-xl px-4 py-3.5 text-sm text-[#2A2424] outline-none focus:border-[#E5B6B9] focus:bg-white transition-all duration-200" />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#2A2424]/45 mb-3">{t("Vos réseaux sociaux")}</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 bg-[#F8F5F2] border border-[#EDE0E0] rounded-xl px-4 py-3.5 focus-within:border-[#E5B6B9] focus-within:bg-white transition-all duration-200">
            <InstagramLogo className="w-4 h-4 text-[#2A2424]/40 shrink-0" weight="fill" />
            <input name="instagram" value={form.instagram} onChange={set} placeholder="@votre.handle" className="flex-1 text-sm text-[#2A2424] bg-transparent outline-none" />
          </div>
          <div className="flex items-center gap-3 bg-[#F8F5F2] border border-[#EDE0E0] rounded-xl px-4 py-3.5 focus-within:border-[#E5B6B9] focus-within:bg-white transition-all duration-200">
            <TiktokLogo className="w-4 h-4 text-[#2A2424]/40 shrink-0" weight="fill" />
            <input name="tiktok" value={form.tiktok} onChange={set} placeholder="@votre.handle" className="flex-1 text-sm text-[#2A2424] bg-transparent outline-none" />
          </div>
          <div className="flex items-center gap-3 bg-[#F8F5F2] border border-[#EDE0E0] rounded-xl px-4 py-3.5 focus-within:border-[#E5B6B9] focus-within:bg-white transition-all duration-200">
            <YoutubeLogo className="w-4 h-4 text-[#2A2424]/40 shrink-0" weight="fill" />
            <input name="youtube" value={form.youtube} onChange={set} placeholder={t("Nom de chaîne")} className="flex-1 text-sm text-[#2A2424] bg-transparent outline-none" />
          </div>
          <div className="flex items-center gap-3 bg-[#F8F5F2] border border-[#EDE0E0] rounded-xl px-4 py-3.5 focus-within:border-[#E5B6B9] focus-within:bg-white transition-all duration-200">
            <LinkSimple className="w-4 h-4 text-[#2A2424]/40 shrink-0" />
            <input name="other" value={form.other} onChange={set} placeholder={t("Autre lien")} className="flex-1 text-sm text-[#2A2424] bg-transparent outline-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-2">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#2A2424]/45 mb-2">{t("Followers (total) *")}</label>
          <select name="followers" value={form.followers} onChange={set} required className="w-full bg-[#F8F5F2] border border-[#EDE0E0] rounded-xl px-4 py-3.5 text-sm text-[#2A2424] outline-none focus:border-[#E5B6B9] transition-all appearance-none">
            <option value="">{t("Sélectionner")}</option>
            {["< 1 000","1K - 5K","5K - 20K","20K - 100K","+ 100K"].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#2A2424]/45 mb-2">{t("Type de contenu *")}</label>
          <select name="content" value={form.content} onChange={set} required className="w-full bg-[#F8F5F2] border border-[#EDE0E0] rounded-xl px-4 py-3.5 text-sm text-[#2A2424] outline-none focus:border-[#E5B6B9] transition-all appearance-none">
            <option value="">{t("Sélectionner")}</option>
            {["Skincare / Routines", "Makeup & Beauté", "Lifestyle / Vlogs", "Autre"].map(v => <option key={v} value={v}>{t(v)}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-2">
        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#2A2424]/45 mb-2">{t("Pourquoi souhaitez-vous rejoindre le programme Créateurs Partenaires The Welfare ? *")}</label>
        <textarea name="motivation" value={form.motivation} onChange={set} required rows={4}
          placeholder={t("Partagez votre passion pour la K-Beauty, votre rapport avec votre communauté, pourquoi The Welfare vous correspond...")}
          className="w-full bg-[#F8F5F2] border border-[#EDE0E0] rounded-xl px-4 py-3.5 text-sm text-[#2A2424] outline-none focus:border-[#E5B6B9] focus:bg-white transition-all resize-none" />
      </div>

      <div className="mt-2">
        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#2A2424]/45 mb-2">{t("Pièce jointe (Media Kit, stats, portfolio)")}</label>
        <p className="text-xs text-[#2A2424]/40 mb-3">{t("Facultatif — Collez un lien Google Drive, Notion, Linktree ou similaire")}</p>
        <input name="media_kit_url" value={form.media_kit_url} onChange={set} placeholder="https://drive.google.com/..." className="w-full bg-[#F8F5F2] border border-[#EDE0E0] rounded-xl px-4 py-3.5 text-sm text-[#2A2424] outline-none focus:border-[#E5B6B9] focus:bg-white transition-all duration-200" />
      </div>

      <button type="submit" disabled={loading} className="w-full bg-[#2A2424] text-white rounded-xl py-4 font-bold text-sm mt-2 hover:bg-[#2A2424]/90 transition-colors disabled:opacity-50">
        {loading ? <CircleNotch className="w-5 h-5 animate-spin mx-auto" /> : t("Envoyer ma candidature")}
      </button>
    </form>
  );
}

function HeroVideoSlider() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % TIKTOKS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full max-w-[450px] h-[560px] mx-auto lg:ml-auto lg:-mr-4 flex items-center justify-center">
      <div className="relative w-[280px] h-[500px] perspective-1000">
        {TIKTOKS.map((t, i) => {
          // Calculer la position relative
          const offset = i - activeIdx;
          const isNext = offset === 1 || (activeIdx === TIKTOKS.length - 1 && i === 0);
          const isPrev = offset === -1 || (activeIdx === 0 && i === TIKTOKS.length - 1);
          const isCenter = offset === 0;

          let x = 0;
          let scale = 1;
          let zIndex = 10;
          let opacity = 1;
          let rotateY = 0;

          if (isNext) {
            x = 130;
            scale = 0.85;
            zIndex = 5;
            opacity = 0.5;
            rotateY = -12;
          } else if (isPrev) {
            x = -130;
            scale = 0.85;
            zIndex = 5;
            opacity = 0.5;
            rotateY = 12;
          } else if (!isCenter) {
            opacity = 0;
          }

          return (
            <motion.div
              key={t.id}
              initial={false}
              animate={{ x, scale, zIndex, opacity, rotateY }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className={`absolute inset-0 rounded-[2rem] overflow-hidden bg-[#1A1616] shadow-[0_30px_80px_rgba(42,36,36,0.15)] cursor-pointer origin-center ${!isCenter && "pointer-events-none"}`}
              onClick={() => setActiveIdx(i)}
            >
              <div className="relative h-full w-full">
                <img src={t.thumbnail} alt={t.caption} className="w-full h-full object-cover transition-transform duration-700" style={{ transform: isCenter ? "scale(1)" : "scale(1.05)" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />

                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-xl transition-transform duration-300 ${isCenter ? "hover:scale-110" : ""}`}>
                    <Play className="w-7 h-7 text-white ml-1" weight="fill" />
                  </div>
                </div>

                {/* Views */}
                <div className="absolute top-5 left-5 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full">
                  <TrendUp className="w-3.5 h-3.5 text-[#E5B6B9]" weight="bold" />
                  <span className="text-white text-xs font-bold">{t.views}</span>
                </div>

                {/* Bottom Info */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={t.avatar} alt={t.creator} className="w-10 h-10 rounded-full object-cover border-2 border-white/30" />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-white text-sm font-bold">{t.creator}</span>
                        {t.verified && <Seal className="w-4 h-4 text-[#E5B6B9]" weight="fill" />}
                      </div>
                      <span className="text-white/60 text-xs font-medium">{t.followers} abonnés</span>
                    </div>
                  </div>
                  <p className="text-white/80 text-xs leading-relaxed line-clamp-2 mb-4">{t.caption}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs font-medium">❤️ {t.likes}</span>
                    <div className="flex items-center gap-1.5 bg-[#E5B6B9]/20 border border-[#E5B6B9]/40 px-3 py-1.5 rounded-full">
                      <span className="text-xs font-bold text-[#E5B6B9]">{t.earnings}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination dots */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
        {TIKTOKS.map((_, i) => (
          <button key={i} onClick={() => setActiveIdx(i)}
            className={`h-2 rounded-full transition-all duration-300 ${i === activeIdx ? "w-8 bg-[#C2164A]" : "w-2 bg-[#2A2424]/15 hover:bg-[#2A2424]/30"}`} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════ */
export function LandingAmbassadrice() {
  return (
    <div className="w-full flex flex-col font-sans bg-[#FDFDFC]">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ HERO ━━ */}
      <section className="relative w-full min-h-[92vh] flex items-center overflow-hidden bg-[#F4EAEB]">
        {/* Animated gradient orbs */}
        <div className="absolute top-[-15%] right-[-10%] w-[700px] h-[700px] rounded-full bg-[#E5B6B9]/30 blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#C2164A]/8 blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 md:px-12 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div>
            <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="text-[clamp(2.8rem,5.5vw,5rem)] font-bold text-[#2A2424] leading-[1.05] mb-6"
              style={{ letterSpacing: "-0.03em" }}>
              Gagnez des revenus en{" "}
              <em className="not-italic text-[#C2164A]" style={{ fontStyle: "italic" }}>partageant</em>
              <br />ce que vous aimez
            </motion.h1>

            <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="text-lg text-[#2A2424]/65 leading-relaxed mb-10 max-w-[500px]">
              Rejoignez plus de <strong className="text-[#2A2424] font-bold">200 créatrices</strong> qui monétisent leur passion pour la K-Beauty avec{" "}
              <strong className="text-[#2A2424] font-bold">jusqu'à 6% de commission</strong> progressives. Sans abonnement minimum, sans engagement.
            </motion.p>

            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="flex flex-wrap gap-4 mb-14">
              <a href="#postuler"
                className="inline-flex items-center gap-2 bg-[#2A2424] text-white px-8 py-4 rounded-full text-[15px] font-semibold hover:bg-black transition-all hover:scale-[1.02] active:scale-[0.98] group"
                style={{ boxShadow: "0 4px 20px rgba(42,36,36,0.25)" }}>
                Rejoindre le programme
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" weight="bold" />
              </a>
              <a href="#comment" className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-[#EDE0E0] text-[#2A2424] px-8 py-4 rounded-full text-[15px] font-semibold hover:bg-white hover:border-[#E5B6B9] transition-all">
                Comment ça marche ?
              </a>
            </motion.div>

            {/* Mini social proof */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4} className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {PROFILES.slice(0, 4).map((p, i) => (
                  <img key={i} src={p.img} alt={p.name} className="w-9 h-9 rounded-full border-2 border-[#F4EAEB] object-cover" />
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-1">{[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-amber-400" weight="fill" />)}</div>
                <p className="text-xs text-[#2A2424]/55">+200 créatrices partenaires actives en Afrique de l'Ouest</p>
              </div>
            </motion.div>
          </div>

          {/* Right: Video Slider */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="w-full h-[560px] mt-8 lg:mt-0">
            <HeroVideoSlider />
          </motion.div>
        </div>

        {/* Slanted divider */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#FDFDFC]" style={{ clipPath: "polygon(0 100%, 100% 100%, 100% 0)" }} />
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ KPI BAR ━━ */}
      <section className="w-full bg-[#FDFDFC] py-14">
        <div className="max-w-[1120px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {KPI_STATS.map((s, i) => (
            <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
              className="bg-white rounded-2xl px-6 py-6 border border-[#EDE0E0] shadow-[0_4px_24px_rgba(42,36,36,0.06)] hover:shadow-[0_8px_32px_rgba(42,36,36,0.10)] hover:-translate-y-0.5 transition-all duration-300 group">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#C08A8E]">{s.icon}</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-[#2A2424] mb-1" style={{ letterSpacing: "-0.02em" }}>
                <Counter to={s.value} suffix={s.suffix} />
              </p>
              <p className="text-xs text-[#2A2424]/50 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ HOW IT WORKS ━━ */}
      <section id="comment" className="w-full py-24 md:py-32 bg-[#F8F5F2] border-t border-[#EDE0E0]">
        <div className="max-w-[1120px] mx-auto px-6">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16 md:mb-20">
            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.25em] text-[#C08A8E] mb-4">Simple & transparent</span>
            <h2 className="text-3xl md:text-[2.75rem] font-bold text-[#2A2424] leading-tight" style={{ letterSpacing: "-0.025em" }}>
              Comment fonctionne le programme<br className="hidden md:block" /> d'affiliation ?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {STEPS.map((s, i) => (
              <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                className={`relative rounded-3xl p-8 md:p-10 overflow-hidden group transition-transform duration-300 hover:-translate-y-1 ${i === 2 ? "md:col-span-1" : ""}`}
                style={{ backgroundColor: s.bg, boxShadow: i === 2 ? "0 20px 60px rgba(42,36,36,0.20)" : "0 4px 24px rgba(42,36,36,0.06)" }}>

                {/* Watermark number */}
                <span className="absolute -top-4 -right-2 text-[120px] font-bold leading-none select-none pointer-events-none"
                  style={{ color: i === 2 ? "rgba(255,255,255,0.04)" : "rgba(42,36,36,0.05)" }}>
                  {s.n}
                </span>

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm"
                    style={{ backgroundColor: i === 2 ? "rgba(229,182,185,0.15)" : "#2A2424", color: i === 2 ? s.accent : "#FDFDFC" }}>
                    {s.icon}
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 block"
                    style={{ color: i === 2 ? "rgba(229,182,185,0.6)" : "rgba(42,36,36,0.35)" }}>
                    Étape {s.n}
                  </span>

                  <h3 className="text-xl font-bold mb-4 leading-snug" style={{ color: i === 2 ? "#FDFDFC" : "#2A2424", letterSpacing: "-0.02em" }}>
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed mb-6" style={{ color: i === 2 ? "rgba(255,255,255,0.55)" : "rgba(42,36,36,0.60)" }}>
                    {s.body}
                  </p>

                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" weight="bold" style={{ color: s.accent }} />
                    <span className="text-xs font-semibold" style={{ color: i === 2 ? "rgba(229,182,185,0.80)" : s.accent }}>
                      {s.note}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CALCULATOR ━━ */}
      <RevenueCalculator />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PERKS ━━━━ */}
      <section className="w-full py-24 md:py-32 bg-white border-t border-[#EDE0E0]">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left text */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <span className="inline-block text-[10px] font-bold uppercase tracking-[0.25em] text-[#C08A8E] mb-4">Votre tableau de bord</span>
              <h2 className="text-3xl md:text-[2.75rem] font-bold text-[#2A2424] leading-tight mb-6" style={{ letterSpacing: "-0.025em" }}>
                Tout ce dont vous avez besoin<br className="hidden md:block" /> pour réussir
              </h2>
              <p className="text-[#2A2424]/60 leading-relaxed mb-10">
                Un espace personnel complet pour suivre vos performances, gérer vos liens, et encaisser vos commissions — le tout depuis votre téléphone.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PERKS.map((perk, i) => (
                  <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i * 0.5}
                    className="flex items-start gap-3 p-4 rounded-2xl border border-[#EDE0E0] bg-[#F8F5F2] hover:border-[#E5B6B9] hover:bg-white transition-all duration-200 group">
                    <div className="w-9 h-9 rounded-xl bg-[#2A2424] group-hover:bg-[#C2164A] flex items-center justify-center text-[#E5B6B9] shrink-0 transition-colors">
                      {perk.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#2A2424]">{perk.title}</p>
                      <p className="text-xs text-[#2A2424]/50 mt-0.5">{perk.sub}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Dashboard mock */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2}>
              <div className="relative">
                {/* Glow */}
                <div className="absolute inset-0 bg-[#E5B6B9]/20 rounded-3xl blur-2xl scale-95 pointer-events-none" />

                <div className="relative bg-white rounded-3xl overflow-hidden border border-[#EDE0E0] shadow-[0_30px_80px_rgba(42,36,36,0.12)]">
                  {/* Dashboard top bar */}
                  <div className="bg-[#2A2424] px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#E5B6B9]/40" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#E5B6B9]/30" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#E5B6B9]/20" />
                      </div>
                      <span className="text-white/40 text-xs">dashboard.thewelfare.store</span>
                    </div>
                    <span className="text-[10px] font-bold bg-[#E5B6B9]/20 text-[#E5B6B9] px-3 py-1 rounded-full">Créatrice Partenaire ✦</span>
                  </div>

                  {/* Dashboard body */}
                  <div className="p-6 bg-[#F8F5F2]">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="text-xs text-[#2A2424]/40 font-medium">Bonjour,</p>
                        <p className="font-bold text-[#2A2424] text-lg" style={{ letterSpacing: "-0.01em" }}>Aminata D. ✦</p>
                      </div>
                      <span className="text-[10px] font-bold bg-[#2A2424] text-white px-3 py-1.5 rounded-full">Septembre 2025</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-5">
                      {[
                        { l: "Ventes", v: "18", sub: "ce mois", highlight: false },
                        { l: "Commissions", v: "247K", sub: "FCFA", highlight: true },
                        { l: "Clics", v: "1 243", sub: "total", highlight: false },
                      ].map((k, i) => (
                        <div key={i} className={`rounded-2xl p-4 text-center ${k.highlight ? "bg-[#2A2424]" : "bg-white border border-[#EDE0E0]"}`}>
                          <p className={`text-xl font-bold leading-none mb-1 ${k.highlight ? "text-[#E5B6B9]" : "text-[#2A2424]"}`} style={{ letterSpacing: "-0.02em" }}>{k.v}</p>
                          <p className={`text-[10px] font-bold ${k.highlight ? "text-white/50" : "text-[#2A2424]/40"}`}>{k.l}</p>
                          <p className={`text-[9px] mt-0.5 ${k.highlight ? "text-white/25" : "text-[#2A2424]/25"}`}>{k.sub}</p>
                        </div>
                      ))}
                    </div>

                    {/* Bar chart */}
                    <div className="bg-white rounded-2xl p-5 border border-[#EDE0E0] mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-bold text-[#2A2424]">Commissions — 6 mois</p>
                        <span className="text-[10px] text-[#C2164A] font-bold">+34% ↑</span>
                      </div>
                      <div className="flex items-end gap-2 h-20">
                        {[30, 45, 25, 60, 75, 100].map((h, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full rounded-t-lg transition-all" style={{ height: `${h}%`, backgroundColor: i === 5 ? "#C2164A" : "#F4EAEB" }} />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-2">
                        {["Avr","Mai","Jui","Jul","Aoû","Sep"].map(m => (
                          <span key={m} className="text-[9px] text-[#2A2424]/30 flex-1 text-center">{m}</span>
                        ))}
                      </div>
                    </div>

                    {/* Link field */}
                    <div className="flex items-center gap-2 bg-white border border-[#EDE0E0] rounded-xl px-4 py-3">
                      <LinkSimple className="w-4 h-4 text-[#2A2424]/30 shrink-0" />
                      <span className="flex-1 text-xs text-[#2A2424]/50 truncate">thewelfare.store?promo=AMINATA15</span>
                      <button className="bg-[#2A2424] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shrink-0">Copier</button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ FORM ━━━━ */}
      <section id="postuler" className="w-full py-24 md:py-32 bg-[#F8F5F2] border-t border-[#EDE0E0] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#E5B6B9]/15 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="relative max-w-[1120px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 md:gap-16">

            {/* Left sidebar */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="lg:col-span-2">
              <span className="inline-block text-[10px] font-bold uppercase tracking-[0.25em] text-[#C08A8E] mb-4">Rejoindre</span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#2A2424] mb-5 leading-tight" style={{ letterSpacing: "-0.025em" }}>
                Déposez votre candidature
              </h2>
              <p className="text-[#2A2424]/60 text-sm leading-relaxed mb-10">
                Remplissez ce formulaire. Notre équipe étudie votre profil et vous contacte sous <strong className="text-[#2A2424]">48 heures</strong> avec votre lien d'affiliation. Toutes les créatrices passionnées sont les bienvenues.
              </p>

              <div className="flex flex-col gap-3">
                {[
                  "Jusqu'à 6% de commission sur chaque vente",
                  "Tableau de bord personnel en temps réel",
                  "Paiement mensuel Wave / Orange Money",
                  "Accès prioritaire aux nouveaux produits",
                  "Programme de récompenses & challenges",
                  "Support dédié aux créatrices 7j/7",
                ].map((b, i) => (
                  <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i * 0.5}
                    className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#2A2424] flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-[#E5B6B9]" weight="bold" />
                    </div>
                    <span className="text-sm text-[#2A2424]/80">{b}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Form card */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
              className="lg:col-span-3 bg-white rounded-3xl p-8 md:p-10 border border-[#EDE0E0] shadow-[0_20px_60px_rgba(42,36,36,0.08)]">
              <ApplicationForm />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ FAQ ━━━━ */}
      <section className="w-full py-24 md:py-32 bg-white border-t border-[#EDE0E0]">
        <div className="max-w-[820px] mx-auto px-6">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.25em] text-[#C08A8E] mb-4">On répond à tout</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#2A2424]" style={{ letterSpacing: "-0.025em" }}>Questions fréquentes</h2>
          </motion.div>

          <div className="flex flex-col gap-3 mb-14">
            {FAQ.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} i={i} />)}
          </div>

          {/* Contact band */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-[#2A2424] p-8 md:p-10 text-center"
            style={{ boxShadow: "0 30px 80px rgba(42,36,36,0.25)" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-[#3D3030] to-[#2A2424] pointer-events-none" />
            <div className="absolute top-0 right-0 w-56 h-56 bg-[#E5B6B9]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <Sparkle className="w-8 h-8 text-[#E5B6B9] mx-auto mb-4" weight="fill" />
              <h3 className="text-white text-xl font-bold mb-2" style={{ letterSpacing: "-0.02em" }}>Une autre question ?</h3>
              <p className="text-white/50 text-sm mb-6">Notre équipe créatrices partenaires est disponible 7j/7 pour vous accompagner.</p>
              <a href="mailto:créatrices partenaires@thewelfare.store"
                className="inline-flex items-center gap-2 bg-[#E5B6B9] text-[#2A2424] px-7 py-3.5 rounded-full font-bold text-sm hover:bg-white transition-all hover:scale-105 active:scale-95 group">
                Nous écrire
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" weight="bold" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
