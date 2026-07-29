import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { fetchAdmin } from "@/lib/medusa-admin";
import { ProductForm } from "@/components/products/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  
  if (!token) return null;

  let product = null;
  let collections = [];

  try {
    const [productRes, collectionsRes] = await Promise.all([
      fetchAdmin<{ product: any }>(`/products/${id}`, token),
      fetchAdmin<{ collections: any[] }>("/collections?limit=100", token)
    ]);
    product = productRes.product;
    collections = collectionsRes.collections;
  } catch (err) {
    notFound();
  }

  return (
    <div className="p-5 lg:p-8">
      <ProductForm initialData={product} collections={collections} />
    </div>
  );
}
