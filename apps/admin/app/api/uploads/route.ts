import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MEDUSA_URL } from "@/lib/medusa-admin";

// Product photo upload from the product form. The browser shrinks photos first (nginx accepts 1 MB per
// request); this forwards them to Medusa's file module (POST /admin/uploads), which stores them in the
// API's ./static folder and returns their public URL (https://api.thewelfarecm.com/static/...).
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let files: File[];
  try {
    const form = await req.formData();
    files = form.getAll("files").filter((f): f is File => f instanceof File).slice(0, 6);
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  if (!files.length) return NextResponse.json({ error: "Aucune photo reçue" }, { status: 400 });
  for (const f of files) {
    if (!ALLOWED.includes(f.type)) return NextResponse.json({ error: "Format non pris en charge (JPEG, PNG ou WebP)" }, { status: 400 });
    if (f.size > MAX_BYTES) return NextResponse.json({ error: "Photo trop lourde (2 Mo maximum)" }, { status: 400 });
  }

  const upstream = new FormData();
  for (const f of files) upstream.append("files", f, f.name || "photo.jpg");

  try {
    const res = await fetch(`${MEDUSA_URL}/admin/uploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: upstream,
      cache: "no-store",
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[Upload] Medusa error:", res.status, JSON.stringify(data).slice(0, 300));
      return NextResponse.json({ error: data?.message || `Envoi refusé (${res.status})` }, { status: 502 });
    }
    return NextResponse.json({ files: (data.files || []).map((f: any) => ({ id: f.id, url: f.url })) });
  } catch (e: any) {
    console.error("[Upload] Failed:", e);
    return NextResponse.json({ error: "Impossible d'envoyer la photo" }, { status: 502 });
  }
}
