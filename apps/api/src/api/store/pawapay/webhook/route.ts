import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const payload = req.body;
    console.log("[PawaPay Webhook] Received payload:", payload);

    // TODO: Verify PawaPay signature or token if provided in headers

    // Assuming PawaPay payload contains something like:
    // { depositId: "...", status: "COMPLETED" | "FAILED", ... }

    // We need to complete the cart/order using the Medusa API
    // Actually, payment webhooks in Medusa v2 typically call the payment module
    // or complete the cart if the payment is fully captured.
    
    // For now, return 200 OK so PawaPay knows we received it.
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("[PawaPay Webhook] Error:", error.message);
    res.status(400).json({ error: "Webhook error" });
  }
}
