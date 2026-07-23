import { Modules } from "@medusajs/framework/utils"
import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows"

export default async function fixProduct({ container }) {
  const productModule = container.resolve(Modules.PRODUCT)
  const products = await productModule.listProducts({ q: "CKD VITA" });
  if (products.length > 0) {
    console.log("Deleting broken product:", products[0].id);
    await deleteProductsWorkflow(container).run({
      input: { ids: [products[0].id] }
    });
    console.log("Deleted. Now re-importing...");
  }
}
