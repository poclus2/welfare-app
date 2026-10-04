import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = await context.params;
    const data = await fetchAdmin<any>(`/promo-codes/${id}`, token, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Impossible de modifier ce code promo." }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const data = await fetchAdmin<any>(`/promo-codes/${id}`, token, { method: "DELETE" });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Impossible de supprimer ce code promo." }, { status: 400 });
  }
}
