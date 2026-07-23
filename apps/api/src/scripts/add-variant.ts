import { Modules } from "@medusajs/framework/utils"
import { createProductVariantsWorkflow } from "@medusajs/medusa/core-flows"

export default async function addVariant({ container }) {
  const productModule = container.resolve(Modules.PRODUCT)
  
  const products = await productModule.listProducts({ q: "CKD VITA" }, { relations: ["options"] });
  if (products.length === 0) {
    return console.log("Product not found");
  }

  const prod = products[0];
  console.log("Found product:", prod.title);

  const optionId = prod.options?.[0]?.id;
  if (!optionId) {
    return console.log("Product has no options. Cannot create variant.");
  }

  try {
    const { result } = await createProductVariantsWorkflow(container).run({
      input: {
        product_variants: [
          {
            product_id: prod.id,
            title: "Default Variant",
            manage_inventory: true,
            options: {
              [optionId]: "Default Variant"
            },
            prices: [
              {
                currency_code: "XOF",
                amount: 4000
              }
            ]
          }
        ]
      }
    });
    console.log("Created variant with price 4000 FCFA for product!");
  } catch(e) {
    console.error("Error creating variant:", e.message);
  }
}
