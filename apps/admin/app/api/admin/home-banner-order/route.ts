import { NextRequest, NextResponse } from "next/server";
import { fetchAdmin } from "@/lib/medusa-admin";
import { cookies } from "next/headers";

// New order of the home page slides. Body: { ids: [...] }
export async function POST(req: NextRequest) {
  try {
    const token = (await cookies()).get("admin_token")?.value;
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const data = await fetchAdmin("/home-banner-order", token, {
      method: "POST",
      body: JSON.stringify(await req.json()),
    });
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[Home banner order] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
