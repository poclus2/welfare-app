"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Plus, Pencil, Trash2, Eye, EyeOff,
  Search, ArrowRight, Clock, AlertTriangle
} from "lucide-react";
import Link from "next/link";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  author: string;
  readingTime: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  coverImage: string;
};

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL || "";
const ADMIN_KEY = "welfare-admin-2024";

const CATEGORIES = ["Tous", "Skincare", "Nutrition", "Tendances", "Routine", "Ingrédients", "Conseils"];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function BlogClient() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Tous");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${STOREFRONT_URL}/api/blog?all=true`, {
        headers: { "x-admin-key": ADMIN_KEY },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const togglePublish = async (post: BlogPost) => {
    setTogglingId(post.id);
    try {
      await fetch(`${STOREFRONT_URL}/api/blog/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
        body: JSON.stringify({ ...post, published: !post.published }),
      });
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, published: !p.published } : p));
    } finally {
      setTogglingId(null);
    }
  };

  const deletePost = async (id: string) => {
    try {
      await fetch(`${STOREFRONT_URL}/api/blog/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": ADMIN_KEY },
      });
      setPosts(prev => prev.filter(p => p.id !== id));
    } finally {
      setDeleteId(null);
    }
  };

  const filtered = posts.filter(p => {
    const matchCat = filterCat === "Tous" || p.category === filterCat;
    const matchStatus = filterStatus === "all" || (filterStatus === "published" ? p.published : !p.published);
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchStatus && matchSearch;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2A2424]" style={{ letterSpacing: "-0.02em" }}>Blog & Articles</h1>
          <p className="text-sm text-[#2A2424]/50 mt-0.5">{posts.length} article{posts.length !== 1 ? "s" : ""} au total</p>
        </div>
        <Link
          href="/dashboard/blog/new"
          className="flex items-center gap-2 bg-[#2A2424] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-black transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouvel article
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#EDE0E0] rounded-2xl p-4 flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2A2424]/30" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-[#F5F0EB] border border-[#EDE0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C08A8E]/30 text-[#2A2424]"
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-1">
          {(["all", "published", "draft"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                filterStatus === s ? "bg-[#2A2424] text-white" : "text-[#2A2424]/50 hover:bg-[#F5F0EB]"
              }`}
            >
              {s === "all" ? "Tous" : s === "published" ? "Publiés" : "Brouillons"}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-2 text-xs font-semibold bg-[#F5F0EB] border border-[#EDE0E0] rounded-xl text-[#2A2424] focus:outline-none"
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#EDE0E0] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-[#C08A8E] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <FileText className="w-12 h-12 text-[#C08A8E]/30 mb-3" />
            <p className="text-sm font-medium text-[#2A2424]/50">Aucun article trouvé</p>
            <Link href="/dashboard/blog/new" className="mt-3 text-xs text-[#C08A8E] hover:underline font-medium">
              Créer le premier article →
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EDE0E0] bg-[#F5F0EB]/50">
                <th className="text-left text-xs font-bold text-[#2A2424]/40 uppercase tracking-wider px-5 py-3">Article</th>
                <th className="text-left text-xs font-bold text-[#2A2424]/40 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Catégorie</th>
                <th className="text-left text-xs font-bold text-[#2A2424]/40 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Date</th>
                <th className="text-left text-xs font-bold text-[#2A2424]/40 uppercase tracking-wider px-4 py-3">Statut</th>
                <th className="text-right text-xs font-bold text-[#2A2424]/40 uppercase tracking-wider px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE0E0]">
              <AnimatePresence>
                {filtered.map((post, i) => (
                  <motion.tr
                    key={post.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-[#F5F0EB]/30 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {post.coverImage ? (
                          <img src={post.coverImage} alt="" className="w-10 h-10 rounded-xl object-cover border border-[#EDE0E0] shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-[#F4EAEB] flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-[#C08A8E]" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#2A2424] truncate max-w-[220px]">{post.title}</p>
                          <p className="text-xs text-[#2A2424]/40 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> {post.readingTime} min · {post.author}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-[#F4EAEB] text-[#C08A8E] rounded-full">
                        {post.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-xs text-[#2A2424]/50">{formatDate(post.createdAt)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => togglePublish(post)}
                        disabled={togglingId === post.id}
                        className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full transition-colors ${
                          post.published
                            ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-600 hover:bg-amber-100"
                        }`}
                      >
                        {post.published
                          ? <><Eye className="w-3 h-3" /> Publié</>
                          : <><EyeOff className="w-3 h-3" /> Brouillon</>
                        }
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/blog/${post.id}/edit`}
                          className="p-2 rounded-xl text-[#2A2424]/40 hover:bg-[#F4EAEB] hover:text-[#C08A8E] transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteId(post.id)}
                          className="p-2 rounded-xl text-[#2A2424]/40 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)}
              className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl p-6 shadow-2xl w-[340px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-bold text-[#2A2424] text-lg mb-2">Supprimer l'article ?</h3>
              <p className="text-sm text-[#2A2424]/60 mb-6">Cette action est irréversible. L'article sera définitivement supprimé.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#EDE0E0] text-sm font-semibold text-[#2A2424]/60 hover:bg-[#F5F0EB] transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => deletePost(deleteId)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
