// The stock of record is the per-store metadata (stock_b1 = Hippodrome, stock_b2 = Playce): the
// Odoo sync writes it, the product form edits it, and the storefront shows b1 + b2. Medusa's own
// `inventory_quantity` is a separate counter nothing keeps in step with it — orders reserve against
// it while it sits at 0 — so it only goes negative. It is used strictly as a last-resort fallback.
// The product fields productStock() needs, for lists that ask Medusa only for what they show
// (a full product weighs ~10 KB: description, metadata, images, options…).
export const VARIANT_STOCK_FIELDS = "variants.id,variants.metadata";

export function variantStock(variant: any): number {
  const meta = variant?.metadata || {};
  if (meta.stock_b1 != null || meta.stock_b2 != null) {
    return (Number(meta.stock_b1) || 0) + (Number(meta.stock_b2) || 0);
  }
  if (meta.stock_total != null) return Number(meta.stock_total) || 0;
  return Number(variant?.inventory_quantity) || 0;
}

export function productStock(product: any): number {
  return (product?.variants || []).reduce((acc: number, v: any) => acc + variantStock(v), 0);
}
