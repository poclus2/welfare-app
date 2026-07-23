import { Modules } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"

export default async function recreateProduct({ container }) {
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL)
  const productModule = container.resolve(Modules.PRODUCT)

  const [salesChannels] = await salesChannelModule.listSalesChannels()
  const defaultSalesChannelId = salesChannels?.[0]?.id

  let collections = await productModule.listProductCollections({ q: "CKD" });
  let collectionId = collections.length > 0 ? collections[0].id : undefined;

  const payload: any = {
    title: "CKD VITA CTECA Blemish Shot Mask",
    description: "Découvrez le CKD VITA CTECA Blemish Shot Mask...",
    status: "published",
    collection_id: collectionId,
    options: [{ title: "Default Option", values: ["Default Variant"] }],
    variants: [{
      title: "Default Variant",
      manage_inventory: true,
      options: { "Default Option": "Default Variant" },
      prices: [{
        currency_code: "xof",
        amount: 4000
      }]
    }]
  }

  if (defaultSalesChannelId) {
    payload.sales_channels = [{ id: defaultSalesChannelId }]
  }

  console.log("Recreating CKD product with price 4000...");
  try {
    await createProductsWorkflow(container).run({
      input: { products: [payload] }
    });
    console.log("Product successfully recreated!");
  } catch (e) {
    console.error("Error recreating product:", e.message);
  }
}
