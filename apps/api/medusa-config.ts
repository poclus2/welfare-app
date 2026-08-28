import { loadEnv, defineConfig } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:3000",
      adminCors: process.env.ADMIN_CORS || "http://localhost:3001",
      authCors: process.env.AUTH_CORS || "http://localhost:3000,http://localhost:3001",
      jwtSecret: process.env.JWT_SECRET || "welfare_jwt_super_secret_change_in_prod",
      cookieSecret: process.env.COOKIE_SECRET || "welfare_cookie_super_secret_change_in_prod",
    },
  },
  admin: {
    disable: process.env.NODE_ENV === "production",
    backendUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
  },
  modules: [
    {
      resolve: './src/modules/welfare_delivery',
    },
    {
      resolve: "./src/modules/welfare-catalog",
    },
    {
      resolve: "@medusajs/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/pawapay",
            id: "pawapay",
            options: {},
          },
        ],
      },
    },
    {
      resolve: "@medusajs/fulfillment",
      options: {
        providers: [
          {
            resolve: "@medusajs/fulfillment-manual",
            id: "manual",
          },
          {
            resolve: "./src/modules/welfare_delivery_provider",
            id: "welfare-delivery-provider",
          }
        ],
      },
    },
    {
      resolve: "@rokmohar/medusa-plugin-meilisearch",
      options: {
        config: {
          host: process.env.MEILISEARCH_HOST || "http://localhost:7700",
          apiKey: process.env.MEILISEARCH_API_KEY || "meilisearch_super_secret",
        },
        settings: {
          products: {
            indexSettings: {
              searchableAttributes: ["title", "description", "variant_sku", "subtitle"],
              displayedAttributes: ["id", "title", "description", "subtitle", "variant_sku", "thumbnail", "handle", "price"],
            },
            primaryKey: "id",
            transformer: (product) => {
              const brand = product.collection?.title;
              const formattedTitle = brand ? `${brand} - ${product.title}` : product.title;
              return {
                id: product.id,
                title: formattedTitle,
                subtitle: product.subtitle,
                description: product.description,
                thumbnail: product.thumbnail,
                handle: product.handle,
              };
            },
          },
        },
      },
    },
    {
      resolve: "./src/modules/skin_scan",
    },
  ],
});
