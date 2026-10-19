import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { advisorApi, type AdvisorScan } from "@/lib/advisor-api";
import { SK } from "@/components/ui/skin-coach/theme";
import { AdvisorHeader } from "@/components/advisor/advisor-header";
import { AdvisorScanView, type ProductCard } from "@/components/advisor/advisor-scan-view";

export const dynamic = "force-dynamic";

const API_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

// the products of the routine (and of the reviewed one), as the customer sees them
async function productCards(ids: string[]): Promise<Record<string, ProductCard>> {
  const entries = await Promise.all(
    ids.map(async (id): Promise<[string, ProductCard] | null> => {
      try {
        const res = await fetch(`${API_URL}/store/products/${id}?fields=*variants,*variants.prices,*collection`, {
          headers: { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "" },
          next: { revalidate: 300 },
        });
        const p = res.ok ? (await res.json())?.product : null;
        if (!p) return null;
        const price = p.variants?.[0]?.prices?.[0];
        return [id, {
          title: p.title,
          brand: p.collection?.title,
          thumbnail: p.thumbnail || p.images?.[0]?.url,
          handle: p.handle,
          amount: price?.amount != null ? Number(price.amount) : undefined,
          currency: price?.currency_code || "XAF",
        }];
      } catch {
        return null;
      }
    })
  );
  return Object.fromEntries(entries.filter((e): e is [string, ProductCard] => !!e));
}

export default async function AdvisorScanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, res] = await Promise.all([
    advisorApi<{ advisor: { name: string } }>("/advisor/me"),
    advisorApi<{ skin_scan: AdvisorScan }>(`/advisor/skin-scans/${encodeURIComponent(id)}`),
  ]);
  if (me.status === 401 || res.status === 401) redirect(`/conseillere/login?next=${encodeURIComponent(`/conseillere/scans/${id}`)}`);

  const scan = res.data?.skin_scan;
  if (!scan) {
    return (
      <div className="max-w-2xl mx-auto px-4 pb-16">
        <AdvisorHeader name={me.data?.advisor.name || ""} />
        <div className="rounded-[26px] p-6 text-center" style={{ background: SK.surface, border: `1px solid ${SK.lineSoft}` }}>
          <p className="text-[16px] font-bold mb-1">Diagnostic introuvable</p>
          <p className="text-[14px] mb-4" style={{ color: SK.muted }}>
            Ce numéro n&apos;existe pas ou ce diagnostic est confié à une autre conseillère. Demandez à la boutique de vous le confier.
          </p>
          <Link href="/conseillere" className="text-[14px] font-bold" style={{ color: SK.accent }}>Voir mes diagnostics</Link>
        </div>
      </div>
    );
  }

  const ids = [...new Set([...(scan.routine || []), ...(scan.reviewed_routine || [])].map((s: any) => s?.medusa_product_id).filter(Boolean))] as string[];
  const products = await productCards(ids);

  return (
    <div className="max-w-2xl mx-auto px-4 pb-16">
      <AdvisorHeader name={me.data?.advisor.name || ""} />
      <Link href="/conseillere" className="inline-flex items-center gap-1.5 text-[13px] font-bold mb-3" style={{ color: SK.muted }}>
        <ArrowLeft className="w-4 h-4" /> Mes diagnostics
      </Link>
      <AdvisorScanView scan={scan} products={products} />
    </div>
  );
}
