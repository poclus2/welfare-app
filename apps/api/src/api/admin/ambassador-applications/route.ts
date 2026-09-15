import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AMBASSADOR_APPLICATION_MODULE } from "../../../modules/ambassador_application"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(AMBASSADOR_APPLICATION_MODULE)
  const apps = await service.listAmbassadorApplications({}, { order: { created_at: "DESC" } })
  res.json({ ambassador_applications: apps })
}

