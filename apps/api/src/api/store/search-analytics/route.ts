import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve("search_analytics") as any
  const { term, results_count, region } = req.body as any

  if (!term) {
    return res.status(400).json({ message: "Term is required" })
  }

  const log = await service.createSearchLogs({
    term: term.toLowerCase().trim(),
    results_count: results_count || 0,
    region: region || "unknown",
  })

  res.json({ success: true, log })
}
