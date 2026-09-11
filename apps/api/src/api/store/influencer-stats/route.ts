import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  
  let customerId = req.query.customer_id as string;

  if (!customerId) {
    return res.status(401).json({ error: "Non autorisé. L'identifiant de l'influenceur est manquant." });
  }

  try {
    const { data: promotions } = await query.graph({
      entity: "promotion",
      fields: ["id", "code", "metadata"],
    });

    const myPromotions = promotions.filter((p: any) => p.metadata?.is_influencer === true && p.metadata?.influencer_id === customerId);

    if (myPromotions.length === 0) {
      return res.json({
        stats: { total_sales: 0, total_uses: 0, pending_commissions: 0 },
        promotions: [],
        recent_orders: []
      });
    }

    const promoIds = myPromotions.map((p: any) => p.id);

    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "total", "created_at", "customer.*", "promotions.*"],
    });

    let totalSales = 0;
    let totalUses = 0;
    let pendingCommissions = 0;
    const recentOrders: any[] = [];

    for (const order of orders) {
      const appliedPromos = order.promotions || [];
      const usedMyPromo = appliedPromos.find((p: any) => promoIds.includes(p.id));

      if (usedMyPromo) {
        totalUses++;
        const oTotal = Number(order.total) || 0;
        totalSales += oTotal;
        
        const promoConfig = myPromotions.find((p: any) => p.id === usedMyPromo.id);
        const rate = Number(promoConfig?.metadata?.commission_rate) || 10;
        
        const commission = oTotal * (rate / 100);
        pendingCommissions += commission;

        recentOrders.push({
          id: order.id,
          created_at: order.created_at,
          customer_name: order.customer?.first_name ? `${order.customer.first_name} ***` : "Client anonyme",
          total: oTotal,
          commission_earned: commission
        });
      }
    }

    recentOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return res.json({
      stats: {
        total_sales: totalSales,
        total_uses: totalUses,
        pending_commissions: pendingCommissions
      },
      promotions: myPromotions.map((p: any) => ({ 
        code: p.code, 
        commission_rate: p.metadata?.commission_rate || 10 
      })),
      recent_orders: recentOrders.slice(0, 10)
    });

  } catch (error: any) {
    console.error("[InfluencerStats] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
