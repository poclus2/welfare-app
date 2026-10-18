"use server";

import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";
import { revalidatePath } from "next/cache";

const SHOP_URL = (process.env.NEXT_PUBLIC_SHOP_URL || "https://thewelfarecm.com").replace(/\/+$/, "");

async function getToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) throw new Error("Non autorisé : Veuillez vous reconnecter.");
  return token;
}

export async function capturePaymentAction(paymentId: string, orderId: string) {
  const token = await getToken();
  try {
    await fetchAdmin(`/payments/${paymentId}/capture`, token, { method: "POST", body: JSON.stringify({}) });
    revalidatePath(`/dashboard/orders/${orderId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function refundPaymentAction(paymentId: string, orderId: string, amount: number, note: string) {
  const token = await getToken();
  try {
    // Medusa's refund schema is { amount, refund_reason_id?, note? } — there is
    // no "reason" field, so passing one here was silently dropped and the
    // admin's refund note never actually got saved.
    await fetchAdmin(`/payments/${paymentId}/refund`, token, {
      method: "POST",
      body: JSON.stringify({ amount, note })
    });
    revalidatePath(`/dashboard/orders/${orderId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addInternalNoteAction(orderId: string, notes: any[]) {
  const token = await getToken();
  try {
    await fetchAdmin(`/orders/${orderId}`, token, { 
      method: "POST", 
      body: JSON.stringify({ metadata: { internal_notes: notes } }) 
    });
    revalidatePath(`/dashboard/orders/${orderId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createFulfillmentAction(orderId: string, items: { id: string; quantity: number }[]) {
  const token = await getToken();
  try {
    await fetchAdmin(`/orders/${orderId}/fulfillments`, token, { 
      method: "POST", 
      body: JSON.stringify({ items, location_id: null }) // In Medusa v2, location_id might be needed, we can let the backend default it if null, or omit it. Let's omit location_id.
    });
    revalidatePath(`/dashboard/orders/${orderId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createShipmentAction(orderId: string, fulfillmentId: string, trackingNumber: string, carrier: string) {
  const token = await getToken();
  try {
    await fetchAdmin(`/orders/${orderId}/fulfillments/${fulfillmentId}/shipments`, token, { 
      method: "POST", 
      body: JSON.stringify({
        items: [], // usually all items in fulfillment
        labels: trackingNumber ? [{ 
          tracking_number: trackingNumber, 
          // the shop has no tracking page: customers follow their orders in their account
          tracking_url: `${SHOP_URL}/account`,
          label_url: SHOP_URL
        }] : []
      }) 
    });
    revalidatePath(`/dashboard/orders/${orderId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Cancels an order that was not fulfilled: Medusa releases its stock reservations (which otherwise block
// e.g. deleting the product), cancels an uncaptured payment and records a refund for a captured one.
// The provider refund is bookkeeping only for PawaPay: no money goes back to the customer automatically.
export async function cancelOrderAction(orderId: string) {
  const token = await getToken();
  try {
    await fetchAdmin(`/orders/${orderId}/cancel`, token, { method: "POST", body: JSON.stringify({}) });
    revalidatePath(`/dashboard/orders/${orderId}`);
    revalidatePath(`/dashboard/orders`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
