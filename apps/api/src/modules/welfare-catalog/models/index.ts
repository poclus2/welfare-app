import { model } from "@medusajs/framework/utils";

// 1. Product Metadata (Detailed instructions & full ingredients)
export const ProductMetadata = model.define("product_metadata", {
  id: model.id().primaryKey(),
  usage_instructions: model.text().nullable(),
  precautions: model.text().nullable(),
  inci_ingredients: model.text().nullable(),
});

// 2. Active Ingredient (Core ingredients with explanations)
export const ActiveIngredient = model.define("active_ingredient", {
  id: model.id().primaryKey(),
  name: model.text().unique(), // e.g., "Niacinamide"
  description: model.text().nullable(), // Explanation of benefits
});

// 3. Skin Profile (Targeting info)
export const SkinProfile = model.define("skin_profile", {
  id: model.id().primaryKey(),
  // E.g., ["DRY", "OILY", "COMBINATION", "NORMAL", "SENSITIVE"]
  skin_types: model.array().nullable(), 
  // E.g., ["ACNE", "AGING", "PIGMENTATION", "REDNESS"]
  skin_concerns: model.array().nullable(),
});

// 4. Product Compatibility (For the future Recommendation Engine / AI)
export const ProductCompatibility = model.define("product_compatibility", {
  id: model.id().primaryKey(),
  // In Medusa v2 links are used to connect to core models, but here we can 
  // define the relation between two product IDs directly as text for simplicity
  // or use the Links API later.
  source_product_id: model.text(),
  target_product_id: model.text(),
  type: model.enum(["COMPLEMENTARY", "INCOMPATIBLE"]),
  reason: model.text().nullable(), // e.g., "Retinol and strong acids cause irritation"
});
