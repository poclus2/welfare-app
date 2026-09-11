import { sdk } from "@/lib/medusa";
import ShopClient from "./ShopClient";

// Server Component for fetching real data from Medusa
export default async function ShopPage() {
  let products: any[] = [];
  try {
    const { regions } = await sdk.store.region.list().catch(() => ({ regions: [] }));
    const regionId = regions?.[0]?.id;

    const queryParams: any = { limit: 100, fields: "+variants,*images,*categories,*metadata" };
    if (regionId) {
      queryParams.region_id = regionId;
      queryParams.fields += ",*variants.prices,*variants.calculated_price";
    }

    const { products: fetchedProducts } = await sdk.store.product.list(
      queryParams,
      { next: { revalidate: 60 } } as any
    );
    products = fetchedProducts;
  } catch (error) {
    console.error("Failed to fetch products from Medusa:", error);
  }

  // Map to the expected format
  const mappedProducts = products.map((p: any) => {
    // Determine image: use the first image (should be transparent background from previous step)
    const imageUrl = p.images && p.images.length > 0 ? p.images[0].url : p.thumbnail || "/products/1.webp";
    // calculated_price requires a region context — read prices[0].amount directly instead
    const price = p.variants?.[0]?.calculated_price?.calculated_amount
      || p.variants?.[0]?.prices?.[0]?.amount
      || 15000;
    
    return {
      id: p.id,
      name: p.collection?.title ? `${p.collection.title} - ${p.title}` : p.title,
      brand: p.collection?.title || "Welfare", // default fallback
      price: price,
      oldPrice: null,
      rating: 4.8, // Mocked for now until reviews are implemented
      reviews: 120, // Mocked for now
      image: imageUrl,
      badge: null,
      label: p.categories?.[0]?.name || "PRODUIT",
      metadata: p.metadata,
    };
  });

  // If Medusa is empty or failed, fallback to some mock data array length
  const finalProducts = mappedProducts.length >= 8 ? mappedProducts : [...mappedProducts, ...Array(8 - mappedProducts.length).fill({})].map((x, i) => ({
    id: x.id || `mock-${i}`,
    name: x.name || `Mock Product ${i}`,
    brand: x.brand || "Welfare",
    price: x.price || 15000,
    oldPrice: null,
    rating: 5,
    reviews: 10,
    image: x.image || `/products/${(i % 4) + 1}.webp`,
    badge: null,
    label: x.label || "SOIN",
    metadata: x.metadata || {},
  }));

  
  let flashProducts = finalProducts.filter(p => p.metadata?.is_flash_sale === true);
  let bestProducts = finalProducts.filter(p => p.metadata?.is_bestseller === true);
  let sunProducts = finalProducts.filter(p => p.label === "Solaires" || p.name.toLowerCase().includes("sun") || p.name.toLowerCase().includes("solaire") || p.name.toLowerCase().includes("uv"));

  // Fallback to random slice if none configured yet
  if (flashProducts.length === 0) flashProducts = finalProducts.slice(0, 4);
  if (bestProducts.length === 0) bestProducts = finalProducts.slice(4, 8);
  if (sunProducts.length === 0) sunProducts = finalProducts.slice(0, 8);

  return <ShopClient flashProducts={flashProducts} bestProducts={bestProducts} sunProducts={sunProducts} />;
}
