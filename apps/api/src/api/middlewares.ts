import { authenticate, defineMiddlewares, MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { depositTokenMatches } from "../modules/pawapay/client"
import { taraTokenMatches } from "../modules/tara/client"

// A Mobile Money cart only completes with a deposit created for THIS cart (see signDepositForCart):
// otherwise one paid deposit could be replayed to pay other carts. Tara payments also sign the amount
// requested, since Tara never reports the amount paid (see signTaraPaymentForCart).
async function requireDepositOfThisCart(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "cart",
      fields: ["id", "payment_collection.payment_sessions.provider_id", "payment_collection.payment_sessions.data"],
      filters: { id: req.params.id },
    })
    const sessions: any[] = (data[0] as any)?.payment_collection?.payment_sessions || []
    const forged = sessions.some(
      (s) =>
        (s?.provider_id === "pp_pawapay_pawapay" && !depositTokenMatches(s.data?.depositId, req.params.id, s.data?.deposit_token)) ||
        (s?.provider_id === "pp_tara_tara" && !taraTokenMatches(s.data?.taraPaymentId, req.params.id, s.data?.amount_requested, s.data?.tara_token))
    )
    if (forged) {
      res.status(400).json({ type: "invalid_data", message: "Ce paiement Mobile Money ne correspond pas à ce panier." })
      return
    }
    next()
  } catch (e) {
    next(e)
  }
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/carts/:id/complete",
      method: ["POST"],
      middlewares: [requireDepositOfThisCart],
    },
    {
      // 3 face photos as base64 (the storefront server action posts them): big, but capped
      matcher: "/store/skin-scans",
      method: ["POST"],
      bodyParser: {
        sizeLimit: "25mb",
      },
      // the storefront forwards the customer's login when she has one, to keep her usual skin advisor
      middlewares: [authenticate("customer", ["bearer"], { allowUnauthenticated: true })],
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
    {
      matcher: "/store/skin-scans/:id/advisor",
      method: ["GET"],
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/skin-scans/:id/face",
      method: ["GET"],
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
  ],
})
