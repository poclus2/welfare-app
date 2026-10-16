import { NextRequest, NextResponse } from "next/server";
import { fetchAdmin } from "@/lib/medusa-admin";
import { cookies } from "next/headers";

// People who asked to be told about a launch (Sekoria), with their consent
export async function GET(req: NextRequest) {
  try {
    const token = (await cookies()).get("admin_token")?.value;
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const campaign = new URL(req.url).searchParams.get("campaign") || "sekoria";
    const data = await fetchAdmin<{ launch_subscribers: any[] }>(
      `/launch-subscribers?campaign=${encodeURIComponent(campaign)}`,
      token
    );
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[Launch subscribers GET] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
