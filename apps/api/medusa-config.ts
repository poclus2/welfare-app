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
      // Product photos uploaded from the admin (POST /admin/uploads) are stored in ./static, which is
      // already served at <backend>/static and kept in the welfare-static volume. Without backend_url the
      // provider returns http://localhost:9000/static/... URLs, unreachable from the shop.
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: {
              backend_url: `${(process.env.MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/+$/, "")}/static`,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/auth",
      options: {
        providers: [
          {
            resolve: "@medusajs/auth-emailpass",
            id: "emailpass",
          },
          {
            resolve: "./src/modules/phonepass",
            id: "phonepass",
          },
          {
            resolve: "./src/modules/phoneotp",
            id: "phoneotp",
          },
        ],
      },
    },
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
          {
            resolve: "./src/modules/tara",
            id: "tara",
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
        // No index settings here: the plugin re-applied these at every start, over the real ones. The products
        // index (documents, searchable fields, synonyms) is managed by src/lib/meili-products.ts.
        settings: {},
      },
    },
    {
      resolve: "./src/modules/skin_scan",
    },
    {
      resolve: "./src/modules/search_analytics",
    },
    {
      resolve: "./src/modules/ambassador_application",
    },
    {
      resolve: "./src/modules/creator_partner",
    },
    {
      resolve: "./src/modules/otp",
    },
    {
      resolve: "./src/modules/site_content",
    },
  ],
});
