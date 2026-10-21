import { ExecArgs } from "@medusajs/framework/types"
import { SKIN_SCAN_MODULE } from "../modules/skin_scan"
import { notifyAdvisor } from "../lib/skin-advisors"

// Tells the active advisors again about the scans given to them that never reached them on WhatsApp
// (advisor_notified_at empty, not reviewed yet), oldest first, one message every DELAY_MS. Stops at the
// first failure: a missing Zindua template would fail every send the same way.
//   npx medusa exec ./src/scripts/resend-advisor-notifications.ts
// DRY_RUN=1 only lists them.
const DELAY_MS = Number(process.env.DELAY_MS) || 8000
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default async function resendAdvisorNotifications({ container }: ExecArgs) {
  const service: any = container.resolve(SKIN_SCAN_MODULE)
  const advisors = new Map<string, any>()
  for (const a of await service.listSkinAdvisors({ active: true })) advisors.set(a.id, a)

  const scans = (await service.listSkinScans(
    { advisor_notified_at: null, review_status: null },
    { select: ["id", "advisor_id", "created_at"], order: { created_at: "ASC" } }
  )).filter((s: any) => s.advisor_id && advisors.has(s.advisor_id))

  console.log(`[resend] ${scans.length} scan(s) to tell, ${DELAY_MS / 1000}s apart`)
  let sent = 0
  for (const [i, scan] of scans.entries()) {
    const advisor = advisors.get(scan.advisor_id)
    if (process.env.DRY_RUN) {
      console.log(`[resend] would tell ${advisor.name} about ${scan.id}`)
      continue
    }
    if (i > 0) await sleep(DELAY_MS)
    await notifyAdvisor(service, scan.id, advisor)
    const after = await service.retrieveSkinScan(scan.id, { select: ["advisor_notified_at"] })
    if (!after.advisor_notified_at) {
      console.error(`[resend] stopped: ${advisor.name} not told about ${scan.id} (see the error above)`)
      break
    }
    sent++
    console.log(`[resend] ${advisor.name} told about ${scan.id}`)
  }
  console.log(`[resend] done: ${sent}/${scans.length} sent`)
}
