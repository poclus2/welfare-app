import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customer_id") || "cus_demo_1"; // Mock auth for MVP

  const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
  try {
    const res = await fetch(`${medusaUrl}/store/influencer-stats?customer_id=${customerId}`, {
      cache: "no-store",
    });
    const data = await res.json();
    
    // Fallback to demo data if the DB is completely empty (for client presentation)
    if (!data.promotions || data.promotions.length === 0) {
      return NextResponse.json({
        stats: { total_sales: 1250000, total_uses: 34, pending_commissions: 187500 },
        promotions: [{ code: "AWA15", commission_rate: 15 }],
        recent_orders: [
          { id: "ord_1", created_at: new Date().toISOString(), customer_name: "Fatou ***", total: 45000, commission_earned: 6750 },
          { id: "ord_2", created_at: new Date(Date.now() - 86400000).toISOString(), customer_name: "Marie ***", total: 120000, commission_earned: 18000 }
        ]
      });
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
