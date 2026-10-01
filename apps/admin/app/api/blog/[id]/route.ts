import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STOREFRONT_URL = process.env.STOREFRONT_URL || "http://localhost:3000";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const res = await fetch(`${STOREFRONT_URL}/api/blog/${id}`, { cache: "no-store" });
  const data = await res.json().catch(() => ({ error: "Réponse invalide du storefront" }));
  return NextResponse.json(data, { status: res.status });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const res = await fetch(`${STOREFRONT_URL}/api/blog/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-admin-key": process.env.ADMIN_BLOG_KEY || "" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ error: "Réponse invalide du storefront" }));
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const res = await fetch(`${STOREFRONT_URL}/api/blog/${id}`, {
    method: "DELETE",
    headers: { "x-admin-key": process.env.ADMIN_BLOG_KEY || "" },
  });
  const data = await res.json().catch(() => ({ error: "Réponse invalide du storefront" }));
  return NextResponse.json(data, { status: res.status });
}
