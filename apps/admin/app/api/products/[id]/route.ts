import { NextRequest, NextResponse } from "next/server";
import { fetchAdmin } from "@/lib/medusa-admin";
import { cookies } from "next/headers";

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

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("[Update Product] Error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
