import CategoryClient, { CategoryProduct } from "./CategoryClient";
import { matchesCategory, matchesQuery, productDomain } from "@/lib/shop-filters";

// Category pages (/shop/all, /shop/serums...) read the slim catalogue served by the API
// (GET /store/shop-catalog: cached, ~250 KB, already carries the filter facets) instead of
// pulling every product with images, variants and prices (17-45 s, 4.7 MB).

// Pages with no Medusa category of their own. "cheveux" is matched by category name / title (see
// matchesCategory); the two below used to come out empty (linked from the home page) and are now
// built from the Medusa categories they really are.
const NO_MEDUSA_CATEGORY = new Set(["cheveux", "hydratants", "soins-contour-des-yeux", "yeux", "masques-visage", "soins-levres", "foot-care"]);
const GROUPED_BY_HANDLE: Record<string, { handles: string[]; title?: RegExp }> = {
  hydratants: { handles: ["moisturizer-/-cream", "crèmes"] },
  "soins-contour-des-yeux": { handles: ["eye-cream"], title: /yeux|\beye\b|contour/i },
  yeux: { handles: ["eye-cream"], title: /yeux|\beye\b|contour/i },
  // menu entries that gather several Medusa categories
  "masques-visage": { handles: ["sheet-mask", "wash-off-mask", "sleeping-mask"] },
  "soins-levres": { handles: ["lip-care"] },
  "foot-care": { handles: ["foot-cream", "foot-peeling"] },
};

// Slugs whose Medusa category handle differs
const CATEGORY_HANDLE_MAP: Record<string, string> = {
  serums: "sérums",
  cremes: "crèmes",
  "masques-en-tissu": "masques",
};

type CatalogItem = {
  id: string;
  title: string;
  thumbnail: string | null;
  brand: string;
  brand_id: string | null;
  categories: { name: string; handle: string }[];
  price: number;
  variant_id: string;
  concern_tags: string[];
  skin_types: string[];
  concerns: string[];
  ingredients: string[];
};

async function fetchCatalog(): Promise<CatalogItem[]> {
  const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
  const res = await fetch(`${medusaUrl}/store/shop-catalog`, {
    headers: { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`shop-catalog responded ${res.status}`);
  const data = await res.json();
  return data.products || [];
}

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

  let products: (CategoryProduct & { brand_id: string | null; category_handles: string[] })[] = [];

  try {
    const items = await fetchCatalog();
    products = items.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.categories[0]?.name || "Soin",
      categories: p.categories.map((c) => c.name || c.handle || ""),
      image: p.thumbnail || "/products/1.webp",
      price_fcfa: p.price || 15000,
      variantId: p.variant_id,
      skin_profile: {
        // raw tags, displayed as chips on the card
        skin_types: p.skin_types,
        skin_concerns: p.concern_tags,
      },
      // canonical labels the filters match on
      skin_types: p.skin_types,
      concerns: p.concerns,
      ingredients: p.ingredients,
      // searching "niacinamide" should find products that contain it
      active_ingredients: p.ingredients.map((name) => ({ name })),
      brand: p.brand,
      brand_id: p.brand_id,
      category_handles: p.categories.map((c) => (c.handle || "").toLowerCase()),
      domain: productDomain(p.categories.map((c) => c.handle || ""), p.title),
    }));
  } catch (error) {
    console.error("Failed to fetch the shop catalogue:", error);
  }

  // Same as before: a regular category narrows to the Medusa category with that handle. If no product
  // belongs to such a category (handle not found), no narrowing - the name matching below decides.
  let base = products;
  if (!collection_id && category !== "all" && !NO_MEDUSA_CATEGORY.has(category)) {
    const handle = (CATEGORY_HANDLE_MAP[category] || category).toLowerCase();
    const inCategory = products.filter((p) => p.category_handles.includes(handle));
    if (inCategory.length > 0) base = inCategory;
  }

  const grouped = !collection_id ? GROUPED_BY_HANDLE[category] : undefined;
  const listed = base.filter(
    (p) =>
      (!collection_id || p.brand_id === collection_id) &&
      (!q || matchesQuery(p, q)) &&
      (grouped
        ? p.category_handles.some((h) => grouped.handles.includes(h)) || (!!grouped.title && grouped.title.test(p.title))
        : matchesCategory(category, p))
  );

  return <CategoryClient category={category} products={listed} />;
}
