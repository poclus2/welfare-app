import { AbstractPaymentProvider } from "@medusajs/framework/utils"
import { describePawapayFailure, getDeposit, isValidDepositId } from "./client"

const PaymentSessionStatus = {
  AUTHORIZED: "authorized",
  PENDING: "pending",
  REQUIRES_MORE: "requires_more",
  ERROR: "error",
  CANCELED: "canceled",
  CAPTURED: "captured",
}

class PawapayProviderService extends AbstractPaymentProvider {
  static identifier = "pawapay"
  
  constructor(container: any, options: any) {
    super(container, options)
  }

  async initiatePayment(input: any): Promise<any> {
    // The Mobile Money push is sent beforehand by POST /store/pawapay/deposit.
    // Here we only remember which deposit belongs to this session and the amount Medusa expects.
    return {
      id: "session_pawapay_" + Date.now(),
      data: {
        ...input.data,
        expected_amount: Number(input.amount),
        status: "pending"
      }
    }
  }

  async updatePayment(input: any): Promise<any> {
    return {
      id: input.sessionData?.id || "session_pawapay_" + Date.now(),
      data: {
        ...(input.sessionData || {}),
        ...input.data,
        ...(input.amount !== undefined ? { expected_amount: Number(input.amount) } : {}),
        status: "pending"
      }
    }
  }

  async getPaymentStatus(input: any): Promise<any> {
    const status = input.data?.status as string;
    if (status === "captured") return { status: PaymentSessionStatus.CAPTURED };
    if (status === "authorized" || status === "COMPLETED") return { status: PaymentSessionStatus.AUTHORIZED };
    if (status === "canceled" || status === "FAILED") return { status: PaymentSessionStatus.CANCELED };
    return { status: PaymentSessionStatus.PENDING }
  }

  async authorizePayment(input: any): Promise<any> {
    const data = input.data || {};
    const depositId = data.depositId;

    if (!isValidDepositId(depositId)) {
      throw new Error("Paiement Mobile Money introuvable : aucun dépôt PawaPay valide n'est associé à cette commande.");
    }

    const deposit = await getDeposit(depositId);
    if (!deposit) {
      return { status: PaymentSessionStatus.PENDING, data: { ...data, status: "pending" } };
    }

    if (deposit.status === "FAILED") {
      throw new Error(describePawapayFailure(deposit.failureReason?.failureCode, deposit.failureReason?.failureMessage));
    }

    if (deposit.status !== "COMPLETED") {
      // ACCEPTED / SUBMITTED / ENQUEUED: customer has not confirmed yet
      return { status: PaymentSessionStatus.PENDING, data: { ...data, pawapay_deposit: deposit, status: "pending" } };
    }

    const paid = Number(deposit.depositedAmount ?? deposit.requestedAmount ?? 0);
    const expected = Number(data.expected_amount ?? 0);
    if (expected > 0 && paid < expected) {
      throw new Error(`Montant Mobile Money insuffisant (${paid} payé, ${expected} attendu).`);
    }

    return {
      status: PaymentSessionStatus.AUTHORIZED,
      data: { ...data, pawapay_deposit: deposit, status: "authorized" },
    };
  }

  async capturePayment(input: any): Promise<any> {
    return {
      status: PaymentSessionStatus.CAPTURED,
      data: {
        ...input.data,
        status: "captured"
      },
    }
  }

  async refundPayment(input: any): Promise<any> {
    return {
      status: PaymentSessionStatus.CAPTURED,
      data: input.data,
    }
  }

  async cancelPayment(input: any): Promise<any> {
    return {
      status: PaymentSessionStatus.CANCELED,
      data: {
        ...input.data,
        status: "canceled"
      },
    }
  }

  async deletePayment(input: any): Promise<Record<string, unknown>> {
    return {}
  }

  async retrievePayment(input: any): Promise<any> {
    return input.data
  }

  async getWebhookActionAndData(payload: any): Promise<any> {
    // Handle PawaPay webhook (e.g. status changes to COMPLETED or FAILED)
    const { depositId, status } = payload.data || {};
    
    if (status === "COMPLETED") {
      return {
        action: "captured",
        data: payload.data
      }
    } else if (status === "FAILED") {
      return {
        action: "failed",
        data: payload.data
      }
    }
    
    return { action: "not_supported", data: payload.data }
  }
}

export default PawapayProviderService
