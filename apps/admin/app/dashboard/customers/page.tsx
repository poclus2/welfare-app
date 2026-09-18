import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";
import CustomersClient, { Customer } from "./CustomersClient";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) return null;

  // Fetch customers and orders in parallel
  const [customersData, ordersData] = await Promise.all([
    fetchAdmin<{ customers: any[]; count: number }>(`/customers?limit=100`, token).catch(() => ({ customers: [], count: 0 })),
    fetchAdmin<{ orders: any[] }>(`/orders?limit=999`, token).catch(() => ({ orders: [] }))
  ]);

  const ordersByCustomer: Record<string, any[]> = {};
  ordersData.orders.forEach(o => {
    if (o.customer_id) {
      if (!ordersByCustomer[o.customer_id]) ordersByCustomer[o.customer_id] = [];
      ordersByCustomer[o.customer_id].push(o);
    }
  });

  // Map Medusa customers to UI customers
  const mappedCustomers: Customer[] = customersData.customers.map((c) => {
    const customerOrders = ordersByCustomer[c.id] || [];
    const ordersCount = customerOrders.length;
    
    // Calculate total spent
    const totalSpent = customerOrders.reduce((acc: number, o: any) => acc + (o.total || 0), 0) || 0;

    // Map recent orders for the drawer
    const recentOrders = customerOrders
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
          id: `WLF-${o.display_id || o.id.split('_')[1]?.substring(0, 5).toUpperCase() || 'XXX'}`,
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
    } else if (customerOrders[0]?.shipping_address?.first_name || customerOrders[0]?.shipping_address?.last_name) {
      const sa = customerOrders[0].shipping_address;
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

  return <CustomersClient initialCustomers={mappedCustomers} totalCount={customersData.count} />;
}
