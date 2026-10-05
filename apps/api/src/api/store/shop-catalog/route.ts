import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getShopCatalog } from "../../../lib/shop-catalog"

// GET /store/shop-catalog — slim, cached product list for the storefront category pages.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const products = await getShopCatalog(req.scope)
    res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=60")
    res.json({ products, count: products.length })
  } catch (e: any) {
    console.error("[store/shop-catalog] Error:", e)
    res.status(500).json({ message: "Impossible de charger le catalogue pour le moment." })
  }
}
