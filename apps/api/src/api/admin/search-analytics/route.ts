import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve("search_analytics") as any
  
  // Fetch all logs
  const logs = await service.listSearchLogs({}, { take: 10000 })
  
  res.json({ search_logs: logs })
}
