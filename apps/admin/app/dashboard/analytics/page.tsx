import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";
import { redirect } from "next/navigation";
import AnalyticsClient from "./AnalyticsClient";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return redirect("/login");

  // Fetch data
  const [ordersRes, productsRes, stockRes, skinScansRes, searchRes] = await Promise.all([
    fetchAdmin<{ orders: any[], count: number }>("/orders?limit=1000&expand=customer,items,payments,shipping_methods,discounts,shipping_address,billing_address", token).catch(() => ({ orders: [], count: 0 })),
    fetchAdmin<{ products: any[] }>("/products?limit=1000&expand=variants,collection", token).catch(() => ({ products: [] })),
    fetchAdmin<{ stock_locations: any[] }>("/stock-locations?expand=sales_channels", token).catch(() => ({ stock_locations: [] })),
    fetchAdmin<{ skin_scans: any[] }>("/skin-scans?limit=1000", token).catch(() => ({ skin_scans: [] })),
    fetchAdmin<{ search_logs: any[] }>("/search-analytics", token).catch(() => ({ search_logs: [] }))
  ]);

  const allOrders = ordersRes.orders || [];
  const products = productsRes.products || [];
  const stockLocations = stockRes.stock_locations || [];
  const skinScans = skinScansRes.skin_scans || [];
  const searchLogs = searchRes.search_logs || [];

  const validOrders = allOrders.filter(o => o.status !== "canceled" && o.payment_status !== "canceled");

  // --- 1. E-COMMERCE ---
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const dailyDataMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dailyDataMap[d.toISOString().split("T")[0]] = 0;
  }

  let sekoriaPreorders = 0;
  let smartSaverUses = 0;

  validOrders.forEach(o => {
    if (o.items?.some((item: any) => item.title.toLowerCase().includes("sekoria"))) sekoriaPreorders++;
    if (o.discounts && o.discounts.length > 0) smartSaverUses++;

    const d = new Date(o.created_at);
    if (d >= thirtyDaysAgo) {
      const dateStr = d.toISOString().split("T")[0];
      if (dailyDataMap[dateStr] !== undefined) dailyDataMap[dateStr] += o.total || 0;
    }
  });

  const dailyRevenue = Object.entries(dailyDataMap).map(([date, value]) => {
    const d = new Date(date);
    return { date: `${d.getDate()}/${d.getMonth() + 1}`, fullDate: date, value };
  });

  const productStats: Record<string, { id: string, name: string, sold: number, revenue: number }> = {};
  validOrders.forEach(o => {
    o.items?.forEach((item: any) => {
      const pId = item.variant?.product_id;
      if (!pId) return;
      if (!productStats[pId]) productStats[pId] = { id: pId, name: item.title, sold: 0, revenue: 0 };
      productStats[pId].sold += item.quantity;
      productStats[pId].revenue += item.total || (item.unit_price * item.quantity);
    });
  });

  const topProducts = Object.values(productStats).sort((a, b) => b.revenue - a.revenue).slice(0, 15).map(p => {
      const prod = products.find(x => x.id === p.id);
      const stock = prod?.variants?.reduce((acc: number, v: any) => acc + (v.inventory_quantity || 0), 0) || 0;
      return { ...p, stock };
    });

  const paymentCounts: Record<string, number> = {};
  validOrders.forEach(o => {
    let provider = o.payments?.[0]?.provider_id || "Non spécifié";
    if (provider.includes("wave")) provider = "Wave";
    if (provider.includes("orange")) provider = "Orange Money";
    if (provider.includes("cash") || provider.includes("manual")) provider = "Paiement à la livraison";
    paymentCounts[provider] = (paymentCounts[provider] || 0) + 1;
  });

  const paymentColors = ["#3b82f6", "#f97316", "#10b981", "#8b5cf6", "#64748b"];
  const paymentData = Object.entries(paymentCounts).map(([name, count], i) => ({
    name, value: count, color: paymentColors[i % paymentColors.length]
  }));

  const validOrders30 = validOrders.filter(o => new Date(o.created_at) >= thirtyDaysAgo);
  const realTotalOrders30 = validOrders30.length;
  const realTotalRev30 = validOrders30.reduce((acc, o) => acc + (o.total || 0), 0);
  const aov30 = realTotalOrders30 > 0 ? Math.round(realTotalRev30 / realTotalOrders30) : 0;

  const ecommerceData = {
    sekoriaPreorders,
    smartSaverUses,
    // Real location names only — there is no actual warehouse-capacity tracking
    // anywhere in the system, so we no longer fabricate a "% capacity" gauge.
    stockLocations: stockLocations.map((loc: any) => ({ name: loc.name })),
  };

  const kpis = { revenue30: realTotalRev30, orders30: realTotalOrders30, aov30: aov30 };

  // --- Real fulfillment breakdown (Logistique tab) — computed from actual
  // order.fulfillment_status instead of a hardcoded fake pie chart.
  const fulfillmentCounts: Record<string, number> = {};
  validOrders.forEach(o => {
    const status = o.fulfillment_status || "not_fulfilled";
    fulfillmentCounts[status] = (fulfillmentCounts[status] || 0) + 1;
  });
  const FULFILLMENT_LABELS: Record<string, { label: string; color: string }> = {
    not_fulfilled: { label: "Non Traité", color: "#f59e0b" },
    partially_fulfilled: { label: "Part. Traité", color: "#f59e0b" },
    fulfilled: { label: "Prêt (Expédition créée)", color: "#3b82f6" },
    partially_shipped: { label: "Part. Expédié", color: "#8b5cf6" },
    shipped: { label: "Expédié", color: "#10b981" },
    delivered: { label: "Livré", color: "#10b981" },
    canceled: { label: "Annulé", color: "#ef4444" },
  };
  const fulfillmentData = Object.entries(fulfillmentCounts).map(([status, value]) => ({
    name: FULFILLMENT_LABELS[status]?.label || status,
    value,
    color: FULFILLMENT_LABELS[status]?.color || "#64748b",
  }));
  const shippedOrDelivered = (fulfillmentCounts.shipped || 0) + (fulfillmentCounts.delivered || 0);
  const shippedRate = validOrders.length > 0 ? Math.round((shippedOrDelivered / validOrders.length) * 100) : 0;

  const logisticsData = { fulfillmentData, shippedRate, totalOrders: validOrders.length };

  // --- 2. SKIN COACH ---
  // Only averaged over scans that actually recorded each metric — no more
  // Math.random() filling in for missing data and presenting it as "(Réel)".
  const metricSums: Record<string, { total: number; count: number }> = {
    hydratation: { total: 0, count: 0 },
    sebum: { total: 0, count: 0 },
    pigmentation: { total: 0, count: 0 },
    rides: { total: 0, count: 0 },
    sensibilite: { total: 0, count: 0 },
  };
  let barrierFragileCount = 0;
  let melasmaCount = 0;
  let rule16Applied = 0;
  const totalScans = skinScans.length;

  skinScans.forEach(scan => {
    const metrics = scan.metrics || {};
    for (const key of Object.keys(metricSums)) {
      if (typeof metrics[key] === "number") {
        metricSums[key].total += metrics[key];
        metricSums[key].count += 1;
      }
    }

    const concernsStr = JSON.stringify(scan.concerns || "").toLowerCase();
    const typeStr = (scan.final_skin_type || "").toLowerCase();
    if (concernsStr.includes("barrière") || concernsStr.includes("barrier") || typeStr.includes("fragilis")) {
      barrierFragileCount++;
      rule16Applied++;
    }
    if (concernsStr.includes("mélasma") || concernsStr.includes("melasma") || concernsStr.includes("pigment")) {
      melasmaCount++;
    }
  });

  const avg = (key: string) => metricSums[key].count ? Math.round(metricSums[key].total / metricSums[key].count) : null;
  const avgH = avg("hydratation");
  const avgS = avg("sebum");
  const avgP = avg("pigmentation");
  const avgR = avg("rides");
  const avgSens = avg("sensibilite");

  const skinCoachData = {
    totalScans,
    barrierFragilePercentage: totalScans ? Math.round((barrierFragileCount / totalScans) * 100) : 0,
    melasmaPercentage: totalScans ? Math.round((melasmaCount / totalScans) * 100) : 0,
    rule16Applied,
    radar: [
      { subject: 'Hydratation', A: avgH ?? 0, fullMark: 100 },
      { subject: 'Sébum', A: avgS ?? 0, fullMark: 100 },
      { subject: 'Pigmentation', A: avgP ?? 0, fullMark: 100 },
      { subject: 'Rides fines', A: avgR ?? 0, fullMark: 100 },
      { subject: 'Sensibilité', A: avgSens ?? 0, fullMark: 100 },
    ],
    hydratationAvg: avgH,
    sebumAvg: avgS,
    hasMetricData: metricSums.hydratation.count > 0 || metricSums.sebum.count > 0,
  };

  // --- 3. RÉTENTION & FIDÉLITÉ ---
  const customersStats: Record<string, { spend: number, count: number }> = {};
  validOrders.forEach(o => {
    if (o.customer_id) {
       if (!customersStats[o.customer_id]) customersStats[o.customer_id] = { spend: 0, count: 0 };
       customersStats[o.customer_id].spend += (o.total || 0);
       customersStats[o.customer_id].count += 1;
    }
  });

  let repeatCustomers = 0;
  let bronze = 0, silver = 0, gold = 0, vip = 0, elite = 0;
  const totalCustomers = Object.keys(customersStats).length;

  Object.values(customersStats).forEach(c => {
    if (c.count > 1) repeatCustomers++;
    if (c.spend < 50000) bronze++;
    else if (c.spend < 150000) silver++;
    else if (c.spend < 300000) gold++;
    else if (c.spend < 600000) vip++;
    else elite++;
  });

  const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;
  const skinDiaryUsersSet = new Set<string>();
  let depigmentationCount = 0;

  skinScans.forEach(scan => {
    if (scan.customer_id) skinDiaryUsersSet.add(scan.customer_id);
    const concernsStr = JSON.stringify(scan.concerns || "").toLowerCase();
    if (concernsStr.includes("dépigmentation") || concernsStr.includes("depigmentation") || concernsStr.includes("blanchiment")) {
      depigmentationCount++;
    }
  });

  const retentionData = {
    repeatRate,
    skinDiaryUsersCount: skinDiaryUsersSet.size,
    depigmentationCount,
    loyaltyData: [
      { name: 'Bronze (<50k)', value: bronze || 1, color: '#CD7F32' },
      { name: 'Silver (50k-150k)', value: silver || 1, color: '#C0C0C0' },
      { name: 'Gold (150k-300k)', value: gold || 1, color: '#FFD700' },
      { name: 'VIP (300k-600k)', value: vip || 1, color: '#C08A8E' },
      { name: 'Elite (>600k)', value: elite || 1, color: '#2A2424' },
    ]
  };

  // --- 4. UX & INTELLIGENCE ---
  const regionCount = { SN: 0, CI: 0, FR: 0, OTHER: 0, UNKNOWN: 0 };
  let totalOrdersWithRegion = 0;
  validOrders.forEach(o => {
    const rawCode = o.shipping_address?.country_code || o.billing_address?.country_code;
    totalOrdersWithRegion++;
    if (!rawCode) { regionCount.UNKNOWN++; return; }
    const code = rawCode.toLowerCase();
    if (code === "sn") regionCount.SN++;
    else if (code === "ci") regionCount.CI++;
    else if (code === "fr") regionCount.FR++;
    else regionCount.OTHER++;
  });

  // Calculate top searches
  const termCounts: Record<string, number> = {};
  const lostTermCounts: Record<string, number> = {};
  
  searchLogs.forEach(log => {
    if (!log.term) return;
    const term = log.term.toLowerCase();
    termCounts[term] = (termCounts[term] || 0) + 1;
    if (log.results_count === 0) {
      lostTermCounts[term] = (lostTermCounts[term] || 0) + 1;
    }
  });

  const topSearches = Object.entries(termCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([term, count]) => ({ term, count }));

  const topLostSearches = Object.entries(lostTermCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([term, count]) => ({ term, count }));

  const noResultsCount = searchLogs.filter(log => log.results_count === 0).length;
  const totalRealSearches = searchLogs.length;

  const uxData = {
    topSearches,
    topLostSearches,
    regionPercentages: {
      sn: totalOrdersWithRegion ? Math.round((regionCount.SN / totalOrdersWithRegion) * 100) : 0,
      ci: totalOrdersWithRegion ? Math.round((regionCount.CI / totalOrdersWithRegion) * 100) : 0,
      fr: totalOrdersWithRegion ? Math.round((regionCount.FR / totalOrdersWithRegion) * 100) : 0,
      other: totalOrdersWithRegion ? Math.round((regionCount.OTHER / totalOrdersWithRegion) * 100) : 0,
      unknown: totalOrdersWithRegion ? Math.round((regionCount.UNKNOWN / totalOrdersWithRegion) * 100) : 0,
    },
    kpis: {
      searches: totalRealSearches,
      noResults: totalRealSearches > 0 ? Number(((noResultsCount / totalRealSearches) * 100).toFixed(1)) : 0,
    }
  };

  return (
    <AnalyticsClient
      dailyRevenue={dailyRevenue}
      topProducts={topProducts}
      paymentData={paymentData}
      kpis={kpis}
      ecommerceData={ecommerceData}
      skinCoachData={skinCoachData}
      retentionData={retentionData}
      uxData={uxData}
      logisticsData={logisticsData}
    />
  );
}
