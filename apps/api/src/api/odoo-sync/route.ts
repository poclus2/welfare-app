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

  if (!location_id || !stock || !Array.isArray(stock)) {
    return res.status(400).json({ success: false, message: "Invalid payload. Expected { location_id, stock: [{ barcode, quantity }] }" });
  }

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
    const inventoryService = req.scope.resolve(Modules.INVENTORY);

    const barcodes = stock.map((s) => String(s.barcode).trim());
    if (barcodes.length === 0) {
      return res.status(200).json({ success: true, updated_count: 0 });
    }
    
    // Fetch variants and their associated inventory items using the Query Module
    const { data: variants } = await query.graph({
      entity: "variant",
      fields: ["id", "barcode", "inventory_items.inventory_item_id"],
      filters: {
        barcode: { $in: barcodes },
      },
    });

    // Map barcode -> inventory_item_id
    const barcodeToItemId = new Map<string, string>();
    for (const v of variants) {
      if (v.barcode && v.inventory_items?.[0]?.inventory_item_id) {
        barcodeToItemId.set(v.barcode.trim(), v.inventory_items[0].inventory_item_id);
      }
    }

    let updatedCount = 0;
    let notFoundCount = 0;
    const errors: string[] = [];

    // Process each stock update
    for (const item of stock) {
      const barcodeStr = String(item.barcode).trim();
      const itemId = barcodeToItemId.get(barcodeStr);
      
      if (itemId) {
        try {
          // First, try to update existing level
          await inventoryService.updateInventoryLevels([{
            inventory_item_id: itemId,
            location_id: location_id,
            stocked_quantity: item.quantity,
          }]);
          updatedCount++;
        } catch (err: any) {
          // If level doesn't exist, create it
          try {
             await inventoryService.createInventoryLevels([{
               inventory_item_id: itemId,
               location_id: location_id,
               stocked_quantity: item.quantity,
             }]);
             updatedCount++;
          } catch (createErr: any) {
             errors.push(`Failed to set stock for barcode ${barcodeStr}: ${createErr.message}`);
          }
        }
      } else {
        notFoundCount++;
      }
    }

    return res.status(200).json({
      success: true,
      updated_count: updatedCount,
      not_found_count: notFoundCount,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error("[Odoo Sync Error]", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
