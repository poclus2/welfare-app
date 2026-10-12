import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Pilot review of a Skin Coach diagnostic: validate it, or save a corrected routine with a reason per change
// (API: POST /admin/skin-scans/:id/review)
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await request.json();
    const { id } = await context.params;
    const res = await fetch(`${process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"}/admin/skin-scans/${encodeURIComponent(id)}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Enregistrement impossible" }, { status: 500 });
  }
}
