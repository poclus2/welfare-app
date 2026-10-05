// Loyalty points: the one rule, used by the subscribers that award and take back points. The storefront
// only displays customer.metadata.loyalty_points (it used to recompute its own, 10x larger, figure
// from the order totals, so the dashboard and the profile disagreed).
//
// 1 point per 1000 FCFA of order total.
export const FCFA_PER_POINT = 1000

export function pointsForTotal(total: unknown): number {
  const n = typeof total === "number" ? total : Number(total)
  return Number.isFinite(n) && n > 0 ? Math.floor(n / FCFA_PER_POINT) : 0
}
