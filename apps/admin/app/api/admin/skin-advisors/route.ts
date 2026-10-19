import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";

// Adds a skin advisor (API: POST /admin/skin-advisors)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await request.json();
    const data = await fetchAdmin<any>("/skin-advisors", token, { method: "POST", body: JSON.stringify(body) });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Impossible d'ajouter cette conseillère." }, { status: 400 });
  }
}
