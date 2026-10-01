import { NextRequest, NextResponse } from "next/server";
import { fetchAdmin } from "@/lib/medusa-admin";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || "100";

    // metadata.product_count is kept up to date by the collection-product-count-sync
    // subscriber — reading it here avoids expanding *products (full product objects)
    // on every page load just to compute a count.
    const data = await fetchAdmin<{ collections: any[]; count: number }>(
      `/collections?limit=${limit}&fields=*,metadata`,
      token
    );

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[Collections GET] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const payload = await req.json();

    const response = await fetchAdmin<{ collection: any }>("/collections", token, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("[Create Collection] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
