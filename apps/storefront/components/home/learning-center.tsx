"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, BookOpen, Clock, Sparkles } from "lucide-react";
import Link from "next/link";

const fadeUp = (delay = 0): any => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay },
});

const articles = [
  {
    id: 1,
    category: "Routine",
    tag: "Essentiel",
    title: "Comment superposer tes produits K-Beauty comme une experte",
    excerpt: "Le bon ordre d'application fait toute la différence. On décortique chaque étape pour un résultat glass skin optimal.",
    readTime: "5 min",
    image: "https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg?auto=compress&cs=tinysrgb&w=900",
    accent: "#F4EAEB",
    featured: true,
  },
  {
    id: 2,
    category: "Ingrédient",
    tag: "Tendance",
    title: "Centella Asiatica : pourquoi ta peau en a besoin",
    excerpt: "Cet ingrédient miracle apaise, répare et fortifie la barrière cutanée. Tout ce qu'il faut savoir.",
    readTime: "4 min",
    image: "https://images.pexels.com/photos/5938259/pexels-photo-5938259.jpeg?auto=compress&cs=tinysrgb&w=900",
    accent: "#EDE8F5",
    featured: false,
  },
  {
    id: 3,
    category: "Science",
    tag: "Expert",
    title: "Snail Mucin : la science derrière la réparation cutanée",
    excerpt: "Le mucus d'escargot est l'un des actifs les plus étudiés en K-Beauty. Résultats cliniques à l'appui.",
    readTime: "6 min",
    image: "https://images.pexels.com/photos/4465828/pexels-photo-4465828.jpeg?auto=compress&cs=tinysrgb&w=900",
    accent: "#E8F0ED",
    featured: false,
  },
  {
    id: 4,
    category: "Peau noire",
    tag: "Nouveau",
    title: "K-Beauty & peaux melanisées : ce qui fonctionne vraiment",
    excerpt: "Les formules coréennes sont-elles adaptées aux peaux africaines ? Notre analyse honnête et sans filtre.",
    readTime: "7 min",
    image: "https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg?auto=compress&cs=tinysrgb&w=900",
    accent: "#F4EAEB",
    featured: false,
  },
  {
    id: 5,
    category: "Tutoriel",
    tag: "Astuce",
    title: "Le Double Nettoyage : secret d'un teint lumineux",
    excerpt: "Pourquoi se laver le visage une fois ne suffit pas, surtout si vous portez de la crème solaire ou du maquillage.",
    readTime: "3 min",
    image: "https://images.pexels.com/photos/8131583/pexels-photo-8131583.jpeg?auto=compress&cs=tinysrgb&w=900",
    accent: "#E8F0ED",
    featured: false,
  },
  {
    id: 6,
    category: "Ingrédient",
    tag: "Zoom",
    title: "Niacinamide : l'actif à tout faire",
    excerpt: "Pores dilatés, taches, rougeurs... Découvrez pourquoi la Niacinamide est l'actif favori des dermatologues.",
    readTime: "5 min",
    image: "https://images.pexels.com/photos/4465829/pexels-photo-4465829.jpeg?auto=compress&cs=tinysrgb&w=900",
    accent: "#EDE8F5",
    featured: false,
  },
  {
    id: 7,
    category: "Comparatif",
    tag: "Avis",
    title: "Les meilleures crèmes solaires coréennes de 2026",
    excerpt: "Fini le teint grisâtre ! Notre top 5 des écrans solaires K-Beauty sans trace blanche, parfaits pour tous les jours.",
    readTime: "8 min",
    image: "https://images.pexels.com/photos/4198246/pexels-photo-4198246.jpeg?auto=compress&cs=tinysrgb&w=900",
    accent: "#F4EAEB",
    featured: false,
  },
];

