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
    disable: false,
    backendUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
  },
  modules: [
    {
      resolve: "./src/modules/welfare-catalog",
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
              searchableAttributes: ["title", "description", "variant_sku"],
              displayedAttributes: ["id", "title", "description", "variant_sku", "thumbnail", "handle", "price"],
            },
            primaryKey: "id",
            transformer: (product) => {
              const brand = product.collection?.title;
              const formattedTitle = brand ? `${brand} - ${product.title}` : product.title;
              return {
                id: product.id,
                title: formattedTitle,
                description: product.description,
                thumbnail: product.thumbnail,
                handle: product.handle,
              };
            },
          },
        },
      },
    },
  ],
});
