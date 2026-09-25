
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const params = await context.params;
    
    const res = await fetch(`${process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"}/admin/ambassador-applications/${params.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(body),
    });
    
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update ambassador application" }, { status: 500 });
  }
}

