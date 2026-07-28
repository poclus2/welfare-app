import { NextRequest, NextResponse } from "next/server";
import { loginAdmin } from "@/lib/medusa-admin";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const token = await loginAdmin(email, password);

    const res = NextResponse.json({ success: true });
    res.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur de connexion" }, { status: 401 });
  }
}
