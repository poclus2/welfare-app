import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";
import { barcodeVariants, normalizeBarcode } from "@/lib/barcode";

// Duplicate check while typing/scanning a barcode in the product form: a barcode already carried by
// another variant means the product probably exists already (e.g. imported from Odoo), and two variants
// with one barcode would make the Odoo stock sync update only one of them.
//   GET /api/products/barcode-check?code=8809...&exclude=variant_...
export async function GET(req: NextRequest) {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const code = normalizeBarcode(searchParams.get("code") || "");
  const exclude = searchParams.get("exclude") || "";
  if (!code || code.length > 64) return NextResponse.json({ matches: [] });

  try {
    const query = new URLSearchParams({ limit: "5", fields: "id,title,barcode,product_id,product.title,product.status" });
    for (const c of barcodeVariants(code)) query.append("barcode[]", c);
    const data = await fetchAdmin<{ variants: any[] }>(`/product-variants?${query.toString()}`, token);
    const matches = (data.variants || [])
      .filter((v) => v.id !== exclude)
      .map((v) => ({
        variant_id: v.id,
        product_id: v.product_id,
        product_title: v.product?.title || v.title || "Produit",
        status: v.product?.status || null,
        barcode: v.barcode,
      }));
    return NextResponse.json({ matches });
  } catch (err: any) {
    console.error("[Barcode check] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
