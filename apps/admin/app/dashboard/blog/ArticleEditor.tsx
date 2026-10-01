"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Save, Rocket, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type BlogPost = {
  id?: string;
  slug?: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  coverImage: string;
  author: string;
  readingTime?: number;
  published: boolean;
  tags: string[];
};

const CATEGORIES = ["Skincare", "Nutrition", "Tendances", "Routine", "Ingrédients", "Conseils"];

// Escapes any raw HTML the author typed BEFORE the markdown rules below add
// their own well-formed tags, so pasted/typed <script>, onerror=, etc. never
// reach dangerouslySetInnerHTML as live markup.
function escapeHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function markdownToHtml(content: string) {
  return escapeHtml(content)
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<(?:h2|h3|li|blockquote)>).+/gm, (line: string) => line.trim() ? `<p>${line}</p>` : '');
}

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export default function ArticleEditor({ postId }: { postId?: string }) {
  const router = useRouter();
  const isEdit = !!postId;
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [form, setForm] = useState<BlogPost>({
    title: "",
    summary: "",
    content: "",
    category: "Skincare",
    coverImage: "",
    author: "The Welfare",
    published: false,
    tags: [],
  });

  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (isEdit && postId) {
      fetch(`/api/blog/${postId}`)
        .then(r => r.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          setForm(data);
          setTagInput(data.tags?.join(", ") || "");
        })
        .catch((e) => setLoadError(e.message || "Impossible de charger l'article."));
    }
  }, [isEdit, postId]);

  const set = (field: keyof BlogPost, value: any) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async (publish?: boolean) => {
    if (!form.title.trim()) return alert("Le titre est obligatoire.");
    setSaving(true);
    try {
      const slug = form.slug || generateSlug(form.title);
      const tags = tagInput.split(",").map(t => t.trim()).filter(Boolean);
      const readingTime = Math.max(1, Math.ceil(form.content.split(" ").length / 200));
      const payload = { ...form, slug, tags, readingTime, published: publish !== undefined ? publish : form.published };

      const url = isEdit ? `/api/blog/${postId}` : `/api/blog`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/dashboard/blog");
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erreur lors de la sauvegarde.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      {/* Top Bar */}
      <div className="bg-white border-b border-[#EDE0E0] px-6 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/blog" className="flex items-center gap-2 text-sm text-[#2A2424]/50 hover:text-[#2A2424] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Articles
          </Link>
          <div className="w-px h-4 bg-[#EDE0E0]" />
          <h1 className="text-sm font-bold text-[#2A2424]">{isEdit ? "Modifier l'article" : "Nouvel article"}</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              preview ? "bg-[#2A2424] text-white" : "bg-[#F5F0EB] text-[#2A2424]/60 hover:text-[#2A2424]"
            }`}
          >
            {preview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {preview ? "Éditer" : "Prévisualiser"}
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#F5F0EB] text-[#2A2424]/60 hover:text-[#2A2424] transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            Brouillon
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#2A2424] text-white hover:bg-black transition-colors shadow-sm"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Rocket className="w-3.5 h-3.5" />
            )}
            Publier
          </button>
        </div>
      </div>

      {loadError && (
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
            {loadError}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Main Editor / Preview */}
        <div className="space-y-4">
          {/* Title */}
          <input
            type="text"
            placeholder="Titre de l'article..."
            value={form.title}
            onChange={e => set("title", e.target.value)}
            className="w-full text-4xl font-bold text-[#2A2424] bg-transparent border-none outline-none placeholder:text-[#2A2424]/20 leading-tight"
            style={{ letterSpacing: "-0.02em" }}
          />

          {/* Summary */}
          <textarea
            placeholder="Résumé de l'article (affiché sur la page listing)..."
            value={form.summary}
            onChange={e => set("summary", e.target.value)}
            rows={2}
            className="w-full text-lg text-[#2A2424]/60 bg-transparent border-none outline-none placeholder:text-[#2A2424]/20 resize-none leading-relaxed"
          />

          <div className="h-px bg-[#EDE0E0]" />

          {preview ? (
            /* Preview */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl p-8 border border-[#EDE0E0] min-h-[500px] prose prose-lg max-w-none"
            >
              {form.coverImage && (
                <img src={form.coverImage} alt="" className="w-full rounded-xl mb-8 object-cover max-h-72" />
              )}
              <div dangerouslySetInnerHTML={{ __html: markdownToHtml(form.content) }} />
            </motion.div>
          ) : (
            /* Markdown Editor */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl border border-[#EDE0E0] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#EDE0E0] bg-[#F5F0EB]/50">
                  <span className="text-xs font-mono text-[#2A2424]/40 font-semibold">Markdown</span>
                  <span className="ml-auto text-[10px] text-[#2A2424]/30 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.max(1, Math.ceil(form.content.split(" ").length / 200))} min de lecture estimé
                  </span>
                </div>
                <textarea
                  placeholder={`Commencez à écrire votre article en Markdown...\n\n## Introduction\n\nVotre contenu ici...\n\n## Conseils\n\n- Conseil 1\n- Conseil 2\n\n> Astuce importante ici`}
                  value={form.content}
                  onChange={e => set("content", e.target.value)}
                  className="w-full p-6 text-sm font-mono text-[#2A2424] bg-transparent outline-none resize-none leading-relaxed placeholder:text-[#2A2424]/20"
                  rows={24}
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-4">
          {/* Status */}
          <div className="bg-white border border-[#EDE0E0] rounded-2xl p-5">
            <h3 className="text-xs font-bold text-[#2A2424]/40 uppercase tracking-wider mb-3">Statut</h3>
            <button
              onClick={() => set("published", !form.published)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                form.published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              <span>{form.published ? "Publié" : "Brouillon"}</span>
              {form.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>

          {/* Category */}
          <div className="bg-white border border-[#EDE0E0] rounded-2xl p-5">
            <h3 className="text-xs font-bold text-[#2A2424]/40 uppercase tracking-wider mb-3">Catégorie</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => set("category", cat)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                    form.category === cat
                      ? "bg-[#2A2424] text-white"
                      : "bg-[#F5F0EB] text-[#2A2424]/60 hover:bg-[#F4EAEB] hover:text-[#2A2424]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Cover Image */}
          <div className="bg-white border border-[#EDE0E0] rounded-2xl p-5">
            <h3 className="text-xs font-bold text-[#2A2424]/40 uppercase tracking-wider mb-3">Image de couverture</h3>
            <input
              type="url"
              placeholder="https://..."
              value={form.coverImage}
              onChange={e => set("coverImage", e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-[#F5F0EB] border border-[#EDE0E0] rounded-xl text-[#2A2424] outline-none focus:ring-2 focus:ring-[#C08A8E]/30 placeholder:text-[#2A2424]/30"
            />
            {form.coverImage && (
              <img src={form.coverImage} alt="" className="mt-3 w-full h-28 object-cover rounded-xl" />
            )}
          </div>

          {/* Author */}
          <div className="bg-white border border-[#EDE0E0] rounded-2xl p-5">
            <h3 className="text-xs font-bold text-[#2A2424]/40 uppercase tracking-wider mb-3">Auteur</h3>
            <input
              type="text"
              value={form.author}
              onChange={e => set("author", e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-[#F5F0EB] border border-[#EDE0E0] rounded-xl text-[#2A2424] outline-none focus:ring-2 focus:ring-[#C08A8E]/30"
            />
          </div>

          {/* Tags */}
          <div className="bg-white border border-[#EDE0E0] rounded-2xl p-5">
            <h3 className="text-xs font-bold text-[#2A2424]/40 uppercase tracking-wider mb-3">Tags</h3>
            <input
              type="text"
              placeholder="soin, routine, vitamine C..."
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-[#F5F0EB] border border-[#EDE0E0] rounded-xl text-[#2A2424] outline-none focus:ring-2 focus:ring-[#C08A8E]/30 placeholder:text-[#2A2424]/30"
            />
            <p className="text-[10px] text-[#2A2424]/30 mt-1.5">Séparez les tags par des virgules</p>
          </div>

          {/* Slug */}
          <div className="bg-white border border-[#EDE0E0] rounded-2xl p-5">
            <h3 className="text-xs font-bold text-[#2A2424]/40 uppercase tracking-wider mb-3">URL Slug</h3>
            <input
              type="text"
              value={form.slug || generateSlug(form.title)}
              onChange={e => set("slug", e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-[#F5F0EB] border border-[#EDE0E0] rounded-xl text-[#2A2424] outline-none focus:ring-2 focus:ring-[#C08A8E]/30 font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
