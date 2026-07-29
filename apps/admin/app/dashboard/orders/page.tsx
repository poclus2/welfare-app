import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";
import OrdersClient from "./OrdersClient";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) return null;

  const data = await fetchAdmin<{ orders: any[]; count: number }>(
    `/orders?expand=customer,shipping_address,payment_collections,items,shipping_methods&limit=50`,
    token
  ).catch((e) => {
    console.error("Failed to fetch orders", e);
    return { orders: [], count: 0 };
  });

  // Map Medusa orders to UI orders
  const mappedOrders = data.orders.map((o) => {
    // Determine payment provider
    let payment = o.payment_collections?.[0]?.payments?.[0]?.provider_id || "Non spécifié";
    if (payment === "pawapay") payment = "Mobile Money (PawaPay)";

    // Delivery metadata handling
    let delivery = "domicile";
    let store = null;
    const deliveryMode = o.metadata?.delivery_mode;
    
    if (deliveryMode === "retrait" || o.shipping_address?.address_1?.includes("Retrait")) {
      delivery = "retrait";
      if (o.shipping_address?.address_1?.toLowerCase().includes("hippodrome")) store = "hippodrome";
      if (o.shipping_address?.address_1?.toLowerCase().includes("playce")) store = "playce";
    }

    // Determine Status
    let status = "pending_payment";
    if (o.payment_status === "captured" || o.payment_status === "paid") {
      status = "paid";
    }
    if (o.status === "completed") {
      status = "delivered";
    } else if (o.status === "canceled") {
      status = "cancelled";
    } else if (o.fulfillment_status === "shipped") {
      status = "shipped";
    }

    // Determine Phone
    const phone = o.shipping_address?.phone || o.customer?.phone || "Non renseigné";
    
    // Address
    const address = o.shipping_address?.address_1 || null;

    // Items count
    const itemsCount = o.items?.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0) || 0;

    // Format date
    const date = new Date(o.created_at).toLocaleString("fr-FR", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });

    return {
      id: `WLF-${o.display_id || o.id.split('_')[1].substring(0, 5).toUpperCase()}`,
      rawId: o.id,
      customer: o.customer ? `${o.customer.first_name || ""} ${o.customer.last_name || ""}`.trim() : "Client Inconnu",
      phone,
      items: itemsCount,
      amount: o.total || 0,
      payment,
      delivery,
      store,
      status,
      date,
      address,
    };
  });

  return <OrdersClient initialOrders={mappedOrders} totalCount={data.count} />;
}
