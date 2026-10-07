import { NextRequest, NextResponse } from "next/server";
import { fetchAdmin } from "@/lib/medusa-admin";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const payload = await req.json();

    const response = await fetchAdmin<{ product: any }>(`/products/${id}`, token, {
      method: "POST", // Medusa uses POST to /admin/products/:id for updates
      body: JSON.stringify(payload),
    });

    revalidateTag("admin-products");
    return NextResponse.json(response);
  } catch (err: any) {
    console.error("[Update Product] Error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

// Product deletion. Medusa soft-deletes the product and its variants: past orders keep their own copy
// of the lines, and the API subscribers on product.deleted remove it from the search index, the brand
// product counts and the shop catalogue cache.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = (await cookies()).get("admin_token")?.value;
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    await fetchAdmin<{ id: string; deleted: boolean }>(`/products/${id}`, token, { method: "DELETE" });

    revalidateTag("admin-products");
    return NextResponse.json({ id, deleted: true });
  } catch (err: any) {
    console.error("[Delete Product] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
