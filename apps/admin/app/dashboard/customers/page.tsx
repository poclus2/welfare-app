import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";
import CustomersClient, { Customer } from "./CustomersClient";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) return null;

  const data = await fetchAdmin<{ customers: any[]; count: number }>(
    `/customers?fields=*orders&limit=50`,
    token
  ).catch((e) => {
    console.error("Failed to fetch customers", e);
    return { customers: [], count: 0 };
  });

  // Map Medusa customers to UI customers
  const mappedCustomers: Customer[] = data.customers.map((c) => {
    const ordersCount = c.orders?.length || 0;
    
    // Calculate total spent
    const totalSpent = c.orders?.reduce((acc: number, o: any) => acc + (o.total || 0), 0) || 0;

    // Map recent orders for the drawer
    const recentOrders = (c.orders || [])
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5) // Keep only 5 most recent
      .map((o: any) => {
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

        return {
          id: `WLF-${o.display_id || o.id.split('_')[1].substring(0, 5).toUpperCase()}`,
          amount: o.total || 0,
          status,
          date: new Date(o.created_at).toLocaleString("fr-FR", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
          })
        };
      });

    let customerName = "Client Inconnu";
    if (c.first_name || c.last_name) {
      customerName = `${c.first_name || ""} ${c.last_name || ""}`.trim();
    } else if (c.orders?.[0]?.shipping_address?.first_name || c.orders?.[0]?.shipping_address?.last_name) {
      const sa = c.orders[0].shipping_address;
      customerName = `${sa.first_name || ""} ${sa.last_name || ""}`.trim();
    }

    return {
      id: c.id,
      name: customerName || "Client Inconnu",
      email: c.email || "—",
      phone: c.phone || "—",
      ordersCount,
      totalSpent,
      hasAccount: c.has_account,
      date: new Date(c.created_at).toLocaleString("fr-FR", {
        day: "2-digit", month: "short", year: "numeric"
      }),
      recentOrders,
    };
  });

  return <CustomersClient initialCustomers={mappedCustomers} totalCount={data.count} />;
}
