import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const res = await fetch(`${process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"}/admin/ambassador-applications`, {
      headers: {
        "x-medusa-access-token": process.env.MEDUSA_ADMIN_API_TOKEN || "test_token",
      },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch ambassador applications" }, { status: 500 });
  }
}

