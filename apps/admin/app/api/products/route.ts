import { NextRequest, NextResponse } from "next/server";
import { fetchAdmin } from "@/lib/medusa-admin";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const ids = searchParams.get("ids") || "";
    const limit = searchParams.get("limit") || "12";

    const query = new URLSearchParams({ limit, expand: "variants" });
    if (q) query.set("q", q);
    
    let idList: string[] = [];
    if (ids) {
      idList = ids.split(",").filter(Boolean);
      // Pass ids directly to Medusa API (supported in V2)
      idList.forEach(id => query.append("id", id));
      query.set("limit", "100"); // Ensure we get them all if there are many
    }

    const data = await fetchAdmin<{ products: any[]; count: number }>(
      `/products?${query.toString()}`,
      token
    );

    let products = data.products || [];
    
    return NextResponse.json({ products, count: data.count || products.length });
  } catch (err: any) {
    console.error("[Products GET] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const payload = await req.json();

    const response = await fetchAdmin<{ product: any }>("/products", token, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("[Create Product] Error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

