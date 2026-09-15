import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AMBASSADOR_APPLICATION_MODULE } from "../../../modules/ambassador_application"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(AMBASSADOR_APPLICATION_MODULE)
  const app = await service.createAmbassadorApplications(req.body)
  res.json({ ambassador_application: app })
}

