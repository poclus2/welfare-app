import { MedusaContainer } from "@medusajs/framework/types"
import { SKIN_SCAN_MODULE } from "../modules/skin_scan"

// Face photos are kept only as long as they are useful (owner's decision, 2026-10-10):
// - a scan nobody claimed loses its photos once the 2-hour claim window is over (see the claim route);
// - unless it was given to a skin advisor: then 7 days, the time for her to answer (owner's decision, 2026-10-18);
// - a scan attached to a customer keeps them 6 months.
// Only the photos go: the diagnostic itself (skin type, metrics, routine) stays.
const UNCLAIMED_MS = 2 * 60 * 60 * 1000
const UNCLAIMED_WITH_ADVISOR_MS = 7 * 24 * 60 * 60 * 1000
const CLAIMED_MS = 183 * 24 * 60 * 60 * 1000
// Temporarily off (owner's request, 2026-10-13): unclaimed scans keep their photos while the
// attachment of scans after sign-up/login is checked. The 6-month purge still runs.
const PURGE_UNCLAIMED = false

export default async function purgeSkinScanPhotosJob(container: MedusaContainer) {
  const service = container.resolve(SKIN_SCAN_MODULE) as any
  const now = Date.now()

  const unclaimed = PURGE_UNCLAIMED
    ? [
        ...(await service.listSkinScans(
          { customer_id: null, advisor_id: null, images: { $ne: null }, created_at: { $lt: new Date(now - UNCLAIMED_MS) } },
          { select: ["id"] }
        )),
        ...(await service.listSkinScans(
          { customer_id: null, advisor_id: { $ne: null }, images: { $ne: null }, created_at: { $lt: new Date(now - UNCLAIMED_WITH_ADVISOR_MS) } },
          { select: ["id"] }
        )),
      ]
    : []
  const claimed = await service.listSkinScans(
    { customer_id: { $ne: null }, images: { $ne: null }, created_at: { $lt: new Date(now - CLAIMED_MS) } },
    { select: ["id"] }
  )

  const ids = [...unclaimed, ...claimed].map((s: any) => s.id)
  if (!ids.length) return

  await service.updateSkinScans(ids.map((id: string) => ({ id, images: null })))
  console.log(`[SkinScanPhotos] Photos removed from ${ids.length} scan(s) (${unclaimed.length} unclaimed, ${claimed.length} older than 6 months)`)
}

export const config = {
  name: "purge-skin-scan-photos",
  schedule: "*/15 * * * *",
}
