import { sdk } from "@/lib/medusa";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { Footer } from "@/components/home/footer";
import { ProductDetailClient } from "./ProductDetailClient";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let product = null;
  let recommendedProducts: any[] = [];
  try {
    const { regions } = await sdk.store.region.list().catch(() => ({ regions: [] }));
    const regionId = regions?.[0]?.id;

    const queryParams: any = { fields: "+metadata,+variants,+variants.metadata,+variants.inventory_quantity,*images,*categories,*collection" };
    if (regionId) {
      queryParams.region_id = regionId;
      queryParams.fields += ",*variants.prices,*variants.calculated_price";
    }

    const response = await sdk.store.product.retrieve(id, queryParams);
    product = response.product;

    const categoryId = product?.categories?.[0]?.id;
    const collectionId = product?.collection_id || product?.collection?.id;
    
    const recommendedParams: any = {
      limit: 8,
      fields: queryParams.fields,
      region_id: regionId
    };

    let recommendedRes: any = { products: [] };
    
    // 1. Try category
    if (categoryId) {
      recommendedParams.category_id = [categoryId];
      recommendedRes = await sdk.store.product.list(
        recommendedParams,
        { next: { revalidate: 60 } } as any
      ).catch(() => ({ products: [] }));
      
      // Filter out current product
      recommendedRes.products = (recommendedRes.products || []).filter((p: any) => p.id !== id);
    }
    
    // 2. Try collection if category didn't yield enough
    if ((!recommendedRes.products || recommendedRes.products.length < 3) && collectionId) {
      delete recommendedParams.category_id;
      recommendedParams.collection_id = [collectionId];
      const collectionRes = await sdk.store.product.list(
        recommendedParams,
        { next: { revalidate: 60 } } as any
      ).catch(() => ({ products: [] }));
      
      const newProducts = (collectionRes.products || []).filter((p: any) => p.id !== id);
      recommendedRes.products = Array.from(new Map([...recommendedRes.products, ...newProducts].map(item => [item.id, item])).values());
    }

    // 3. Fallback to all products if still not enough
    if (!recommendedRes.products || recommendedRes.products.length < 3) {
      delete recommendedParams.category_id;
      delete recommendedParams.collection_id;
      const fallbackRes = await sdk.store.product.list(
        recommendedParams,
        { next: { revalidate: 60 } } as any
      ).catch(() => ({ products: [] }));
      
      const newProducts = (fallbackRes.products || []).filter((p: any) => p.id !== id);
      recommendedRes.products = Array.from(new Map([...recommendedRes.products, ...newProducts].map(item => [item.id, item])).values());
    }
    
    // Take up to 4
    recommendedProducts = recommendedRes.products.slice(0, 4);

  } catch (error) {
    console.error("Failed to fetch product:", error);
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-[#F8F5F2] flex flex-col items-center justify-center p-6 gap-6">
        <div className="w-20 h-20 rounded-full bg-[#F4EAEB] flex items-center justify-center">
          <ArrowLeft className="w-8 h-8 text-[#2A2424]/30" />
        </div>
        <h1 className="text-2xl font-bold text-[#2A2424]">Produit introuvable</h1>
        <p className="text-[#2A2424]/60 text-sm text-center max-w-xs">
          Ce produit n&apos;existe pas ou n&apos;est plus disponible dans notre boutique.
        </p>
        <Link
          href="/shop"
          className="flex items-center gap-2 px-6 py-3 bg-[#2A2424] text-white rounded-full text-sm font-semibold hover:bg-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la boutique
        </Link>
      </main>
    );
  }

  return <ProductDetailClient product={product as any} recommendedProducts={recommendedProducts} />;
}
