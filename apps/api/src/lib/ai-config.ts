// Skin Coach IA settings, stored in program_config (key="ai_config") of the creator_partner module.
// Shared by the admin route (read/write) and the public store route (read) so both see the same config:
// the store route used to read a local ai-config.json that no longer exists, so the storefront always
// fell back to the default "top_stock" mode and ignored the per-step catalogue chosen in the admin.

const CONFIG_KEY = "ai_config"

export type AIConfig = {
  mode: "top_stock" | "manual_selection"
  min_stock_threshold: number
  max_routine_steps: number
  manual_product_ids: string[]
  manual_products_by_step: Record<string, string[]>
  enforce_stock_filter: boolean
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  mode: "top_stock",
  min_stock_threshold: 1,
  max_routine_steps: 5,
  manual_product_ids: [],
  manual_products_by_step: {},
  enforce_stock_filter: true,
}

export async function readAIConfig(service: any): Promise<AIConfig> {
  const rows = await service.listProgramConfigs({ key: CONFIG_KEY }, {})
  if (!rows.length) return { ...DEFAULT_AI_CONFIG }
  try {
    return { ...DEFAULT_AI_CONFIG, ...JSON.parse(rows[0].value) }
  } catch (e) {
    console.error("[AI Config] Error parsing stored config:", e)
    return { ...DEFAULT_AI_CONFIG }
  }
}

export async function writeAIConfig(service: any, config: AIConfig): Promise<void> {
  const existing = await service.listProgramConfigs({ key: CONFIG_KEY }, {})
  const value = JSON.stringify(config)
  if (existing.length) {
    await service.updateProgramConfigs({ id: existing[0].id, value })
  } else {
    await service.createProgramConfigs({ key: CONFIG_KEY, value })
  }
}
