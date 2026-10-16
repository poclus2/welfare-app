import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SITE_CONTENT_MODULE } from "../../../modules/site_content"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SITE_CONTENT_MODULE) as any
  const campaign = typeof req.query.campaign === "string" ? req.query.campaign : "sekoria"
  const subscribers = await service.listLaunchSubscribers({ campaign }, { order: { created_at: "DESC" } })
  res.json({ launch_subscribers: subscribers })
}
