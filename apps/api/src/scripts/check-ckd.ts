import { Modules } from "@medusajs/framework/utils"

export default async function checkCKD({ container }) {
  const productModule = container.resolve(Modules.PRODUCT)
  const products = await productModule.listProducts({ q: "CKD VITA" }, { relations: ["variants", "variants.prices"] });
  if (products.length > 0) {
    const prod = products[0];
    console.log("Product:", prod.title);
    console.log("Variants:", JSON.stringify(prod.variants, null, 2));
  } else {
    console.log("Not found.");
  }
}
