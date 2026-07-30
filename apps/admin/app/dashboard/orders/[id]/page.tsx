import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";
import OrderDetailClient from "./OrderDetailClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) return redirect("/login");

  const { id } = await params;

  // Fetch the specific order
  const data = await fetchAdmin<{ order: any }>(
    `/orders/${id}?fields=*customer,*shipping_address,*payment_collections,*items,*shipping_methods`,
    token
  ).catch((e) => {
    console.error(`Failed to fetch order ${id}`, e);
    return { order: null };
  });

  const o = data.order;
  if (!o) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center h-[50vh]">
        <h1 className="text-2xl font-bold text-[#2A2424] mb-2">Commande introuvable</h1>
        <p className="text-[#2A2424]/50">Cette commande n'existe pas ou vous n'y avez pas accès.</p>
      </div>
    );
  }

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

  // Customer Name
  let customerName = "Client Inconnu";
  if (o.shipping_address?.first_name || o.shipping_address?.last_name) {
    customerName = `${o.shipping_address.first_name || ""} ${o.shipping_address.last_name || ""}`.trim();
  } else if (o.customer?.first_name || o.customer?.last_name) {
    customerName = `${o.customer.first_name || ""} ${o.customer.last_name || ""}`.trim();
  }

  const mappedOrder = {
    id: `WLF-${o.display_id || o.id.split('_')[1].substring(0, 5).toUpperCase()}`,
    rawId: o.id,
    customer: customerName,
    phone,
    items: itemsCount,
    itemsList: o.items || [],
    amount: o.total || 0,
    payment,
    delivery,
    store,
    status,
    date,
    address,
  };

  return <OrderDetailClient order={mappedOrder} />;
}
