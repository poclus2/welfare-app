import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  try {
    const { data: promotions } = await query.graph({
      entity: "promotion",
      fields: ["id", "code", "metadata"],
    });

    const influencerPromos = promotions.filter((p: any) => p.metadata?.is_influencer === true);

    if (influencerPromos.length === 0) {
      return res.json({ influencers: [] });
    }

    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "total", "created_at", "promotions.*"],
    });

    // Group stats by influencer_id
    const influencersMap: Record<string, any> = {};

    for (const promo of influencerPromos) {
      const infId = promo.metadata.influencer_id as string;
      if (!influencersMap[infId]) {
        influencersMap[infId] = {
          influencer_id: infId,
          total_sales: 0,
          total_uses: 0,
          pending_commissions: 0,
          codes: []
        };
      }
      influencersMap[infId].codes.push({
        code: promo.code,
        rate: Number(promo.metadata.commission_rate) || 10
      });
    }

    // Now scan orders
    for (const order of orders) {
      const appliedPromos = order.promotions || [];
      
      for (const applied of appliedPromos) {
        // Is it an influencer promo?
        const promoConfig = influencerPromos.find((p: any) => p.id === applied.id);
        if (promoConfig) {
          const infId = promoConfig.metadata.influencer_id as string;
          const oTotal = Number(order.total) || 0;
          const rate = Number(promoConfig.metadata.commission_rate) || 10;
          
          influencersMap[infId].total_uses++;
          influencersMap[infId].total_sales += oTotal;
          influencersMap[infId].pending_commissions += oTotal * (rate / 100);
        }
      }
    }

    // Optionally fetch customer names for these influencers
    const influencerIds = Object.keys(influencersMap);
    if (influencerIds.length > 0) {
      const { data: customers } = await query.graph({
        entity: "customer",
        fields: ["id", "first_name", "last_name", "email"]
      });
      
      for (const cus of customers) {
        if (influencersMap[cus.id]) {
          influencersMap[cus.id].name = `${cus.first_name || ""} ${cus.last_name || ""}`.trim() || cus.email;
        }
      }
    }

    const result = Object.values(influencersMap);
    result.sort((a, b) => b.total_sales - a.total_sales); // Top performers first

    return res.json({ influencers: result });

  } catch (error: any) {
    console.error("[AdminInfluencerStats] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
