import { NextRequest, NextResponse } from "next/server";
import { fetchAdmin } from "@/lib/medusa-admin";
import { cookies } from "next/headers";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = (await cookies()).get("admin_token")?.value;
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const data = await fetchAdmin<{ home_banner: any }>(`/home-banners/${id}`, token, {
      method: "POST",
      body: JSON.stringify(await req.json()),
    });
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[Home banner update] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = (await cookies()).get("admin_token")?.value;
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const data = await fetchAdmin(`/home-banners/${id}`, token, { method: "DELETE" });
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[Home banner delete] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
