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
    const data = await fetchAdmin<any>(`/creator-partners/${id}/creator-of-month`, token, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update creator of the month" }, { status: 500 });
  }
}
