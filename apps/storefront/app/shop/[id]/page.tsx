import { sdk } from "@/lib/medusa";
import CategoryClient, { CategoryProduct } from "./CategoryClient";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: category } = await params;

  let products: CategoryProduct[] = [];

  try {
    const { regions } = await sdk.store.region.list().catch(() => ({ regions: [] }));
    const regionId = regions?.[0]?.id;

    const queryParams: any = { limit: 100, fields: "+variants,*images,*categories" };
    if (regionId) {
      queryParams.region_id = regionId;
      queryParams.fields += ",*variants.prices,*variants.calculated_price";
    }

    const { products: fetchedProducts } = await sdk.store.product.list(
      queryParams,
      { next: { revalidate: 60 } } as any
    );

    // Map Medusa products to the format expected by CategoryClient
    products = fetchedProducts.map((p: any) => {
      // Get image
      const imageUrl = p.images && p.images.length > 0 ? p.images[0].url : p.thumbnail || "/products/1.png";
      
      // Get price
      const price = p.variants?.[0]?.calculated_price?.calculated_amount
        || p.variants?.[0]?.prices?.[0]?.amount
        || 15000;

      // Extract metadata (with fallbacks if undefined)
      // We expect metadata.skin_types to be an array of strings, etc.
      // If it's a string (e.g. from a simple text input), we try to parse or wrap it.
      const rawSkinTypes = p.metadata?.skin_types;
      const skin_types = Array.isArray(rawSkinTypes) ? rawSkinTypes : (rawSkinTypes ? [rawSkinTypes] : ["Toutes"]);

      const rawSkinConcerns = p.metadata?.skin_concerns;
      const skin_concerns = Array.isArray(rawSkinConcerns) ? rawSkinConcerns : (rawSkinConcerns ? [rawSkinConcerns] : []);

      const rawIngredients = p.metadata?.active_ingredients;
      let active_ingredients: { name: string }[] = [];
      if (Array.isArray(rawIngredients)) {
        active_ingredients = rawIngredients.map((i: any) => typeof i === "string" ? { name: i } : i);
      } else if (typeof rawIngredients === "string") {
        active_ingredients = [{ name: rawIngredients }];
      }

      return {
        id: p.id,
        title: p.title,
        category: p.categories?.[0]?.name || "PRODUIT",
        image: imageUrl,
        price_fcfa: price,
        skin_profile: {
          skin_types,
          skin_concerns,
        },
        active_ingredients,
      };
    });
  } catch (error) {
    console.error("Failed to fetch products for category:", error);
  }

  return <CategoryClient category={category} products={products} />;
}