export function LearningCenter() {
  const featured = articles[0]!;
  const secondary = articles.slice(1);

  return (
    <section className="w-full bg-[#F4EAEB] py-16 md:py-24 lg:py-32 overflow-hidden relative">
      {/* Cherry blossom background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.15] pointer-events-none"
        style={{ backgroundImage: "url('/cherry_blossom_bg.png')", mixBlendMode: 'multiply' }}
      />
      <div className="w-full max-w-[1600px] mx-auto px-5 md:px-8 lg:px-12 relative z-10">

        {/* ── Header ── */}
        <motion.div {...fadeUp()} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-14">
          <div>

            <h2 className="text-[2.5rem] md:text-[3.5rem] leading-[1.1] font-medium tracking-tight text-[#2A2424]">
              Apprends la science<br />
              <em className="font-serif not-italic text-[#E5B6B9]">d'une peau rayonnante</em>
            </h2>
          </div>
          <Link
            href="/journal"
            className="flex items-center gap-2 bg-[#2A2424] text-white px-6 py-3 rounded-full font-medium hover:bg-black transition-all duration-300 w-fit text-sm shrink-0"
          >
            Tous les articles
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* ══════════════════════════════════════════
            DESKTOP LAYOUT — Bento asymétrique
            ══════════════════════════════════════════ */}
        <div className="hidden md:grid md:grid-cols-12 md:grid-rows-2 gap-4 h-[700px]">

          {/* ── Article featured — col-span-6 row-span-2 ── */}
          <motion.div
            {...fadeUp(0)}
            className="md:col-span-6 md:row-span-2 group relative rounded-[1.5rem] overflow-hidden cursor-pointer"
          >
            <img
              src={featured.image}
              alt={featured.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#2A2424]/90 via-[#2A2424]/30 to-transparent" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold tracking-[0.15em] uppercase text-[#E5B6B9]">{featured.category}</span>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <div className="flex items-center gap-1 text-white/50">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">{featured.readTime}</span>
                </div>
              </div>
              <h3 className="text-2xl lg:text-3xl font-medium text-white leading-snug mb-4 max-w-md">
                {featured.title}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-sm line-clamp-2">
                {featured.excerpt}
              </p>
              <div className="flex items-center gap-2 text-sm font-semibold text-white opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                Lire l'article <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            {/* Featured badge */}
            <div className="absolute top-6 left-6 flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full">
              <Sparkles className="w-3 h-3 text-[#E5B6B9]" />
              <span className="text-white text-xs font-medium">À la une</span>
            </div>
          </motion.div>

          {/* ── 3 small cards ── */}
          {secondary.map((article, i) => (
            <motion.div
              key={article.id}
              {...fadeUp(0.1 + i * 0.08)}
              className="md:col-span-6 lg:col-span-2 group relative rounded-[1.5rem] overflow-hidden cursor-pointer bg-white"
            >
              {/* Image top half */}
              <div className="relative h-[52%] overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                {/* Tag badge */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#2A2424]">{article.tag}</span>
                </div>
              </div>

              {/* Text bottom half */}
              <div className="p-5 flex flex-col justify-between h-[48%]">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#E5B6B9]">{article.category}</span>
                    <span className="w-1 h-1 rounded-full bg-[#2A2424]/20" />
                    <div className="flex items-center gap-1 text-[#2A2424]/40">
                      <Clock className="w-2.5 h-2.5" />
                      <span className="text-[10px]">{article.readTime}</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-[#2A2424] leading-snug line-clamp-2 group-hover:text-[#2A2424]/70 transition-colors">
                    {article.title}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#2A2424] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Lire <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </motion.div>
          ))}

        </div>

        {/* ════════════════════
            MOBILE LAYOUT
            ════════════════════ */}
        <div className="flex flex-col gap-4 md:hidden">

          {/* Featured card */}
          <motion.div {...fadeUp(0)} className="group relative rounded-[1.5rem] overflow-hidden h-[380px] cursor-pointer">
            <img src={featured.image} alt={featured.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2A2424]/90 via-[#2A2424]/30 to-transparent" />
            <div className="absolute top-5 left-5 flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full">
              <Sparkles className="w-3 h-3 text-[#E5B6B9]" />
              <span className="text-white text-xs font-medium">À la une</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <span className="text-xs font-bold tracking-[0.15em] uppercase text-[#E5B6B9] block mb-2">{featured.category}</span>
              <h3 className="text-xl font-medium text-white leading-snug mb-1">{featured.title}</h3>
              <div className="flex items-center gap-1 text-white/50 mt-2">
                <Clock className="w-3 h-3" />
                <span className="text-xs">{featured.readTime}</span>
              </div>
            </div>
          </motion.div>

          {/* Horizontal swipe strip */}
          <div className="-mx-5 px-5 overflow-x-auto no-scrollbar">
            <div className="flex gap-3 pb-2" style={{ width: "max-content" }}>
              {secondary.map((article, i) => (
                <motion.div
                  key={article.id}
                  {...fadeUp(i * 0.07)}
                  className="rounded-[1.25rem] overflow-hidden bg-white flex-shrink-0 w-[220px] cursor-pointer group"
                >
                  <div className="relative h-[140px] overflow-hidden">
                    <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
                      <span className="text-[9px] font-bold tracking-widest uppercase text-[#2A2424]">{article.tag}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <span className="text-[9px] font-bold tracking-[0.12em] uppercase text-[#E5B6B9] block mb-1.5">{article.category}</span>
                    <h3 className="text-sm font-semibold text-[#2A2424] leading-snug line-clamp-3">{article.title}</h3>
                    <div className="flex items-center gap-1 text-[#2A2424]/40 mt-2">
                      <Clock className="w-2.5 h-2.5" />
                      <span className="text-[10px]">{article.readTime}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <Link
            href="/journal"
            className="flex items-center justify-center gap-2 bg-[#2A2424] text-white font-semibold py-4 rounded-full text-sm"
          >
            Lire tous les articles <ArrowUpRight className="w-4 h-4" />
          </Link>

        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
}
