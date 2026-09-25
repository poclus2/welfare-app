import { sdk } from "@/lib/medusa";
import BrandsClient from "./BrandsClient";

export const revalidate = 3600;

export default async function BrandsPage() {
  let brands: { id: string; name: string; handle: string; productCount: number }[] = [];

  try {
    const result = await sdk.store.product.list(
      {
        limit: 1000,
        fields: "*collection",
      },
      { next: { revalidate: 3600 } } as any
    );

    const products = result.products || [];
    const brandMap = new Map<string, { name: string; handle: string; count: number }>();

    for (const product of products) {
      const col = (product as any).collection;
      if (col && col.title && col.handle) {
        const existing = brandMap.get(col.id);
        if (existing) {
          existing.count += 1;
        } else {
          brandMap.set(col.id, { name: col.title, handle: col.handle, count: 1 });
        }
      }
    }

    brands = Array.from(brandMap.entries())
      .map(([id, b]) => ({ id, name: b.name, handle: b.handle, productCount: b.count }))
      .sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
  } catch (error) {
    console.error("Failed to fetch brands:", error);
  }

  return <BrandsClient brands={brands} />;
}
