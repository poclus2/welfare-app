import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const params = await context.params;
    const res = await fetch(`${process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"}/admin/ambassador-applications/${params.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-medusa-access-token": process.env.MEDUSA_ADMIN_API_TOKEN || "test_token",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update ambassador application" }, { status: 500 });
  }
}

