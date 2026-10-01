import { NextRequest, NextResponse } from "next/server";
import { fetchAdmin } from "@/lib/medusa-admin";
import { cookies } from "next/headers";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const payload = await req.json();

    const response = await fetchAdmin<{ collection: any }>(`/collections/${id}`, token, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("[Update Collection] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const response = await fetchAdmin<{ id: string; deleted: boolean }>(`/collections/${id}`, token, {
      method: "DELETE",
    });

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("[Delete Collection] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
