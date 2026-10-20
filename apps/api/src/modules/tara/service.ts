import { AbstractPaymentProvider } from "@medusajs/framework/utils"
import { describeTaraFailure, getTaraPaymentStatus, isValidTaraPaymentId } from "./client"

const PaymentSessionStatus = {
  AUTHORIZED: "authorized",
  PENDING: "pending",
  ERROR: "error",
  CANCELED: "canceled",
  CAPTURED: "captured",
}

/**
 * MTN and Orange Mobile Money (Cameroon) through Tara Money. Same flow as the PawaPay provider: the push is sent beforehand
 * by POST /store/tara/mobilepay, and the order is only created once Tara reports the payment as SUCCESS.
 * Session data: { taraPaymentId, amount_requested, tara_token } — the token (checked by the
 * /store/carts/:id/complete middleware) proves we requested that amount for that cart.
 */
class TaraProviderService extends AbstractPaymentProvider {
  static identifier = "tara"

  constructor(container: any, options: any) {
    super(container, options)
  }

  async initiatePayment(input: any): Promise<any> {
    return {
      id: "session_tara_" + Date.now(),
      data: { ...input.data, expected_amount: Number(input.amount), status: "pending" },
    }
  }

  async updatePayment(input: any): Promise<any> {
    return {
      id: input.sessionData?.id || "session_tara_" + Date.now(),
      data: {
        ...(input.sessionData || {}),
        ...input.data,
        ...(input.amount !== undefined ? { expected_amount: Number(input.amount) } : {}),
        status: "pending",
      },
    }
  }

  async getPaymentStatus(input: any): Promise<any> {
    const status = input.data?.status as string
    if (status === "captured") return { status: PaymentSessionStatus.CAPTURED }
    if (status === "authorized") return { status: PaymentSessionStatus.AUTHORIZED }
    if (status === "canceled") return { status: PaymentSessionStatus.CANCELED }
    return { status: PaymentSessionStatus.PENDING }
  }

  async authorizePayment(input: any): Promise<any> {
    const data = input.data || {}
    const paymentId = data.taraPaymentId

    if (!isValidTaraPaymentId(paymentId)) {
      throw new Error("Paiement Mobile Money introuvable : aucun paiement valide n'est associé à cette commande.")
    }

    const { status, message } = await getTaraPaymentStatus(paymentId)
    if (status === "FAILURE") throw new Error(describeTaraFailure(message))
    if (status !== "SUCCESS") {
      return { status: PaymentSessionStatus.PENDING, data: { ...data, tara_status: status, status: "pending" } }
    }

    // Tara never reports the amount paid: amount_requested is the one we pushed, signed with the cart
    // (verified by the complete-cart middleware), so it is what the customer approved on their phone.
    const paid = Number(data.amount_requested ?? 0)
    const expected = Number(data.expected_amount ?? 0)
    if (!(paid > 0) || (expected > 0 && paid < expected)) {
      throw new Error(`Montant Mobile Money insuffisant (${paid} payé, ${expected} attendu).`)
    }

    return {
      status: PaymentSessionStatus.CAPTURED,
      data: {
        ...data,
        tara_status: status,
        amount_charged: paid,
        mobile_money_fee: expected > 0 ? Math.max(0, paid - expected) : undefined,
        status: "captured",
      },
    }
  }

  async capturePayment(input: any): Promise<any> {
    return { status: PaymentSessionStatus.CAPTURED, data: { ...input.data, status: "captured" } }
  }

  async refundPayment(input: any): Promise<any> {
    return { status: PaymentSessionStatus.CAPTURED, data: input.data }
  }

  async cancelPayment(input: any): Promise<any> {
    return { status: PaymentSessionStatus.CANCELED, data: { ...input.data, status: "canceled" } }
  }

  async deletePayment(input: any): Promise<Record<string, unknown>> {
    return {}
  }

  async retrievePayment(input: any): Promise<any> {
    return input.data
  }

  async getWebhookActionAndData(payload: any): Promise<any> {
    // Tara's Mobile Money webhook cannot be matched to a session (no productId): status is polled instead
    return { action: "not_supported", data: payload?.data }
  }
}

export default TaraProviderService
