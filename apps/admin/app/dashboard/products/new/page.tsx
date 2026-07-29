import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";
import { ProductForm } from "@/components/products/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  
  let collections = [];
  
  if (token) {
    const data = await fetchAdmin<{ collections: any[] }>("/collections?limit=100", token)
      .catch(() => ({ collections: [] }));
    collections = data.collections;
  }

  return (
    <div className="p-5 lg:p-8">
      <ProductForm collections={collections} />
    </div>
  );
}
