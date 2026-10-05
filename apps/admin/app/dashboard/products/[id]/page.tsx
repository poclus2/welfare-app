import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { fetchAdmin } from "@/lib/medusa-admin";
import { ProductForm } from "@/components/products/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;

  // Where to go back to after saving: the list exactly as it was (page, search, sort, status).
  // Only those four known parameters are kept, so `from` can never point anywhere else.
  const back = new URLSearchParams();
  if (typeof from === "string") {
    const src = new URLSearchParams(from);
    for (const key of ["offset", "q", "order", "status"]) {
      const v = src.get(key);
      if (v && (key !== "offset" || /^\d+$/.test(v))) back.set(key, v);
    }
  }
  const returnTo = `/dashboard/products${back.toString() ? `?${back.toString()}` : ""}`;
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  
  if (!token) return null;

  let product = null;
  let collections = [];
  let categories = [];

  try {
    const [productRes, collectionsRes, categoriesRes] = await Promise.all([
      fetchAdmin<{ product: any }>(`/products/${id}?fields=*categories,*variants,*variants.prices,*images`, token),
      fetchAdmin<{ collections: any[] }>("/collections?limit=100", token),
      fetchAdmin<{ product_categories: any[] }>("/product-categories?limit=100", token)
    ]);
    product = productRes.product;
    collections = collectionsRes.collections;
    categories = categoriesRes.product_categories;
  } catch (err) {
    notFound();
  }

  return (
    <div className="p-5 lg:p-8">
      <ProductForm initialData={product} collections={collections} categories={categories} returnTo={returnTo} />
    </div>
  );
}
