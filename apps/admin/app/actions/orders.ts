"use server";

import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";
import { revalidatePath } from "next/cache";

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

export async function refundPaymentAction(paymentId: string, orderId: string, amount: number, reason: string) {
  const token = await getToken();
  try {
    await fetchAdmin(`/payments/${paymentId}/refund`, token, { 
      method: "POST", 
      body: JSON.stringify({ amount, reason }) 
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
          tracking_url: `https://thewelfare.store/track/${trackingNumber}`,
          label_url: `https://thewelfare.store`
        }] : []
      }) 
    });
    revalidatePath(`/dashboard/orders/${orderId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
