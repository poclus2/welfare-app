import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CREATOR_PARTNER_MODULE } from "../../../modules/creator_partner"
// Stored in program_config (key="ai_config"), shared with the public store route
import { AIConfig, readAIConfig as readConfig, writeAIConfig as writeConfig } from "../../../lib/ai-config"

export type { AIConfig }

// Mirrors the 10-per-step cap enforced client-side (SkinCoachSettings.tsx) —
// without this, a malformed/oversized payload could bypass that UI limit.
function sanitizeByStep(value: unknown, fallback: Record<string, string[]>): Record<string, string[]> {
  if (!value || typeof value !== "object") return fallback
  const result: Record<string, string[]> = {}
  for (const [step, ids] of Object.entries(value as Record<string, unknown>)) {
    result[step] = Array.isArray(ids) ? ids.filter((id) => typeof id === "string").slice(0, 10) : []
  }
  return result
}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const service = req.scope.resolve(CREATOR_PARTNER_MODULE) as any
  const config = await readConfig(service)
  res.status(200).json({ config })
}

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const service = req.scope.resolve(CREATOR_PARTNER_MODULE) as any
    const body = req.body as Partial<AIConfig>

    // Validate mode
    if (body.mode && !["top_stock", "manual_selection"].includes(body.mode)) {
      return res.status(400).json({ message: "Mode invalide. Utilisez 'top_stock' ou 'manual_selection'." })
    }

    // Validate max_routine_steps
    if (body.max_routine_steps !== undefined) {
      const steps = Number(body.max_routine_steps)
      if (steps < 3 || steps > 7) {
        return res.status(400).json({ message: "max_routine_steps doit être entre 3 et 7." })
      }
    }

    // Merge with existing config
    const current = await readConfig(service)
    const updated: AIConfig = {
      ...current,
      ...body,
      // Sanitize arrays
      manual_product_ids: Array.isArray(body.manual_product_ids)
        ? body.manual_product_ids.slice(0, 20) // max 20 products
        : current.manual_product_ids,
      manual_products_by_step: sanitizeByStep(body.manual_products_by_step, current.manual_products_by_step),
    }

    await writeConfig(service, updated)
    res.status(200).json({ config: updated, message: "Configuration sauvegardée avec succès." })
  } catch (error: any) {
    console.error("[AI Config] Error saving config:", error)
    res.status(500).json({ message: error.message })
  }
}
