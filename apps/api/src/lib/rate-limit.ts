// Tiny in-memory sliding-window limiter, per key (here: client IP). Enough for a single API instance;
// it resets when the API restarts. Used to keep scripts from burning the paid WhatsApp message quota.
const hits = new Map<string, number[]>()

export function tooManyRequests(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs)
  if (recent.length >= max) {
    hits.set(key, recent)
    return true
  }
  recent.push(now)
  hits.set(key, recent)

  // keep the map small
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k)
  }
  return false
}

export function clientIp(req: { headers: Record<string, any>; ip?: string }): string {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim()
  return forwarded || req.ip || "unknown"
}
