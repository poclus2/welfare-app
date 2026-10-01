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

    const data = await fetchAdmin<{ collections: any[]; count: number }>(
      `/collections?limit=${limit}&fields=*products`,
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
