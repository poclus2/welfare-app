import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";
import PromotionsClient, { PromoCode } from "./PromotionsClient";

export const dynamic = "force-dynamic";

export default async function PromotionsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) return null;

  const [promoData, collectionsData, productsData, regionsData] = await Promise.all([
    fetchAdmin<{ promo_codes: PromoCode[] }>(`/promo-codes`, token).catch(() => ({ promo_codes: [] })),
    fetchAdmin<{ collections: any[] }>(`/collections?limit=1000&fields=id,title`, token).catch(() => ({ collections: [] })),
    fetchAdmin<{ products: any[] }>(`/products?limit=1000&fields=id,title`, token).catch(() => ({ products: [] })),
    fetchAdmin<{ regions: any[] }>(`/regions?limit=1&fields=currency_code`, token).catch(() => ({ regions: [] })),
  ]);

  const currencyCode: string = regionsData.regions[0]?.currency_code || "xaf";

  return (
    <PromotionsClient
      promoCodes={promoData.promo_codes}
      collections={collectionsData.collections.map((c) => ({ id: c.id, title: c.title }))}
      products={productsData.products.map((p) => ({ id: p.id, title: p.title }))}
      currencyCode={currencyCode}
    />
  );
}
