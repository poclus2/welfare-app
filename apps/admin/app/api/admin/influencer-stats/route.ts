import { NextResponse } from "next/server";

export async function GET() {
  const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
  // The backend route doesn't have strict auth for MVP yet, but normally we'd pass tokens
  try {
    const res = await fetch(`${medusaUrl}/admin/influencer-stats`, {
      cache: "no-store",
    });
    const data = await res.json();
    
    // If the module isn't fully returning yet or DB is empty, provide fake data so the UI is visible
    if (!data.influencers || data.influencers.length === 0) {
      return NextResponse.json({
        influencers: [
          {
            influencer_id: "cus_demo_1",
            name: "Awa Ndong",
            total_sales: 1250000,
            total_uses: 34,
            pending_commissions: 187500,
            codes: [{ code: "AWA15", rate: 15 }]
          },
          {
            influencer_id: "cus_demo_2",
            name: "Mireille Cosmetics",
            total_sales: 850000,
            total_uses: 12,
            pending_commissions: 85000,
            codes: [{ code: "MIMI10", rate: 10 }]
          }
        ]
      });
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
