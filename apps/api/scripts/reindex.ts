import { MedusaContainer } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";

export default async function reindexProducts({ container }: { container: MedusaContainer }) {
  const productModule = container.resolve(Modules.PRODUCT);
  
  console.log("Fetching all products...");
  const products = await productModule.listProducts({}, { take: 1000 });
  console.log(`Found ${products.length} products. Proceeding to trigger updates...`);
  
  // We'll update them with the same title to trigger the event without changing data
  const updates = products.map((p) => ({
    id: p.id,
    title: p.title
  }));
  
  if (updates.length > 0) {
    console.log("Triggering update workflow...");
    const { result, errors } = await updateProductsWorkflow(container).run({
      input: { products: updates }
    });
    
    if (errors && errors.length > 0) {
      console.error("Errors occurred:", errors);
    } else {
      console.log("Successfully updated products! They should now be indexed in Meilisearch.");
    }
  } else {
    console.log("No products found.");
  }
}
