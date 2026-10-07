import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { checkInci } from "@/lib/inci-check";

// INCI list check for the product form: returns the names that are not in CosIng (see lib/inci-check).
//   POST /api/products/inci-check { inci: "Water, Glycerin, ..." }
export async function POST(req: NextRequest) {
  if (!(await cookies()).get("admin_token")?.value) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const inci = typeof body?.inci === "string" ? body.inci.slice(0, 10000) : "";
  return NextResponse.json(checkInci(inci));
}
