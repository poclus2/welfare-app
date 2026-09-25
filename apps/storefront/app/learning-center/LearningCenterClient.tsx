"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MagnifyingGlass, Clock, ArrowRight, BookOpen } from "@phosphor-icons/react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  coverImage: string;
  author: string;
  readingTime: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
};

const CATEGORIES = ["Tous", "Skincare", "Nutrition", "Tendances", "Routine", "Ingrédients", "Conseils"];

const CATEGORY_COLORS: Record<string, string> = {
  Skincare: "bg-rose-50 text-rose-600",
  Nutrition: "bg-green-50 text-green-600",
  Tendances: "bg-purple-50 text-purple-600",
  Routine: "bg-amber-50 text-amber-600",
  "Ingrédients": "bg-blue-50 text-blue-600",
  Conseils: "bg-[#F4EAEB] text-[#C08A8E]",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function ArticleCard({ post, index, featured = false }: { post: BlogPost; index: number; featured?: boolean }) {
  const { t } = useI18n();
  const categoryColor = CATEGORY_COLORS[post.category] || "bg-gray-50 text-gray-600";

  if (featured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="group col-span-full mb-8"
      >
        <Link href={`/learning-center/${post.slug}`}>
          <div className="relative rounded-3xl overflow-hidden bg-[#2A2424] shadow-2xl" style={{ boxShadow: "0 50px 100px -20px rgba(42,36,36,0.25), 0 30px 60px -30px rgba(0,0,0,0.2)" }}>
            {post.coverImage ? (
              <div className="relative h-[420px] md:h-[520px] overflow-hidden">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2A2424] via-[#2A2424]/40 to-transparent" />
              </div>
            ) : (
              <div className="h-[320px] md:h-[420px] bg-gradient-to-br from-[#3D2B2D] via-[#2A2424] to-[#1a1414] flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-[#E5B6B9]/10 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-[#E5B6B9]/40" weight="light" />
                </div>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#E5B6B9] mb-4 bg-[#E5B6B9]/10 px-3 py-1 rounded-full">
                {t("À la une")} — {t(post.category)}
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight tracking-tight mb-4 group-hover:text-[#E5B6B9] transition-colors" style={{ letterSpacing: "-0.02em" }}>
                {post.title}
              </h2>
              <p className="text-white/60 text-base md:text-lg mb-6 max-w-2xl leading-relaxed">{post.summary}</p>
              <div className="flex items-center gap-6 text-white/40 text-sm">
                <span>{post.author}</span>
                <span>·</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" weight="light" /> {post.readingTime} {t("min de lecture")}</span>
                <span>·</span>
                <span>{formatDate(post.createdAt)}</span>
              </div>
            </div>
            <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white group-hover:bg-[#E5B6B9] group-hover:text-[#2A2424] transition-all">
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" weight="bold" />
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <Link href={`/learning-center/${post.slug}`}>
        <div className="bg-white rounded-2xl overflow-hidden border border-[#F4EAEB] hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col" style={{ boxShadow: "0 4px 24px -8px rgba(42,36,36,0.08)" }}>
          {/* Cover Image */}
          <div className="relative h-52 overflow-hidden bg-[#F8F5F2] shrink-0">
            {post.coverImage ? (
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-[#E5B6B9]/40" weight="light" />
              </div>
            )}
            <span className={`absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full ${categoryColor}`}>
              {t(post.category)}
            </span>
          </div>

          {/* Content */}
          <div className="p-5 flex flex-col flex-1">
            <h3 className="font-bold text-[#2A2424] text-lg leading-snug mb-2 group-hover:text-[#C08A8E] transition-colors line-clamp-2" style={{ letterSpacing: "-0.01em" }}>
              {post.title}
            </h3>
            <p className="text-[#2A2424]/60 text-sm leading-relaxed line-clamp-3 flex-1 mb-4">
              {post.summary}
            </p>
            <div className="flex items-center justify-between text-xs text-[#2A2424]/40 border-t border-[#F4EAEB] pt-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#F4EAEB] flex items-center justify-center">
                  <span className="text-[10px] font-bold text-[#C08A8E]">{post.author[0]}</span>
                </div>
                <span className="font-medium">{post.author}</span>
              </div>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" weight="light" /> {post.readingTime} {t("min")}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function LearningCenterClient({ posts }: { posts: BlogPost[] }) {
  const { t } = useI18n();
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return posts.filter(p => {
      const matchCat = activeCategory === "Tous" || p.category === activeCategory;
      const matchSearch = !search || 
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.summary.toLowerCase().includes(search.toLowerCase()) ||
        (p.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [posts, activeCategory, search]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <main className="min-h-screen bg-[#FDFDFC]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#FDFDFC] pt-20 pb-16">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-[#F4EAEB]/60 blur-[120px] pointer-events-none" />
        <div className="absolute top-8 right-1/4 w-[400px] h-[400px] rounded-full bg-[#E5B6B9]/30 blur-[100px] pointer-events-none" />
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#C08A8E] bg-[#F4EAEB] px-4 py-2 rounded-full mb-6">
              <BookOpen className="w-3.5 h-3.5" weight="fill" />
              {t("Learning Center")}
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-[#2A2424] mb-6 leading-tight" style={{ letterSpacing: "-0.03em" }}>
              {t("Tout savoir sur")}<br />
              <span className="text-[#C08A8E]">{t("votre peau")}</span>
            </h1>
            <p className="text-lg md:text-xl text-[#2A2424]/60 max-w-2xl mx-auto leading-relaxed mb-10">
              {t("Articles, conseils d'expertes et routines personnalisées pour prendre soin de votre peau au quotidien.")}
            </p>

            {/* Search */}
            <div className="relative max-w-md mx-auto mb-10">
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2A2424]/30" weight="light" />
              <input
                type="text"
                placeholder={t("Rechercher un article...")}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white border border-[#EDE0E0] rounded-full pl-10 pr-5 py-3.5 text-sm text-[#2A2424] focus:outline-none focus:ring-2 focus:ring-[#E5B6B9]/40 shadow-sm placeholder:text-[#2A2424]/30"
              />
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    activeCategory === cat
                      ? "bg-[#2A2424] text-white shadow-md"
                      : "bg-white border border-[#EDE0E0] text-[#2A2424]/60 hover:border-[#E5B6B9] hover:text-[#2A2424]"
                  }`}
                >
                  {t(cat)}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Articles */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <BookOpen className="w-16 h-16 text-[#E5B6B9] mx-auto mb-4" weight="light" />
            <h3 className="text-xl font-bold text-[#2A2424] mb-2">{t("Aucun article trouvé")}</h3>
            <p className="text-[#2A2424]/50">{t("Essayez une autre catégorie ou un autre mot-clé.")}</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Featured */}
            {featured && <ArticleCard post={featured} index={0} featured />}
            {/* Rest */}
            {rest.map((post, i) => (
              <ArticleCard key={post.id} post={post} index={i + 1} />
            ))}
          </div>
        )}

        {/* Stats */}
        {posts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-16 py-8 border-t border-[#F4EAEB]"
          >
            <p className="text-[#2A2424]/40 text-sm">
              {posts.length} {posts.length > 1 ? t("articles disponibles") : t("article disponible")}
            </p>
          </motion.div>
        )}
      </section>
    </main>
  );
}
