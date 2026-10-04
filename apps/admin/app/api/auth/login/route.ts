import { NextRequest, NextResponse } from "next/server";
import { getTokenExpiry } from "@/lib/session";

const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || "https://api.thewelfarecm.com";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Call Medusa auth directly (no import from "use server" file)
    const medusaRes = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    if (!medusaRes.ok) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    const data = await medusaRes.json();
    const token: string = data.token;
    const tokenExp = getTokenExpiry(token);

    const res = NextResponse.json({ success: true });
    res.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: false, // Allows HTTP access before SSL is configured
      sameSite: "lax",
      // Never outlive the backend token itself (Medusa JWTs last 24h by default) — a 7-day cookie
      // holding a dead token is what used to leave admins on empty pages instead of the login screen.
      maxAge: tokenExp
        ? Math.max(60, Math.min(60 * 60 * 24 * 7, tokenExp - Math.floor(Date.now() / 1000)))
        : 60 * 60 * 24,
      path: "/",
    });
    return res;
  } catch (err: any) {
    console.error("[Login] Error:", err);
    return NextResponse.json(
      { error: "Erreur serveur, veuillez réessayer" },
      { status: 500 }
    );
  }
}
