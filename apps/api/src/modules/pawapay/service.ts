// @ts-nocheck
import { AbstractPaymentProvider } from "@medusajs/framework/utils"
import { PaymentSessionStatus } from "@medusajs/utils"

class PawapayProviderService extends AbstractPaymentProvider {
  static identifier = "pawapay"
  
  constructor(container: any, options: any) {
    super(container, options)
  }

  async initiatePayment(input: any): Promise<any> {
    return {
      id: "session_pawapay_" + Date.now(),
      status: "pending",
    }
  }

  async updatePayment(input: any): Promise<any> {
    return this.initiatePayment(input)
  }

  async getPaymentStatus(input: any): Promise<PaymentSessionStatus> {
    const status = input.data?.status as string;
    if (status === "captured") return PaymentSessionStatus.CAPTURED;
    if (status === "canceled") return PaymentSessionStatus.CANCELED;
    return PaymentSessionStatus.PENDING
  }

  async authorizePayment(input: any): Promise<any> {
    return {
      status: PaymentSessionStatus.PENDING,
      data: {
        ...input.data,
        status: "pending"
      },
    }
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

  async deletePayment(input: any): Promise<void> {
    return
  }

  async retrievePayment(input: any): Promise<any> {
    return input
  }

  async getWebhookActionAndData(payload: any): Promise<any> {
    return { action: "not_supported", data: payload.data }
  }
}

export default PawapayProviderService
