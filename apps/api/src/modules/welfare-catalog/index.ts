import { Module } from "@medusajs/framework/utils";
import * as models from "./models";

export const WELFARE_CATALOG_MODULE = "welfareCatalog";

export default Module(WELFARE_CATALOG_MODULE, {
  service: class WelfareCatalogService {}, // Empty service for now, Medusa auto-generates CRUD methods
  models,
});
