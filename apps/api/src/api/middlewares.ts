import { defineMiddlewares } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/skin-scans",
      method: ["POST"],
      bodyParser: {
        sizeLimit: "50mb",
      },
    },
  ],
})
