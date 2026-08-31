import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const token = req.headers["x-odoo-token"];
  
  // Protect with a simple token (to be configured in env, with a fallback)
  const validToken = process.env.ODOO_SYNC_TOKEN || "welfare-odoo-super-secret-2026";
  if (token !== validToken) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { location_id, stock } = req.body as {
    location_id: string;
    stock: { barcode: string; quantity: number }[];
  };

  console.log(`[Odoo Sync] ---------------------------------------------`);
  console.log(`[Odoo Sync] Received sync request from Odoo client`);
  console.log(`[Odoo Sync] Client IP: ${req.headers["x-forwarded-for"] || req.connection.remoteAddress}`);
  console.log(`[Odoo Sync] Location ID: ${location_id}`);
  console.log(`[Odoo Sync] Items count: ${stock ? stock.length : "undefined"}`);

  if (!location_id || !stock || !Array.isArray(stock)) {
    console.warn(`[Odoo Sync] Rejected: Invalid payload. location_id or stock array missing.`);
    return res.status(400).json({ success: false, message: "Invalid payload. Expected { location_id, stock: [{ barcode, quantity }] }" });
  }

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
    const inventoryService = req.scope.resolve(Modules.INVENTORY);

    // Aggregate quantities by barcode (since Odoo sends separate lots for the same barcode)
    const aggregatedStockMap = new Map<string, number>();
    for (const item of stock) {
      if (!item.barcode) continue;
      const barcodeStr = String(item.barcode).trim();
      const qty = Number(item.quantity) || 0;
      aggregatedStockMap.set(barcodeStr, (aggregatedStockMap.get(barcodeStr) || 0) + qty);
    }
    
    const aggregatedStock = Array.from(aggregatedStockMap.entries()).map(([barcode, quantity]) => ({ barcode, quantity }));
    const barcodes = aggregatedStock.map((s) => s.barcode);

    if (barcodes.length === 0) {
      console.log(`[Odoo Sync] Finished: No barcodes provided. Updated: 0`);
      return res.status(200).json({ success: true, updated_count: 0 });
    }
    
    // Fetch variants and their associated inventory items using the Query Module
    const { data: variants } = await query.graph({
      entity: "variant",
      fields: ["id", "barcode", "metadata", "inventory_items.inventory_item_id"],
      filters: {
        barcode: { $in: barcodes },
      },
    });

    // Map barcode -> { inventory_item_id, variant_id, metadata }
    const barcodeMap = new Map<string, { itemId: string, variantId: string, metadata: any }>();
    for (const v of variants) {
      if (v.barcode && v.inventory_items?.[0]?.inventory_item_id) {
        barcodeMap.set(v.barcode.trim(), {
          itemId: v.inventory_items[0].inventory_item_id,
          variantId: v.id,
          metadata: v.metadata || {}
        });
      }
    }

    let updatedCount = 0;
    let notFoundCount = 0;
    const errors: string[] = [];
    
    const productService = req.scope.resolve(Modules.PRODUCT);
    const variantsToUpdate = [];

    // Process each stock update using the aggregated data
    for (const item of aggregatedStock) {
      const barcodeStr = String(item.barcode).trim();
      const mapped = barcodeMap.get(barcodeStr);

      if (mapped) {
        try {
          // First, try to update existing level
          await inventoryService.updateInventoryLevels([{
            inventory_item_id: mapped.itemId,
            location_id: location_id,
            stocked_quantity: item.quantity,
          }]);
          updatedCount++;
        } catch (err: any) {
          // If level doesn't exist, create it
          try {
             await inventoryService.createInventoryLevels([{
               inventory_item_id: mapped.itemId,
               location_id: location_id,
               stocked_quantity: item.quantity,
             }]);
             updatedCount++;
          } catch (createErr: any) {
             console.error(`[Odoo Sync] Create Error for barcode ${barcodeStr}:`, createErr.message);
             errors.push(`Failed to set stock for barcode ${barcodeStr}: ${createErr.message}`);
          }
        }
        
        // Prepare metadata update for the custom Admin UI
        const newMetadata = { ...mapped.metadata };
        if (location_id === "sloc_01M0MHY28WQ38S3YE3XNQ9JPFZ") {
          newMetadata.stock_b1 = item.quantity;
        } else if (location_id === "sloc_01M0MHY29NJWHRCEQBRT1KAM8N") {
          newMetadata.stock_b2 = item.quantity;
        }
        variantsToUpdate.push({
          id: mapped.variantId,
          metadata: newMetadata
        });
        
      } else {
        notFoundCount++;
      }
    }
    
    // Batch update metadata
    if (variantsToUpdate.length > 0) {
      try {
        for (const v of variantsToUpdate) {
          await productService.updateProductVariants(v.id, { metadata: v.metadata });
        }
      } catch (e: any) {
        console.error(`[Odoo Sync] Failed to update variant metadata:`, e.message);
      }
    }

    console.log(`[Odoo Sync] Finished processing Location: ${location_id}.`);
    console.log(`[Odoo Sync] Total variants matched & updated: ${updatedCount}`);
    console.log(`[Odoo Sync] Total barcodes not found in Medusa: ${notFoundCount}`);
    if (errors.length > 0) {
      console.log(`[Odoo Sync] Encountered ${errors.length} errors during sync.`);
    }

    return res.status(200).json({
      success: true,
      updated_count: updatedCount,
      not_found_count: notFoundCount,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error("[Odoo Sync] Fatal Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
