import { authenticate, defineMiddlewares } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      // 3 face photos as base64 (the storefront server action posts them): big, but capped
      matcher: "/store/skin-scans",
      method: ["POST"],
      bodyParser: {
        sizeLimit: "25mb",
      },
    },
    {
      matcher: "/store/skin-scans",
      method: ["GET"],
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/customers/me/email",
      method: ["POST"],
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    // A creator's dashboard: only her own figures, found from her customer account
    ...["/store/creator/me", "/store/creator/history", "/store/creator/rank"].map((matcher) => ({
      matcher,
      method: ["GET"] as any,
      middlewares: [authenticate("customer", ["session", "bearer"])],
    })),
    {
      matcher: "/store/skin-scans/:id/claim",
      method: ["POST"],
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
  ],
})
