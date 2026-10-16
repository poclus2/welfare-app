import { NextRequest, NextResponse } from "next/server";
import { fetchAdmin } from "@/lib/medusa-admin";
import { cookies } from "next/headers";

// Home page slides (API: /admin/home-banners)
export async function GET() {
  try {
    const token = (await cookies()).get("admin_token")?.value;
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const data = await fetchAdmin<{ home_banners: any[] }>("/home-banners", token);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[Home banners GET] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = (await cookies()).get("admin_token")?.value;
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const data = await fetchAdmin<{ home_banner: any }>("/home-banners", token, {
      method: "POST",
      body: JSON.stringify(await req.json()),
    });
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[Home banners POST] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
