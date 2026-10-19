import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";

// Updates a skin advisor: name, number, active or not, new password (API: POST /admin/skin-advisors/:id)
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await request.json();
    const { id } = await context.params;
    const data = await fetchAdmin<any>(`/skin-advisors/${encodeURIComponent(id)}`, token, { method: "POST", body: JSON.stringify(body) });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Enregistrement impossible." }, { status: 400 });
  }
}
