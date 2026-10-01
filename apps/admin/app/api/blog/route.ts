import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Proxies blog writes to the storefront's /api/blog, which is the actual
// store for posts. Authorization here is the real admin session cookie —
// the shared x-admin-key secret is attached server-side only and never
// reaches the browser (it used to be a hardcoded literal shipped in the
// admin's client bundle, letting anyone write/delete posts with no login).
const STOREFRONT_URL = process.env.STOREFRONT_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const res = await fetch(`${STOREFRONT_URL}/api/blog?all=true`, {
    headers: { "x-admin-key": process.env.ADMIN_BLOG_KEY || "" },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({ error: "Réponse invalide du storefront" }));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const res = await fetch(`${STOREFRONT_URL}/api/blog`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-key": process.env.ADMIN_BLOG_KEY || "" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ error: "Réponse invalide du storefront" }));
  return NextResponse.json(data, { status: res.status });
}
