import { MedusaContainer } from "@medusajs/framework/types"

export default async function run({ container }: { container: MedusaContainer }) {
  console.log("Fetching products...");
  
  // In v2, we use query to fetch products
  const query = container.resolve("query");
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title"],
  });
  
  console.log(`Found ${products.length} products. Triggering updates...`);
  
  const productModule = container.resolve("product");
  for (const p of products) {
    await productModule.updateProducts([
      {
        id: p.id,
        title: p.title,
      }
    ]);
  }
  console.log("Done.");
}
