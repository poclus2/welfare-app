import { timingSafeEqual } from "crypto";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { syncProductToSearch } from "../../lib/meili-products";

// Odoo -> Medusa stock sync. One Odoo database per shop pushes a full snapshot of its sellable stock
// every few minutes (see scripts/odoo-sync). Odoo is the source of truth:
//   - variant.metadata.stock_b1 / stock_b2 hold the per-shop quantity (read by admin + storefront)
//   - variant.metadata.stock_total is kept as their sum
//   - the Medusa inventory level of the shop's stock location is aligned too, so the cart can't be
//     blocked (or allowed) by a number that disagrees with Odoo.
// Quantities are clamped to >= 0: a negative Odoo quant means "sold without a stock entry", not stock.

const FALLBACK_TOKEN = "welfare-odoo-super-secret-2026";

// Medusa stock location -> metadata key. Override with env if the locations are ever recreated.
const LOCATION_KEYS: Record<string, "stock_b1" | "stock_b2"> = {
  [process.env.ODOO_LOCATION_B1 || "sloc_01M0MHY28WQ38S3YE3XNQ9JPFZ"]: "stock_b1",
  [process.env.ODOO_LOCATION_B2 || "sloc_01M0MHY29NJWHRCEQBRT1KAM8N"]: "stock_b2",
};

const CHUNK = 200;

type SyncState = { at: string; received: number; updated: number; not_found: number; errors: number };
const lastSync: Record<string, SyncState> = {};

// Both shops push at roughly the same time. Each variant's metadata is read-modify-written, so
// concurrent requests could overwrite each other's key — run them one after the other.
let queue: Promise<unknown> = Promise.resolve();
function serialize<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job, job);
  queue = run.catch(() => undefined);
  return run;
}

