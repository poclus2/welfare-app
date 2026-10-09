import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CREATOR_PARTNER_MODULE } from "../../../modules/creator_partner"
import { readAIConfig } from "../../../lib/ai-config"

// Public read-only endpoint — no auth required (config is not sensitive).
// Reads the same program_config row the admin writes (see lib/ai-config.ts).
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const service = req.scope.resolve(CREATOR_PARTNER_MODULE) as any
  const config = await readAIConfig(service)
  res.status(200).json({ config })
}
