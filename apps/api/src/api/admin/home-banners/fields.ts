// Only these fields can be written from the admin, trimmed; empty optional texts become null.
const REQUIRED = ["title", "cta_label", "cta_href"] as const
const OPTIONAL = ["description", "image_url", "image_desktop_url", "image_alt", "bg_color"] as const

export function pickBannerFields(body: unknown): Record<string, any> {
  const b = (body || {}) as Record<string, any>
  const out: Record<string, any> = {}
  for (const k of REQUIRED) if (typeof b[k] === "string") out[k] = b[k].trim()
  for (const k of OPTIONAL) if (k in b) out[k] = typeof b[k] === "string" && b[k].trim() ? b[k].trim() : null
  if (typeof b.is_active === "boolean") out.is_active = b.is_active
  if (out.bg_color && !/^#[0-9a-f]{6}$/i.test(out.bg_color)) delete out.bg_color
  return out
}
