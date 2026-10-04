// Compares the Odoo stock mirrored on the site (variant.metadata stock_b1 + stock_b2) with Medusa's own
// inventory_quantity, and shows how fresh the sync is.
//   node check-stock.mjs <api-url> <publishable-key>
const [base, key] = process.argv.slice(2);
if (!base || !key) {
  console.error("usage: node check-stock.mjs <api-url> <publishable-key>");
  process.exit(1);
}

const fields = "id,title,+variants.id,+variants.barcode,+variants.metadata,+variants.inventory_quantity,+variants.manage_inventory,+variants.updated_at";
const rows = [];
for (let offset = 0; ; offset += 100) {
  const res = await fetch(`${base}/store/products?limit=100&offset=${offset}&fields=${fields}`, {
    headers: { "x-publishable-api-key": key },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { products, count } = await res.json();
  for (const p of products) for (const v of p.variants || []) rows.push(v);
  if (offset + 100 >= count) break;
}

const n = (x) => Number(x) || 0;
const tracked = rows.filter((v) => v.metadata?.stock_b1 != null || v.metadata?.stock_b2 != null);
const odoo = (v) => n(v.metadata.stock_b1) + n(v.metadata.stock_b2);
const updates = rows.map((v) => v.updated_at).filter(Boolean).sort();
const last = updates[updates.length - 1];
const ageH = last ? ((Date.now() - new Date(last)) / 3.6e6).toFixed(1) : "?";

console.log(`variants: ${rows.length}, with Odoo stock: ${tracked.length}`);
console.log(`last variant update: ${last} (${ageH} h ago)`);
console.log(`negative Odoo values (b1/b2): ${tracked.filter((v) => v.metadata.stock_b1 < 0 || v.metadata.stock_b2 < 0).length}`);
console.log(`stock_total != b1+b2: ${tracked.filter((v) => n(v.metadata.stock_total) !== odoo(v)).length}`);
const known = tracked.filter((v) => v.inventory_quantity != null);
console.log(`Medusa inventory_quantity != Odoo: ${known.filter((v) => v.inventory_quantity !== odoo(v)).length} / ${known.length}`);
console.log(`blocked in Medusa (<=0) but in stock in Odoo: ${known.filter((v) => v.inventory_quantity <= 0 && odoo(v) > 0).length}`);
