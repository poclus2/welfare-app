import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import WelfareCatalogModule from "../modules/welfare-catalog";

// Link Product to ProductMetadata (1 to 1)
export const ProductMetadataLink = defineLink(
  ProductModule.linkable.product,
  {
    linkable: WelfareCatalogModule.linkable.productMetadata,
    isList: false, // 1 metadata per product
  }
);

// Link Product to SkinProfile (1 to 1)
export const ProductSkinProfileLink = defineLink(
  ProductModule.linkable.product,
  {
    linkable: WelfareCatalogModule.linkable.skinProfile,
    isList: false, // 1 profile per product
  }
);

// Link Product to ActiveIngredient (Many to Many)
// One product can have many active ingredients, one ingredient can belong to many products.
export const ProductActiveIngredientLink = defineLink(
  ProductModule.linkable.product,
  {
    linkable: WelfareCatalogModule.linkable.activeIngredient,
    isList: true,
  }
);
