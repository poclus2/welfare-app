import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";
import DashboardClient from "./DashboardClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return redirect("/login");

  const [ordersRes, customersRes, productsRes] = await Promise.all([
    fetchAdmin<{ orders: any[], count: number }>("/orders?limit=1000&expand=customer,items,shipping_methods", token).catch(() => ({ orders: [], count: 0 })),
    fetchAdmin<{ count: number }>("/customers?limit=1", token).catch(() => ({ count: 0 })),
    fetchAdmin<{ products: any[] }>("/products?limit=500&expand=variants,collection", token).catch(() => ({ products: [] })),
  ]);

  const allOrders = ordersRes.orders || [];
  const totalCustomers = customersRes.count || 0;
  const products = productsRes.products || [];

  // 1. KPI Calculations (Ce mois)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let monthlyRevenue = 0;
  let monthlyOrdersCount = 0;

  allOrders.forEach(o => {
    const oDate = new Date(o.created_at);
    if (oDate.getMonth() === currentMonth && oDate.getFullYear() === currentYear) {
      if (o.status !== "canceled" && o.payment_status !== "canceled") {
        monthlyRevenue += o.total || 0;
        monthlyOrdersCount++;
      }
    }
  });

  const aov = monthlyOrdersCount > 0 ? Math.round(monthlyRevenue / monthlyOrdersCount) : 0;

  const kpis = {
    revenue: monthlyRevenue,
    orders: monthlyOrdersCount,
    customers: totalCustomers, // using total customers since Medusa doesn't easily let us filter by date without advanced query
    aov: aov,
  };

  // 2. Sales Data (Area Chart)
  // Group by month
  const salesByMonth = Array(6).fill(0).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      month: d.toLocaleString('fr-FR', { month: 'short' }),
      value: 0,
      m: d.getMonth(),
      y: d.getFullYear()
    };
  });

  allOrders.forEach(o => {
    if (o.status === "canceled") return;
    const oDate = new Date(o.created_at);
    const m = oDate.getMonth();
    const y = oDate.getFullYear();
    const target = salesByMonth.find(x => x.m === m && x.y === y);
    if (target) {
      target.value += o.total || 0;
    }
  });

  // 3. Delivery Breakdown (Pie Chart)
  // Medusa doesn't easily expose the delivery method in basic fields without shipping_methods.
  // We'll extract it from the first shipping method if available, else fallback
  const deliveryCounts: Record<string, number> = {};
  allOrders.forEach(o => {
    // try to get shipping method name, or fallback to generic
    const method = o.shipping_methods?.[0]?.shipping_option?.name || "Standard";
    deliveryCounts[method] = (deliveryCounts[method] || 0) + 1;
  });

  const colors = ["#2A2424", "#C08A8E", "#F4EAEB", "#E5D8D8", "#A47477"];
  const deliveryData = Object.entries(deliveryCounts).map(([name, count], i) => ({
    name,
    value: Math.round((count / Math.max(allOrders.length, 1)) * 100),
    color: colors[i % colors.length]
  }));

  // 4. Urgent Tasks
  const urgentTasks: any[] = [];
  
  // Pending payments
  allOrders.filter(o => o.payment_status === "awaiting" || o.payment_status === "pending").slice(0, 5).forEach(o => {
    urgentTasks.push({
      type: "payment",
      order: `Commande #${o.display_id}`,
      detail: `${o.total} FCFA`,
      color: "bg-amber-100 text-amber-700"
    });
  });

  // Low stock products
  products.forEach(p => {
    const inv = p.variants?.reduce((acc: number, v: any) => acc + (v.inventory_quantity || v.metadata?.stock_total || 0), 0) || 0;
    if (inv > 0 && inv < 5) {
      urgentTasks.push({
        type: "stock",
        order: p.title,
        detail: `${inv} unités restantes`,
        color: "bg-red-100 text-red-600"
      });
    }
  });

  // 5. Recent Orders (Table)
  const recentOrders = allOrders.slice(0, 10).map(o => {
    const itemsCount = o.items?.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0) || 0;
    
    // format time nicely (e.g. "il y a 2h")
    const diff = now.getTime() - new Date(o.created_at).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor(diff / (1000 * 60));
    const timeStr = hours > 24 ? new Date(o.created_at).toLocaleDateString("fr-FR") : hours > 0 ? `il y a ${hours}h` : `il y a ${mins} min`;

    let stat = o.status;
    if (o.payment_status === 'awaiting') stat = 'pending';
    else if (o.fulfillment_status === 'shipped') stat = 'shipped';
    else if (o.fulfillment_status === 'fulfilled') stat = 'ready';
    else if (o.payment_status === 'captured') stat = 'paid';

    return {
      id: `#${o.display_id}`,
      customer: o.customer ? `${o.customer.first_name || ""} ${o.customer.last_name || ""}`.trim() || o.email : o.email,
      items: itemsCount,
      amount: o.total || 0,
      status: stat,
      time: timeStr
    };
  });

  // 6. Top Products
  // Since we don't have sales count per product easily, we'll sort products by something or just return some published products
  // In Medusa you'd have to parse all orders items. Let's do it!
  const productSalesCounts: Record<string, { name: string, brand: string, sold: number }> = {};
  
  allOrders.forEach(o => {
    if (o.status === "canceled") return;
    o.items?.forEach((item: any) => {
      const pId = item.variant?.product_id;
      if (!pId) return;
      if (!productSalesCounts[pId]) {
        productSalesCounts[pId] = {
          name: item.title,
          brand: "Welfare", // Can't easily get brand without expanding products deep
          sold: 0
        };
      }
      productSalesCounts[pId].sold += item.quantity;
    });
  });

  const topProducts = Object.values(productSalesCounts)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  return (
    <DashboardClient 
      salesData={salesByMonth}
      deliveryData={deliveryData}
      recentOrders={recentOrders}
      urgentTasks={urgentTasks.slice(0, 5)}
      topProducts={topProducts}
      kpis={kpis}
    />
  );
}
