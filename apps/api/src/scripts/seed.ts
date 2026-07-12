import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import seedData from "./seed-data.json";

export default async function seed({ container }: ExecArgs) {
  const productService = container.resolve(Modules.PRODUCT);
  const welfareCatalogService = container.resolve("welfareCatalog");
  const remoteLink = container.resolve("remoteLink");

  console.log("Starting DB Seed for Welfare Catalog...");

  // Mapping from handle to Medusa product ID for phase 2 (Compatibilities)
  const productMap: Record<string, string> = {};

  // --- Phase 1: Create Products and their metadata ---
  for (const item of seedData) {
    // 1. Create Core Product
    const [product] = await productService.createProducts([
      {
        title: item.title,
        handle: item.handle,
        options: [{ title: "Default Option" }],
      },
    ]);

    console.log(`Created product: ${product.title}`);
    productMap[item.handle] = product.id;

    // 2. Create ProductMetadata
    const metadata = await welfareCatalogService.createProductMetadatas([
      {
        usage_instructions: item.metadata.usage_instructions,
        precautions: item.metadata.precautions,
        inci_ingredients: item.metadata.inci_ingredients,
      },
    ]);

    // Link Product <-> ProductMetadata
    await remoteLink.create([
      {
        [Modules.PRODUCT]: {
          product_id: product.id,
        },
        "welfareCatalog": {
          product_metadata_id: metadata[0].id,
        },
      },
    ]);

    // 3. Create SkinProfile
    const profile = await welfareCatalogService.createSkinProfiles([
      {
        skin_types: item.skin_profile.skin_types,
        skin_concerns: item.skin_profile.skin_concerns,
      },
    ]);

    // Link Product <-> SkinProfile
    await remoteLink.create([
      {
        [Modules.PRODUCT]: {
          product_id: product.id,
        },
        "welfareCatalog": {
          skin_profile_id: profile[0].id,
        },
      },
    ]);

    // 4. Create or Link ActiveIngredients
    for (const ai of item.active_ingredients) {
      // Create ingredient (simplified logic: just create it)
      const ingredient = await welfareCatalogService.createActiveIngredients([
        {
          name: ai.name,
          description: ai.description,
        },
      ]);

      // Link Product <-> ActiveIngredient
      await remoteLink.create([
        {
          [Modules.PRODUCT]: {
            product_id: product.id,
          },
          "welfareCatalog": {
            active_ingredient_id: ingredient[0].id,
          },
        },
      ]);
    }
  }

  // --- Phase 2: Setup Product Compatibilities ---
  console.log("Setting up product compatibilities...");
  for (const item of seedData) {
    if (item.compatibilities && item.compatibilities.length > 0) {
      const sourceId = productMap[item.handle];

      for (const comp of item.compatibilities) {
        const targetId = productMap[comp.target_handle];

        if (sourceId && targetId) {
          await welfareCatalogService.createProductCompatibilities([
            {
              source_product_id: sourceId,
              target_product_id: targetId,
              type: comp.type,
              reason: comp.reason,
            },
          ]);
          console.log(`Linked ${item.handle} -> ${comp.target_handle} (${comp.type})`);
        }
      }
    }
  }

  console.log("✅ Seed completed successfully!");
}
