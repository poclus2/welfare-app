// What the customer's order pages show, derived from the order's real data.
//
// Medusa has no `shipped` order status: delivery lives on the order's fulfillments (shipped_at /
// delivered_at / canceled_at). The pages used to test `order.status === "shipped"` (never true) and
// to print fixed texts (payment "CB", free delivery, samples, a made-up tracking number...).

// Fields to request: the default list of GET /store/orders carries the items and the two status fields,
// but no address, shipping method, fulfillments or itemised totals.
export const ORDER_FIELDS = [
  "id",
  "display_id",
  "status",
  "currency_code",
  "total",
  "item_subtotal", // items only: Medusa's `subtotal` also includes the shipping
  "payment_status",
  "fulfillment_status",
  "discount_total",
  "shipping_total",
  "created_at",
  "email",
  "*items",
  "*shipping_address",
  "*shipping_methods",
  "*fulfillments",
  "*payment_collections",
  "*payment_collections.payments",
].join(",");

export type OrderStage = "validated" | "prepared" | "shipped" | "delivered" | "canceled";

export const STAGE_INDEX: Record<Exclude<OrderStage, "canceled">, number> = {
  validated: 0,
  prepared: 1,
  shipped: 2,
  delivered: 3,
};

export function getOrderStage(order: any): OrderStage {
  if (order?.status === "canceled") return "canceled";
  switch (order?.fulfillment_status) {
    case "delivered":
      return "delivered";
    case "shipped":
    case "partially_shipped":
    case "partially_delivered":
      return order?.status === "completed" ? "delivered" : "shipped";
    case "fulfilled":
    case "partially_fulfilled":
      return order?.status === "completed" ? "delivered" : "prepared";
    case "not_fulfilled":
      return order?.status === "completed" ? "delivered" : "validated";
  }
  // field not returned: read the fulfillments themselves
  const active = (order?.fulfillments || []).filter((f: any) => !f.canceled_at);
  if (order?.status === "completed" || (active.length > 0 && active.every((f: any) => f.delivered_at))) return "delivered";
  if (active.some((f: any) => f.shipped_at)) return "shipped";
  if (active.length > 0) return "prepared";
  return "validated";
}

/** Tracking number entered by the team when the parcel was handed over (none: nothing is shown). */
export function getTrackingNumber(order: any): string | null {
  for (const f of order?.fulfillments || []) {
    const n = f?.labels?.find((l: any) => l?.tracking_number)?.tracking_number;
    if (n) return String(n);
  }
  return null;
}

export function getPaymentInfo(order: any): { method: "mobile_money" | "cash" | "other"; paid: boolean } {
  const payments = (order?.payment_collections || []).flatMap((pc: any) => pc?.payments || []);
  const provider = String(payments[0]?.provider_id || "");
  const method = provider.includes("pawapay") ? "mobile_money" : provider.includes("system") ? "cash" : "other";
  // a payment is "paid" once it has been captured
  const paid =
    order?.payment_status != null
      ? order.payment_status === "captured"
      : payments.some((p: any) => p?.captured_at) ||
        (order?.payment_collections || []).some((pc: any) => pc?.status === "completed");
  return { method, paid };
}

export function getShippingInfo(order: any): { name: string; total: number } {
  const name = order?.shipping_methods?.[0]?.name || "";
  return { name, total: Number(order?.shipping_total) || 0 };
}

export function orderCode(displayId: number) {
  return `#WF-${String(displayId).padStart(4, "0")}`;
}

export function formatPrice(amount: number, currencyCode: string) {
  const noDecimal = ["xaf", "xof", "jpy", "krw"].includes(currencyCode?.toLowerCase());
  const value = noDecimal ? amount : amount / 100;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: currencyCode || "XAF" }).format(value);
}
