import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = await fetchAdmin<any>("/promo-codes", token, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error: any) {
    // fetchAdmin surfaces the backend's `message`, which is already user-facing French text
    return NextResponse.json({ error: error.message || "Impossible de créer ce code promo." }, { status: 400 });
  }
}
