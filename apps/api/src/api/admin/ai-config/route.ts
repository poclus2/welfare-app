import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import * as fs from "fs"
import * as path from "path"

// Config file stored on the filesystem inside the container
const CONFIG_PATH = path.join(process.cwd(), "ai-config.json")

export type AIConfig = {
  mode: "top_stock" | "manual_selection"
  min_stock_threshold: number
  max_routine_steps: number
  manual_product_ids: string[]
  enforce_stock_filter: boolean
}

const DEFAULT_CONFIG: AIConfig = {
  mode: "top_stock",
  min_stock_threshold: 1,
  max_routine_steps: 5,
  manual_product_ids: [],
  enforce_stock_filter: true,
}

function readConfig(): AIConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, "utf-8")
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
    }
  } catch (e) {
    console.error("[AI Config] Error reading config:", e)
  }
  return { ...DEFAULT_CONFIG }
}

function writeConfig(config: AIConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8")
}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const config = readConfig()
  res.status(200).json({ config })
}

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
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
    const current = readConfig()
    const updated: AIConfig = {
      ...current,
      ...body,
      // Sanitize arrays
      manual_product_ids: Array.isArray(body.manual_product_ids)
        ? body.manual_product_ids.slice(0, 20) // max 20 products
        : current.manual_product_ids,
    }

    writeConfig(updated)
    res.status(200).json({ config: updated, message: "Configuration sauvegardée avec succès." })
  } catch (error: any) {
    console.error("[AI Config] Error saving config:", error)
    res.status(500).json({ message: error.message })
  }
}
