import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { Package, Plus, ChevronRight, ChevronLeft, Pencil } from "lucide-react";
import { fetchAdmin } from "@/lib/medusa-admin";
import { ProductSearch } from "@/components/products/ProductSearch";
import { ProductFilters } from "@/components/products/ProductFilters";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) return null;

  const q = typeof resolvedParams.q === "string" ? resolvedParams.q : "";
  const order = typeof resolvedParams.order === "string" ? resolvedParams.order : "-created_at";
  const status = typeof resolvedParams.status === "string" ? resolvedParams.status : "";
  const offset = typeof resolvedParams.offset === "string" ? parseInt(resolvedParams.offset, 10) : 0;
  const limit = 24;

  const isCustomStockFilter = status === "negative_stock" || status === "low_stock";

  const query = new URLSearchParams({
    offset: isCustomStockFilter ? "0" : offset.toString(),
    limit: isCustomStockFilter ? "2000" : limit.toString(),
    expand: "variants,collection,options",
    order: order,
  });
  if (q) query.set("q", q);
  if (status && status !== "all" && !isCustomStockFilter) {
    query.set("status", status);
  }

  let data = await fetchAdmin<{ products: any[]; count: number; offset: number; limit: number }>(
    `/products?${query.toString()}`,
    token
  ).catch(() => ({ products: [], count: 0, offset: 0, limit: 24 }));

  if (isCustomStockFilter) {
    // Manually filter products based on stock
    const filteredProducts = data.products.filter(p => {
      const inv = p.variants?.reduce((acc: number, v: any) => acc + (v.inventory_quantity || v.metadata?.stock_total || 0), 0) || 0;
      if (status === "negative_stock") return inv < 0;
      if (status === "low_stock") return inv >= 0 && inv < 10;
      return true;
    });

    data = {
      ...data,
      count: filteredProducts.length,
      products: filteredProducts.slice(offset, offset + limit),
      offset,
      limit,
    };
  }

  const allProductsData = await fetchAdmin<{ count: number }>(`/products?limit=1`, token).catch(() => ({ count: 0 }));
  const activeProductsData = await fetchAdmin<{ count: number }>(`/products?status=published&limit=1`, token).catch(() => ({ count: 0 }));
  const draftProductsData = await fetchAdmin<{ count: number }>(`/products?status=draft&limit=1`, token).catch(() => ({ count: 0 }));

  // Compute low stock from fetched products (inventory < 10 but > 0)
  const lowStockCount = data.products.filter(p => {
    const inv = p.variants?.reduce((acc: number, v: any) => acc + (v.inventory_quantity || v.metadata?.stock_total || 0), 0) || 0;
    return inv > 0 && inv < 10;
  }).length;

  const kpis = {
    total: allProductsData.count,
    active: activeProductsData.count,
    draft: draftProductsData.count,
    lowStock: lowStockCount,
  };

  const totalPages = Math.ceil(data.count / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  // Mini bar chart data (simulated trend from count)
  const bars = [3, 5, 4, 6, 5, 7, 6];

  return (
    <div className="p-5 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2A2424]" style={{ letterSpacing: "-0.02em" }}>Produits</h1>
          <p className="text-sm text-[#2A2424]/40 mt-0.5">Gérez votre catalogue de cosmétiques</p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2A2424] text-white rounded-xl text-sm font-bold hover:bg-black transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouveau Produit
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Produits"
          value={kpis.total}
          badge={{ text: `+${kpis.active} publiés`, color: "bg-emerald-100 text-emerald-700" }}
          note="Dans votre catalogue"
          bars={[4, 6, 5, 7, 6, 8, 7]}
          barColor="#C08A8E"
        />
        <KpiCard
          label="Produits Publiés"
          value={kpis.active}
          badge={{ text: `${Math.round((kpis.active / Math.max(kpis.total, 1)) * 100)}%`, color: "bg-blue-100 text-blue-700" }}
          note="Visibles sur la boutique"
          bars={[2, 4, 3, 5, 4, 6, 5]}
          barColor="#3b82f6"
        />
        <KpiCard
          label="Brouillons"
          value={kpis.draft}
          badge={{ text: "En attente", color: "bg-amber-100 text-amber-700" }}
          note="À publier"
          bars={[5, 3, 6, 4, 5, 3, 4]}
          barColor="#f59e0b"
        />
        <KpiCard
          label="Stock Faible"
          value={kpis.lowStock}
          badge={{ text: "< 10 unités", color: "bg-red-100 text-red-600" }}
          note="Sur cette page"
          bars={[3, 5, 4, 6, 3, 5, 4]}
          barColor="#ef4444"
        />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-[#EDE0E0] p-4 flex flex-col xl:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <ProductSearch initialQuery={q} />
          <ProductFilters />
        </div>
        <p className="text-xs text-[#2A2424]/40 whitespace-nowrap font-medium">
          {data.count} produit{data.count > 1 ? "s" : ""}
        </p>
      </div>

      {/* Product Cards Grid */}
      {data.products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EDE0E0] py-16 text-center text-sm text-[#2A2424]/30 shadow-sm">
          Aucun produit trouvé
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {data.products.map((product) => {
            const lowestPrice = product.variants?.reduce((min: number, v: any) => {
              const p = v.prices?.find((px: any) => px.currency_code === "xof" || px.currency_code === "eur");
              // XOF prices are stored as full integers (e.g. 15000), not in cents
              const amt = p ? p.amount : 0;
              return amt > 0 && (amt < min || min === 0) ? amt : min;
            }, 0);
            const totalInventory = product.variants?.reduce((acc: number, v: any) => acc + (v.inventory_quantity || v.metadata?.stock_total || 0), 0) || 0;
            const isPublished = product.status === "published";

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-[#EDE0E0] overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col group"
              >
                {/* Image area */}
                <div className="relative aspect-[3/4] bg-gradient-to-br from-[#F5F0EB] to-[#EDE0E0] overflow-hidden">
                  {product.thumbnail ? (
                    <Image
                      src={product.thumbnail}
                      alt={product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <Package className="w-8 h-8 text-[#2A2424]/15" />
                      <span className="text-[10px] text-[#2A2424]/20 font-medium">Pas d'image</span>
                    </div>
                  )}

                  {/* Edit button on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Link
                      href={`/dashboard/products/${product.id}`}
                      className="flex items-center gap-1.5 bg-white text-[#2A2424] text-xs font-bold px-3 py-1.5 rounded-full shadow-lg hover:bg-[#2A2424] hover:text-white transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      Éditer
                    </Link>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 flex flex-col gap-2 flex-1">
                  {/* Status badge */}
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isPublished
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-amber-50 text-amber-600 border border-amber-200"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? "bg-emerald-500" : "bg-amber-400"}`} />
                      {isPublished ? "Publié" : "Brouillon"}
                    </span>
                  </div>

                  {/* Title */}
                  <p className="text-xs font-bold text-[#2A2424] leading-tight line-clamp-2 flex-1">
                    {product.title}
                  </p>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-1 pt-1 border-t border-[#EDE0E0]">
                    <div>
                      <p className="text-[9px] text-[#2A2424]/40 uppercase tracking-wide font-semibold">Prix</p>
                      <p className="text-[11px] font-bold text-[#2A2424]">
                        {lowestPrice > 0
                          ? new Intl.NumberFormat("fr-FR").format(lowestPrice) + " F"
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-[#2A2424]/40 uppercase tracking-wide font-semibold">Stock</p>
                      <p className={`text-[11px] font-bold ${totalInventory === 0 ? "text-red-500" : totalInventory < 10 ? "text-amber-500" : "text-[#2A2424]"}`}>
                        {totalInventory}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-[#2A2424]/40 uppercase tracking-wide font-semibold">Var.</p>
                      <p className="text-[11px] font-bold text-[#2A2424]">{product.variants?.length || 0}</p>
                    </div>
                  </div>

                  {/* Edit button below */}
                  <Link
                    href={`/dashboard/products/${product.id}`}
                    className="mt-1 w-full text-center text-[11px] font-bold py-1.5 rounded-lg border border-[#EDE0E0] text-[#2A2424]/60 hover:bg-[#2A2424] hover:text-white hover:border-[#2A2424] transition-all duration-150"
                  >
                    Éditer
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl border border-[#EDE0E0] flex items-center justify-between px-6 py-4 shadow-sm">
          <p className="text-xs text-[#2A2424]/50">
            {offset + 1}–{Math.min(offset + limit, data.count)} sur {data.count} produits
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/products?offset=${Math.max(0, offset - limit)}${q ? `&q=${q}` : ''}${order ? `&order=${order}` : ''}${status && status !== 'all' ? `&status=${status}` : ''}`}
              className={`p-1.5 rounded-lg border border-[#EDE0E0] transition-colors ${currentPage === 1 ? "opacity-40 pointer-events-none" : "hover:bg-[#F5F0EB]"}`}
            >
              <ChevronLeft className="w-4 h-4 text-[#2A2424]" />
            </Link>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
              if (page > totalPages) return null;
              return (
                <Link
                  key={page}
                  href={`/dashboard/products?offset=${(page - 1) * limit}${q ? `&q=${q}` : ''}${order ? `&order=${order}` : ''}${status && status !== 'all' ? `&status=${status}` : ''}`}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                    page === currentPage
                      ? "bg-[#2A2424] text-white"
                      : "border border-[#EDE0E0] text-[#2A2424]/60 hover:bg-[#F5F0EB]"
                  }`}
                >
                  {page}
                </Link>
              );
            })}
            <Link
              href={`/dashboard/products?offset=${offset + limit}${q ? `&q=${q}` : ''}${order ? `&order=${order}` : ''}${status && status !== 'all' ? `&status=${status}` : ''}`}
              className={`p-1.5 rounded-lg border border-[#EDE0E0] transition-colors ${currentPage >= totalPages ? "opacity-40 pointer-events-none" : "hover:bg-[#F5F0EB]"}`}
            >
              <ChevronRight className="w-4 h-4 text-[#2A2424]" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label, value, badge, note, bars, barColor
}: {
  label: string;
  value: number;
  badge: { text: string; color: string };
  note: string;
  bars: number[];
  barColor: string;
}) {
  const max = Math.max(...bars);
  return (
    <div className="bg-white rounded-2xl border border-[#EDE0E0] p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-semibold text-[#2A2424]">{label}</p>
        <button className="text-[#2A2424]/20 hover:text-[#2A2424]/50 transition-colors">
          <span className="text-lg leading-none">···</span>
        </button>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-extrabold text-[#2A2424]" style={{ letterSpacing: "-0.04em" }}>
              {value.toLocaleString("fr-FR")}
            </p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>
              {badge.text}
            </span>
          </div>
          <p className="text-xs text-[#2A2424]/40 mt-1">{note}</p>
        </div>
        {/* Mini bar chart */}
        <div className="flex items-end gap-[3px] h-10 shrink-0">
          {bars.map((h, i) => (
            <div
              key={i}
              className="w-2 rounded-sm opacity-80"
              style={{
                height: `${(h / max) * 100}%`,
                backgroundColor: i === bars.length - 1 ? barColor : "#2A2424",
                opacity: i === bars.length - 1 ? 1 : 0.15 + (i / bars.length) * 0.5,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
