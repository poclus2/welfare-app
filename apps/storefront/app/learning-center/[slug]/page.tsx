import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar } from "@phosphor-icons/react/dist/ssr";

export const revalidate = 60;

async function getPost(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/blog/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getAllPosts() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/blog`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    year: "numeric", month: "long", day: "numeric",
  });
}

// Simple markdown to HTML converter
function renderMarkdown(content: string): string {
  return content
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-[#2A2424] mt-8 mb-3" style="letter-spacing:-0.01em">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-[#2A2424] mt-10 mb-4" style="letter-spacing:-0.02em">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-[#2A2424] mt-12 mb-5" style="letter-spacing:-0.02em">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-[#2A2424]">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-[#E5B6B9] pl-5 py-1 my-6 italic text-[#2A2424]/70 bg-[#F4EAEB]/30 rounded-r-xl">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li class="flex items-start gap-2 mb-2"><span class="w-1.5 h-1.5 rounded-full bg-[#E5B6B9] mt-2 shrink-0"></span><span>$1</span></li>')
    .replace(/(<li.*<\/li>\n?)+/g, (match) => `<ul class="space-y-1 my-4">${match}</ul>`)
    .replace(/^(?!<[hublip]).+$/gm, (line) => line.trim() ? `<p class="text-[#2A2424]/70 leading-relaxed mb-4">${line}</p>` : '')
    .replace(/\n\n+/g, '\n');
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, allPosts] = await Promise.all([getPost(slug), getAllPosts()]);
  if (!post) notFound();

  const related = allPosts
    .filter((p: any) => p.slug !== post.slug && p.category === post.category)
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-[#FDFDFC]">
      {/* Back */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-4">
        <Link href="/learning-center" className="inline-flex items-center gap-2 text-sm text-[#2A2424]/50 hover:text-[#2A2424] transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" weight="light" />
          Learning Center
        </Link>
      </div>

      {/* Header */}
      <header className="max-w-4xl mx-auto px-4 sm:px-6 pb-10">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#C08A8E] bg-[#F4EAEB] px-3 py-1 rounded-full mb-5">
          {post.category}
        </span>
        <h1 className="text-4xl md:text-6xl font-bold text-[#2A2424] leading-tight mb-6" style={{ letterSpacing: "-0.03em" }}>
          {post.title}
        </h1>
        {post.summary && (
          <p className="text-xl text-[#2A2424]/60 leading-relaxed mb-8">{post.summary}</p>
        )}
        <div className="flex flex-wrap items-center gap-5 text-sm text-[#2A2424]/40 border-t border-b border-[#F4EAEB] py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#F4EAEB] flex items-center justify-center">
              <span className="text-xs font-bold text-[#C08A8E]">{post.author[0]}</span>
            </div>
            <span className="font-medium text-[#2A2424]/70">{post.author}</span>
          </div>
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" weight="light" /> {formatDate(post.createdAt)}</span>
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" weight="light" /> {post.readingTime} min de lecture</span>
        </div>
      </header>

      {/* Cover Image */}
      {post.coverImage && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-12">
          <div className="rounded-3xl overflow-hidden aspect-video">
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-[#F4EAEB]">
            {post.tags.map((tag: string) => (
              <span key={tag} className="text-xs font-medium px-3 py-1.5 bg-[#F4EAEB] text-[#C08A8E] rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-[#2A2424] mb-8" style={{ letterSpacing: "-0.02em" }}>Articles similaires</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((rel: any) => (
                <Link key={rel.id} href={`/learning-center/${rel.slug}`} className="group block bg-white border border-[#F4EAEB] rounded-2xl overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
                  {rel.coverImage && (
                    <div className="h-36 overflow-hidden">
                      <img src={rel.coverImage} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="font-semibold text-sm text-[#2A2424] line-clamp-2 group-hover:text-[#C08A8E] transition-colors">{rel.title}</p>
                    <p className="text-xs text-[#2A2424]/40 mt-2 flex items-center gap-1"><Clock className="w-3 h-3" weight="light" /> {rel.readingTime} min</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}
