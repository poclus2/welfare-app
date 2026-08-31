import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import * as fs from "fs"
import * as path from "path"

// Re-export config type and path from admin route
const CONFIG_PATH = path.join(process.cwd(), "ai-config.json")

type AIConfig = {
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
    console.error("[Store AI Config] Error reading config:", e)
  }
  return { ...DEFAULT_CONFIG }
}

// Public read-only endpoint — no auth required (config is not sensitive)
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const config = readConfig()
  res.status(200).json({ config })
}
