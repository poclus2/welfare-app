import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";

// Gives a scan to a skin advisor, who is told on WhatsApp (API: POST /admin/skin-scans/:id/advisor)
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await request.json();
    const { id } = await context.params;
    const data = await fetchAdmin<any>(`/skin-scans/${encodeURIComponent(id)}/advisor`, token, { method: "POST", body: JSON.stringify(body) });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Attribution impossible." }, { status: 400 });
  }
}
