import { sdk } from "@/lib/medusa";
import CategoryClient, { CategoryProduct } from "./CategoryClient";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id: category } = await params;
  const resolvedSearchParams = await searchParams;
  const q = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : undefined;
  const collection_id = typeof resolvedSearchParams.collection_id === "string" ? resolvedSearchParams.collection_id : undefined;

  let products: CategoryProduct[] = [];

  try {
    const { regions } = await sdk.store.region.list().catch(() => ({ regions: [] }));
    const regionId = regions?.[0]?.id;

    // Fetch products. If category is "cheveux", use text search since there is no Medusa category
    const queryParams: any = {
      limit: 1000,
      fields: "+variants,*images,*categories,*collection",
    };
    
    const categoryMap: Record<string, string> = {
      "serums": "sérums",
      "cremes": "crèmes",
      "masques-en-tissu": "masques",
    };
    
    const searchMap: Record<string, string> = {
      "cheveux": "cheveux",
      "hydratants": "hydratant",
      "soins-contour-des-yeux": "yeux",
      "yeux": "yeux"
    };

    if (q) {
      queryParams.q = q;
    } 
    if (collection_id) {
      queryParams.collection_id = [collection_id];
    }
    
    if (!q && !collection_id && searchMap[category]) {
      queryParams.q = searchMap[category];
    } else if (!collection_id && category !== "all") {
      const handle = categoryMap[category] || category;
      try {
        const catRes = await sdk.store.category.list({ handle }, { next: { revalidate: 60 } } as any);
        if (catRes && catRes.product_categories && catRes.product_categories.length > 0) {
          queryParams.category_id = [catRes.product_categories[0]!.id as string];
        } else {
          console.log(`Category handle '${handle}' not found via Store API.`);
          // If category not found, we can still fallback below, or pass an empty array to return 0 products
        }
      } catch (err) {
        console.error("Failed to fetch category by handle:", err);
      }
    }
    
    if (regionId) {
      queryParams.region_id = regionId;
      queryParams.fields += ",*variants.prices,*variants.calculated_price";
    }

    let fetchedProducts: any[] = [];
    try {
      const result = await sdk.store.product.list(
        queryParams,
        { next: { revalidate: 60 } } as any
      );
      fetchedProducts = result.products || [];
    } catch {
      // Fallback: if category_handle filter fails, fetch without it (limited)
      const fallbackParams: any = {
        limit: 1000,
        fields: "+variants,*images,*categories,*collection",
      };
      if (regionId) {
        fallbackParams.region_id = regionId;
        fallbackParams.fields += ",*variants.prices,*variants.calculated_price";
      }
      const fallback = await sdk.store.product.list(
        fallbackParams,
        { next: { revalidate: 60 } } as any
      ).catch(() => ({ products: [] }));
      fetchedProducts = fallback.products || [];
    }

    // Map Medusa products to the format expected by CategoryClient
    products = (fetchedProducts || []).map((p: any) => {
      // Get image
      const imageUrl = p.images && p.images.length > 0 ? p.images[0].url : p.thumbnail || "/products/1.webp";
      
      // Get price
      const price = p.variants?.[0]?.calculated_price?.calculated_amount
        || p.variants?.[0]?.prices?.[0]?.amount
        || 15000;

      const variantId = p.variants?.[0]?.id || "";

      // Extract metadata
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

      const categories = (p.categories || []).map((c: any) => c.name || c.handle || "");

      return {
        id: p.id,
        title: p.title,
        category: p.categories?.[0]?.name || "Soin",
        categories,
        image: imageUrl,
        price_fcfa: price,
        variantId,
        skin_profile: {
          skin_types,
          skin_concerns,
        },
        active_ingredients,
        brand: p.collection?.title || "",
      };
    });
  } catch (error) {
    console.error("Failed to fetch products for category:", error);
  }

  return <CategoryClient category={category} products={products} />;
}
