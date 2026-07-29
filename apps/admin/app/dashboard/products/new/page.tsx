import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";
import { ProductForm } from "@/components/products/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  
  let collections = [];
  let categories = [];
  
  if (token) {
    const [collRes, catRes] = await Promise.all([
      fetchAdmin<{ collections: any[] }>("/collections?limit=100", token).catch(() => ({ collections: [] })),
      fetchAdmin<{ product_categories: any[] }>("/product-categories?limit=100", token).catch(() => ({ product_categories: [] }))
    ]);
    collections = collRes.collections;
    categories = catRes.product_categories;
  }

  return (
    <div className="p-5 lg:p-8">
      <ProductForm collections={collections} categories={categories} />
    </div>
  );
}
