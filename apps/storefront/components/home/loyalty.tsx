"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Play,
  TrendingUp,
  Users,
  DollarSign,
  Share2,
  Star,
  ChevronRight,
  BadgeCheck,
} from "lucide-react";
import Link from "next/link";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay },
});

/* ── Simulated TikTok cards ── */
const tiktoks = [
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

/* ── How it works steps ── */
const steps = [
  {
    num: "01",
    icon: <Share2 className="w-5 h-5" />,
    title: "Rejoins le programme",
    desc: "Crée ton compte et obtiens ton lien affilié unique en moins de 2 minutes.",
  },
  {
    num: "02",
    icon: <Play className="w-5 h-5" />,
    title: "Crée & partage",
    desc: "Publie tes vidéos TikTok, Reels ou stories avec ton lien. Plus c'est authentique, plus ça convertit.",
  },
  {
    num: "03",
    icon: <DollarSign className="w-5 h-5" />,
    title: "Encaisse",
    desc: "Gagne jusqu'à 15% de commission sur chaque vente générée. Paiement chaque semaine par Mobile Money.",
  },
];

/* ── Stats ── */
const stats = [
  { value: "850+", label: "Influenceurs actifs", icon: <Users className="w-4 h-4" /> },
  { value: "15%", label: "Commission par vente", icon: <TrendingUp className="w-4 h-4" /> },
  { value: "7 jours", label: "Délai de paiement", icon: <DollarSign className="w-4 h-4" /> },
];

function TikTokCard({ t, delay }: { t: typeof tiktoks[0]; delay: number }) {
  return (
    <motion.div
      {...fadeUp(delay)}
      className="group relative rounded-[1.5rem] overflow-hidden bg-[#1A1616] flex-shrink-0 w-full md:w-auto"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[9/16] w-full overflow-hidden">
        <img
          src={t.thumbnail}
          alt={t.caption}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Play className="w-6 h-6 text-white fill-white ml-1" />
          </div>
        </div>

        {/* Views badge */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
          <TrendingUp className="w-3 h-3 text-[#E5B6B9]" />
          <span className="text-white text-xs font-medium">{t.views} vues</span>
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Creator info */}
          <div className="flex items-center gap-2 mb-3">
            <img src={t.avatar} alt={t.creator} className="w-8 h-8 rounded-full object-cover border-2 border-white/30" />
            <div>
              <div className="flex items-center gap-1">
                <span className="text-white text-sm font-semibold">{t.creator}</span>
                {t.verified && <BadgeCheck className="w-3.5 h-3.5 text-[#E5B6B9] fill-[#E5B6B9]" />}
              </div>
              <span className="text-white/60 text-xs">{t.followers} abonnés</span>
            </div>
          </div>

          <p className="text-white/80 text-xs leading-relaxed line-clamp-2 mb-3">{t.caption}</p>

          {/* Earnings pill */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-xs text-white/60">{t.likes} likes</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#E5B6B9]/20 border border-[#E5B6B9]/40 px-2.5 py-1 rounded-full">
              <DollarSign className="w-3 h-3 text-[#E5B6B9]" />
              <span className="text-xs font-bold text-[#E5B6B9]">{t.earnings} gagnés</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function LoyaltyProgram() {
  return (
    <section className="w-full bg-[#FFFFFF] py-16 md:py-24 lg:py-32 overflow-hidden relative">
      {/* Cherry blossom background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.12] pointer-events-none"
        style={{ backgroundImage: "url('/cherry_blossom_bg.png')" }}
      />
      <div className="w-full max-w-[1600px] mx-auto px-5 md:px-8 lg:px-12 relative z-10">

        {/* ── Section Header ── */}
        <motion.div {...fadeUp()} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
          <div className="max-w-2xl">

            <h2 className="text-[2.5rem] md:text-[3.5rem] leading-[1.1] font-medium tracking-tight text-[#2A2424]">
              Gagne de l'argent en<br />
              <em className="font-serif not-italic text-[#E5B6B9]">partageant ce que tu aimes</em>
            </h2>
          </div>
          <Link
            href="/influenceurs"
            className="flex items-center gap-2 bg-[#2A2424] text-white px-6 py-3 rounded-full font-medium hover:bg-black transition-all duration-300 w-fit text-sm shrink-0"
          >
            Rejoindre le programme
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* ══════════════════════════════════════════
            DESKTOP LAYOUT — Bento 4 cols × 3 rows
            ══════════════════════════════════════════ */}
        <div className="hidden md:grid md:grid-cols-4 md:grid-rows-3 gap-4 h-[900px]">

          {/* ── Hero CTA card — col-span-1 row-span-2 ── */}
          <motion.div
            {...fadeUp(0)}
            className="md:col-span-1 md:row-span-2 rounded-[1.5rem] bg-[#2A2424] p-7 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-52 h-52 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full bg-[#E5B6B9]/10 translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-[0.75rem] bg-[#E5B6B9]/20 flex items-center justify-center mb-6">
                <DollarSign className="w-6 h-6 text-[#E5B6B9]" />
              </div>
              <h3 className="text-2xl font-medium text-white leading-tight mb-3">
                Jusqu'à <span className="text-[#E5B6B9]">15%</span> de commission sur chaque vente
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Partage ton lien unique, tes abonnés achètent, tu encaisses. C'est aussi simple que ça.
              </p>
            </div>

            {/* Fake earnings counter */}
            <div className="relative z-10">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Tes gains potentiels / mois</p>
              <p className="text-3xl font-bold text-white mb-5">150 000 FCFA</p>
              <Link
                href="/influenceurs"
                className="flex items-center justify-center gap-2 bg-white text-[#2A2424] hover:bg-[#F4EAEB] transition-colors font-semibold py-3 px-5 rounded-full text-sm w-full"
              >
                Je commence maintenant
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* ── TikTok cards — each col-span-1 row-span-2 ── */}
          {tiktoks.map((t, i) => (
            <motion.div
              key={t.id}
              {...fadeUp(0.1 + i * 0.1)}
              className="md:col-span-1 md:row-span-2 rounded-[1.5rem] overflow-hidden group relative bg-[#1A1616]"
            >
              <div className="relative h-full w-full">
                <img
                  src={t.thumbnail}
                  alt={t.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />

                {/* Play */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-6 h-6 text-white fill-white ml-1" />
                  </div>
                </div>

                {/* Views */}
                <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3 text-[#E5B6B9]" />
                  <span className="text-white text-xs font-medium">{t.views}</span>
                </div>

                {/* Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={t.avatar} alt={t.creator} className="w-8 h-8 rounded-full object-cover border-2 border-white/30" />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-white text-sm font-semibold">{t.creator}</span>
                        {t.verified && <BadgeCheck className="w-3.5 h-3.5 text-[#E5B6B9] fill-[#E5B6B9]" />}
                      </div>
                      <span className="text-white/55 text-xs">{t.followers} abonnés</span>
                    </div>
                  </div>
                  <p className="text-white/75 text-xs leading-relaxed line-clamp-2 mb-3">{t.caption}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-xs">❤️ {t.likes}</span>
                    <div className="flex items-center gap-1.5 bg-[#E5B6B9]/20 border border-[#E5B6B9]/40 px-2.5 py-1 rounded-full">
                      <span className="text-xs font-bold text-[#E5B6B9]">{t.earnings}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* ── Bottom banner — col-span-4 row-span-1 ── */}
          <motion.div
            {...fadeUp(0.4)}
            className="md:col-span-4 md:row-span-1 rounded-[1.5rem] bg-[#F4EAEB] overflow-hidden relative flex items-center"
          >
            {/* Steps */}
            <div className="flex items-stretch w-full divide-x divide-[#E5B6B9]/30">
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  {...fadeUp(0.45 + i * 0.08)}
                  className="flex-1 px-8 py-7 flex flex-col justify-between group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[#E5B6B9] font-bold text-sm">{step.num}</span>
                    <div className="w-8 h-8 rounded-[0.5rem] bg-white flex items-center justify-center text-[#2A2424]">
                      {step.icon}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2A2424] text-base mb-1.5">{step.title}</h4>
                    <p className="text-[#2A2424]/55 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}

              {/* Stats panel */}
              <div className="flex-shrink-0 w-72 px-8 py-7 bg-[#2A2424] flex flex-col justify-between">
                <p className="text-white/50 text-xs uppercase tracking-widest mb-4">Notre communauté</p>
                <div className="flex flex-col gap-4">
                  {stats.map((s) => (
                    <div key={s.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white/60 text-xs">
                        {s.icon}
                        {s.label}
                      </div>
                      <span className="text-white font-bold text-sm">{s.value}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/influenceurs"
                  className="flex items-center justify-center gap-2 bg-white text-[#2A2424] hover:bg-[#F4EAEB] transition-colors font-semibold py-2.5 px-4 rounded-full text-xs mt-4"
                >
                  Devenir ambassadeur <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* ════════════════════
          MOBILE LAYOUT
          ════════════════════ */}
      <div className="flex flex-col gap-4 md:hidden px-5 mt-8">

          {/* CTA Hero */}
          <motion.div {...fadeUp(0)} className="rounded-[1.5rem] bg-[#2A2424] p-7 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
            <div className="w-10 h-10 rounded-[0.6rem] bg-[#E5B6B9]/20 flex items-center justify-center mb-5">
              <DollarSign className="w-5 h-5 text-[#E5B6B9]" />
            </div>
            <h3 className="text-2xl font-medium text-white leading-tight mb-2">
              Gagne jusqu'à <span className="text-[#E5B6B9]">15%</span> par vente
            </h3>
            <p className="text-white/50 text-sm mb-6 leading-relaxed">
              Partage ton lien, tes abonnés achètent, tu encaisses chaque semaine par Mobile Money.
            </p>
            <Link
              href="/influenceurs"
              className="flex items-center justify-center gap-2 bg-white text-[#2A2424] font-semibold py-3.5 rounded-full text-sm"
            >
              Rejoindre le programme <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Stats strip */}
          <motion.div {...fadeUp(0.1)} className="grid grid-cols-3 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="rounded-[1rem] bg-[#F4EAEB] p-4 flex flex-col items-center text-center gap-1">
                <span className="font-bold text-[#2A2424] text-lg">{s.value}</span>
                <span className="text-[#2A2424]/55 text-[10px] leading-tight">{s.label}</span>
              </div>
            ))}
          </motion.div>

          {/* TikTok horizontal scroll */}
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#2A2424]/50 mb-3">Nos créateurs</p>
            <div className="-mx-5 px-5 overflow-x-auto no-scrollbar">
              <div className="flex gap-3 pb-2" style={{ width: "max-content" }}>
                {tiktoks.map((t, i) => (
                  <motion.div
                    key={t.id}
                    {...fadeUp(i * 0.07)}
                    className="relative rounded-[1.25rem] overflow-hidden bg-[#1A1616] flex-shrink-0 w-[190px] h-[310px] group"
                  >
                    <img src={t.thumbnail} alt={t.caption} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/30" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center">
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full">
                      <TrendingUp className="w-2.5 h-2.5 text-[#E5B6B9]" />
                      <span className="text-white text-[10px] font-medium">{t.views}</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <img src={t.avatar} alt={t.creator} className="w-7 h-7 rounded-full object-cover border border-white/30" />
                        <span className="text-white text-xs font-semibold truncate">{t.creator}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-[#E5B6B9]/20 border border-[#E5B6B9]/40 px-2 py-1 rounded-full w-fit">
                        <span className="text-[10px] font-bold text-[#E5B6B9]">{t.earnings}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#2A2424]/50">Comment ça marche</p>
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                {...fadeUp(0.1 + i * 0.07)}
                className="rounded-[1.25rem] bg-[#F4EAEB] p-5 flex items-start gap-4"
              >
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold text-[#E5B6B9]">{step.num}</span>
                  <div className="w-9 h-9 rounded-[0.6rem] bg-white flex items-center justify-center text-[#2A2424]">
                    {step.icon}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-[#2A2424] text-sm mb-1">{step.title}</h4>
                  <p className="text-[#2A2424]/55 text-xs leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <Link
            href="/influenceurs"
            className="flex items-center justify-center gap-2 bg-[#2A2424] text-white font-semibold py-4 rounded-full text-sm"
          >
            Devenir ambassadeur <ArrowUpRight className="w-4 h-4" />
          </Link>

        </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
}
