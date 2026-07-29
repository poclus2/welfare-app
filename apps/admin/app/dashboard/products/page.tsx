import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { Package, CheckCircle2, AlertTriangle, AlertOctagon, Plus, Search, ChevronRight, ChevronLeft } from "lucide-react";
import { fetchAdmin } from "@/lib/medusa-admin";

export const dynamic = "force-dynamic";

function formatPrice(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(amount);
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) return null; // Middleware should catch this anyway

  const q = typeof resolvedParams.q === "string" ? resolvedParams.q : "";
  const offset = typeof resolvedParams.offset === "string" ? parseInt(resolvedParams.offset, 10) : 0;
  const limit = 20;

  // Build query string
  const query = new URLSearchParams({
    offset: offset.toString(),
    limit: limit.toString(),
    expand: "variants,collection,options",
  });
  if (q) query.set("q", q);

  // Fetch products
  const data = await fetchAdmin<{ products: any[]; count: number; offset: number; limit: number }>(
    `/products?${query.toString()}`,
    token
  ).catch(() => ({ products: [], count: 0, offset: 0, limit: 20 }));

  // For KPIs, we ideally need aggregate data, but for now we'll do a basic estimate or fetch all counts if needed.
  // Medusa doesn't have a single /products/metrics endpoint, so we can do some lightweight counts.
  const allProductsData = await fetchAdmin<{ count: number }>(`/products?limit=1`, token).catch(() => ({ count: 0 }));
  const activeProductsData = await fetchAdmin<{ count: number }>(`/products?status=published&limit=1`, token).catch(() => ({ count: 0 }));
  
  // We don't have a direct query for "out of stock" at the product level easily in Medusa API without fetching all variants.
  // We'll use mock values or compute based on the current page for now.
  const kpis = {
    total: allProductsData.count,
    active: activeProductsData.count,
    outOfStock: 12, // Placeholder
    lowStock: 24, // Placeholder
  };

  const totalPages = Math.ceil(data.count / limit);
  const currentPage = Math.floor(offset / limit) + 1;

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
        <KpiCard label="Total Produits" value={kpis.total.toString()} icon={Package} color="text-blue-500" bg="bg-blue-50" />
        <KpiCard label="Actifs (Publiés)" value={kpis.active.toString()} icon={CheckCircle2} color="text-emerald-500" bg="bg-emerald-50" />
        <KpiCard label="Rupture de stock" value={kpis.outOfStock.toString()} icon={AlertOctagon} color="text-red-500" bg="bg-red-50" />
        <KpiCard label="Stock faible" value={kpis.lowStock.toString()} icon={AlertTriangle} color="text-amber-500" bg="bg-amber-50" />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-[#EDE0E0] p-4 flex flex-col sm:flex-row gap-3 shadow-sm">
        {/* Search Form - Submits to the URL to update searchParams */}
        <form className="flex-1" method="GET" action="/dashboard/products">
          <div className="flex items-center gap-2 bg-[#F5F0EB] border border-[#EDE0E0] rounded-xl px-3 py-2.5">
            <Search className="w-4 h-4 text-[#2A2424]/30 shrink-0" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Rechercher par nom, marque..."
              className="flex-1 text-sm text-[#2A2424] bg-transparent outline-none placeholder:text-[#2A2424]/30"
            />
            {q && (
              <Link href="/dashboard/products" className="text-[#2A2424]/30 hover:text-[#2A2424]">
                &times;
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#EDE0E0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5F0EB] border-b border-[#EDE0E0]">
                {["Produit", "Collection", "Statut", "Inventaire", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-[#2A2424]/40 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.products.map((product) => {
                // Calculate total inventory across all variants
                const totalInventory = product.variants?.reduce((acc: number, v: any) => acc + (v.inventory_quantity || 0), 0) || 0;
                // Get lowest price across variants
                const lowestPrice = product.variants?.reduce((min: number, v: any) => {
                  const frPrice = v.prices?.find((p: any) => p.currency_code === "xof" || p.currency_code === "eur"); // Adjust currency as needed
                  const price = frPrice ? frPrice.amount : 0;
                  return price > 0 && (price < min || min === 0) ? price : min;
                }, 0);

                return (
                  <tr key={product.id} className="border-b border-[#EDE0E0] hover:bg-[#F5F0EB]/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        {product.thumbnail ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#EDE0E0] shrink-0 bg-[#F5F0EB] relative">
                            <Image src={product.thumbnail} alt={product.title} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-[#EDE0E0] bg-[#F5F0EB] flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-[#2A2424]/20" />
                          </div>
                        )}
                        <div className="min-w-0 max-w-[250px]">
                          <p className="text-sm font-bold text-[#2A2424] truncate">{product.title}</p>
                          <p className="text-[10px] text-[#2A2424]/50 truncate">{product.subtitle || product.handle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-medium text-[#2A2424]/80">
                        {product.collection?.title || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                        product.status === "published" 
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                          : "bg-gray-100 text-gray-500 border border-gray-200"
                      }`}>
                        {product.status === "published" ? "Publié" : "Brouillon"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className={`text-xs font-bold ${
                        totalInventory === 0 ? "text-red-500" : totalInventory < 10 ? "text-amber-500" : "text-[#2A2424]"
                      }`}>
                        {totalInventory} en stock
                      </p>
                      <p className="text-[10px] text-[#2A2424]/40">{product.variants?.length || 0} variante(s)</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/dashboard/products/${product.id}`}
                        className="text-[11px] font-semibold text-[#C08A8E] hover:text-[#2A2424] transition-colors"
                      >
                        Éditer
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data.products.length === 0 && (
            <div className="text-center py-12 text-sm text-[#2A2424]/30">Aucun produit trouvé</div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#EDE0E0]">
            <p className="text-xs text-[#2A2424]/50">
              Affichage {offset + 1} - {Math.min(offset + limit, data.count)} sur {data.count}
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/products?offset=${Math.max(0, offset - limit)}${q ? `&q=${q}` : ''}`}
                className={`p-1.5 rounded-lg border border-[#EDE0E0] ${currentPage === 1 ? "opacity-50 pointer-events-none" : "hover:bg-[#F5F0EB]"}`}
              >
                <ChevronLeft className="w-4 h-4 text-[#2A2424]" />
              </Link>
              <span className="text-xs font-medium text-[#2A2424] px-2">{currentPage} / {totalPages}</span>
              <Link
                href={`/dashboard/products?offset=${offset + limit}${q ? `&q=${q}` : ''}`}
                className={`p-1.5 rounded-lg border border-[#EDE0E0] ${currentPage >= totalPages ? "opacity-50 pointer-events-none" : "hover:bg-[#F5F0EB]"}`}
              >
                <ChevronRight className="w-4 h-4 text-[#2A2424]" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color, bg }: { label: string, value: string, icon: any, color: string, bg: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#EDE0E0] shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-[#2A2424] mb-0.5">{value}</p>
        <p className="text-xs text-[#2A2424]/50">{label}</p>
      </div>
    </div>
  );
}