function tokenOk(header: string | string[] | undefined): boolean {
  const expected = process.env.ODOO_SYNC_TOKEN || FALLBACK_TOKEN;
  const given = Array.isArray(header) ? header[0] : header;
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

if (!process.env.ODOO_SYNC_TOKEN) {
  console.warn("[Odoo Sync] ODOO_SYNC_TOKEN is not set — using the built-in default token. Set it in the API environment.");
}

const toQty = (v: unknown) => Math.max(0, Math.trunc(Number(v) || 0));
const chunks = <T,>(arr: T[], size: number) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, (i + 1) * size));

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  if (!tokenOk(req.headers["x-odoo-token"])) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const locations = Object.entries(LOCATION_KEYS).map(([id, key]) => ({ location_id: id, key, last_sync: lastSync[id] || null }));
  return res.status(200).json({ success: true, locations, note: "last_sync is kept in memory and resets on API restart" });
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  if (!tokenOk(req.headers["x-odoo-token"])) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { location_id, stock } = (req.body || {}) as {
    location_id?: string;
    stock?: { barcode: string; quantity: number }[];
  };

  if (!location_id || !Array.isArray(stock)) {
    console.warn("[Odoo Sync] Rejected: invalid payload (location_id / stock missing)");
    return res.status(400).json({ success: false, message: "Invalid payload. Expected { location_id, stock: [{ barcode, quantity }] }" });
  }
  const key = LOCATION_KEYS[location_id];
  if (!key) {
    console.warn(`[Odoo Sync] Rejected: unknown location_id ${location_id}`);
    return res.status(400).json({ success: false, message: `Unknown location_id ${location_id}` });
  }

  try {
    const result = await serialize(() => syncLocation(req, location_id, key, stock));
    return res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    console.error("[Odoo Sync] Fatal Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

async function syncLocation(
  req: MedusaRequest,
  locationId: string,
  key: "stock_b1" | "stock_b2",
  stock: { barcode: string; quantity: number }[]
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const inventoryService = req.scope.resolve(Modules.INVENTORY) as any;
  const productService = req.scope.resolve(Modules.PRODUCT) as any;

  // Odoo can send several lots/rows for one barcode: add them up
  const qtyByBarcode = new Map<string, number>();
  let negatives = 0;
  for (const item of stock) {
    if (!item?.barcode) continue;
    const barcode = String(item.barcode).trim();
    if (Number(item.quantity) < 0) negatives++;
    qtyByBarcode.set(barcode, (qtyByBarcode.get(barcode) || 0) + (Number(item.quantity) || 0));
  }

  console.log(`[Odoo Sync] ${key} (${locationId}): ${stock.length} rows, ${qtyByBarcode.size} barcodes, ${negatives} negative`);

  let metadataWritten = 0;
  let unchanged = 0;
  let levelsUpdated = 0;
  let levelsCreated = 0;
  let notFound = 0;
  const notFoundSample: string[] = [];
  const errors: string[] = [];
  // products that went out of stock or came back: the search index ranks in-stock products first
  const availabilityChanged = new Set<string>();

  for (const barcodes of chunks(Array.from(qtyByBarcode.keys()), CHUNK)) {
    const { data: variants } = await query.graph({
      entity: "variant",
      fields: ["id", "product_id", "barcode", "metadata", "inventory_items.inventory_item_id"],
      filters: { barcode: { $in: barcodes } },
      pagination: { take: barcodes.length },
    });

    const byBarcode = new Map<string, any>();
    for (const v of variants as any[]) if (v.barcode) byBarcode.set(String(v.barcode).trim(), v);

    // --- Medusa inventory levels (best effort: metadata below is written regardless) ---
    const itemIds = (variants as any[]).map((v) => v.inventory_items?.[0]?.inventory_item_id).filter(Boolean);
    if (itemIds.length) {
      try {
        const levels: any[] = await inventoryService.listInventoryLevels(
          { location_id: locationId, inventory_item_id: itemIds },
          { take: null }
        );
        const levelByItem = new Map(levels.map((l) => [l.inventory_item_id, l]));
        const toUpdate: any[] = [];
        const toCreate: any[] = [];
        for (const barcode of barcodes) {
          const itemId = byBarcode.get(barcode)?.inventory_items?.[0]?.inventory_item_id;
          if (!itemId) continue;
          const qty = toQty(qtyByBarcode.get(barcode));
          const level = levelByItem.get(itemId);
          if (!level) toCreate.push({ inventory_item_id: itemId, location_id: locationId, stocked_quantity: qty });
          else if (Number(level.stocked_quantity) !== qty) toUpdate.push({ inventory_item_id: itemId, location_id: locationId, stocked_quantity: qty });
        }
        if (toUpdate.length) {
          await inventoryService.updateInventoryLevels(toUpdate);
          levelsUpdated += toUpdate.length;
        }
        if (toCreate.length) {
          await inventoryService.createInventoryLevels(toCreate);
          levelsCreated += toCreate.length;
        }
      } catch (e: any) {
        console.error(`[Odoo Sync] Inventory level error (${key}):`, e.message);
        errors.push(`inventory levels: ${e.message}`);
      }
    }

    // --- Variant metadata (what admin + storefront read) ---
    for (const barcode of barcodes) {
      const variant = byBarcode.get(barcode);
      if (!variant) {
        notFound++;
        if (notFoundSample.length < 20) notFoundSample.push(barcode);
        continue;
      }
      const qty = toQty(qtyByBarcode.get(barcode));
      const metadata = { ...(variant.metadata || {}) };
      const other = key === "stock_b1" ? "stock_b2" : "stock_b1";
      const total = qty + toQty(metadata[other]);

      if (metadata[key] === qty && metadata.stock_total === total) {
        unchanged++;
        continue;
      }
      const wasKnown = metadata.stock_b1 != null || metadata.stock_b2 != null;
      const wasInStock = toQty(metadata.stock_b1) + toQty(metadata.stock_b2) > 0;
      metadata[key] = qty;
      metadata.stock_total = total;
      try {
        await productService.updateProductVariants(variant.id, { metadata });
        metadataWritten++;
        if (!wasKnown || wasInStock !== total > 0) availabilityChanged.add(variant.product_id);
      } catch (e: any) {
        console.error(`[Odoo Sync] Metadata error for ${barcode}:`, e.message);
        errors.push(`metadata ${barcode}: ${e.message}`);
      }
    }
  }

  if (availabilityChanged.size) {
    // after the answer, one product at a time: a search index briefly behind must not slow the shops' sync
    const ids = [...availabilityChanged].filter(Boolean);
    const container = req.scope;
    setImmediate(async () => {
      for (const id of ids) {
        await syncProductToSearch(container, id).catch((e) => console.error(`[Odoo Sync] search index ${id}:`, e?.message));
      }
    });
  }

  lastSync[locationId] = {
    at: new Date().toISOString(),
    received: qtyByBarcode.size,
    updated: metadataWritten,
    not_found: notFound,
    errors: errors.length,
  };
  console.log(
    `[Odoo Sync] ${key} done: metadata written ${metadataWritten}, unchanged ${unchanged}, levels updated ${levelsUpdated}/created ${levelsCreated}, not found ${notFound}, errors ${errors.length}`
  );

  return {
    received: qtyByBarcode.size,
    updated_count: metadataWritten,
    unchanged_count: unchanged,
    levels_updated: levelsUpdated,
    levels_created: levelsCreated,
    not_found_count: notFound,
    not_found_sample: notFoundSample.length ? notFoundSample : undefined,
    errors: errors.length ? errors.slice(0, 20) : undefined,
  };
}
