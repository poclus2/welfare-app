import { AbstractPaymentProvider } from "@medusajs/framework/utils"
import { PaymentSessionStatus } from "@medusajs/utils"
import crypto from "crypto"

class PawapayProviderService extends AbstractPaymentProvider {
  static identifier = "pawapay"
  
  constructor(container: any, options: any) {
    super(container, options)
  }

  async initiatePayment(input: any): Promise<any> {
    // input contains: amount, currency_code, context, data
    // We just return a pending session here. The actual call to PawaPay happens in authorizePayment.
    return {
      id: "session_pawapay_" + Date.now(),
      data: {
        ...input.data,
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
        status: "pending"
      }
    }
  }

  async getPaymentStatus(input: any): Promise<PaymentSessionStatus> {
    const status = input.data?.status as string;
    if (status === "captured" || status === "COMPLETED") return PaymentSessionStatus.CAPTURED;
    if (status === "canceled" || status === "FAILED") return PaymentSessionStatus.CANCELED;
    return PaymentSessionStatus.PENDING
  }

  async authorizePayment(input: any): Promise<any> {
    const token = process.env.PAWAPAY_API_KEY;
    if (!token) {
      throw new Error("PawaPay API token is not configured in PAWAPAY_API_KEY");
    }

    const frontendData = input.data || {};
    
    // Ensure amount is a string. If the frontend passed a number or it was converted, stringify it.
    // If the frontend didn't pass it, fallback to Medusa's input.amount.
    let amountString = "";
    if (frontendData.amount) {
      amountString = String(frontendData.amount);
    } else {
      amountString = String(input.amount);
    }

    const payload = {
      depositId: frontendData.depositId || crypto.randomUUID(),
      amount: amountString,
      currency: (frontendData.currency || input.currency_code || "XAF").toUpperCase(),
      correspondent: frontendData.correspondent || "MTN_MOMO_CMR",
      payer: frontendData.payer || {
        type: "MSISDN",
        address: { value: "237651702809" } // Fallback
      },
      customerTimestamp: new Date().toISOString(),
      statementDescription: frontendData.statementDescription || "The Welfare Shop"
    };

    try {
      const response = await fetch("https://api.pawapay.cloud/v1/deposits", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`PawaPay API error: ${response.status} - ${JSON.stringify(data)}`);
      }

      // PawaPay returns 200 OK with status ACCEPTED or similar when push is sent
      return {
        status: PaymentSessionStatus.PENDING,
        data: {
          ...frontendData,
          pawapay_response: data,
          status: "pending"
        },
      }
    } catch (error: any) {
      throw new Error(`PawaPay initiation failed: ${error.message}`);
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
