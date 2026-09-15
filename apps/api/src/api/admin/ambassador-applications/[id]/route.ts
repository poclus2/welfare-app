import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AMBASSADOR_APPLICATION_MODULE } from "../../../../modules/ambassador_application"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(AMBASSADOR_APPLICATION_MODULE)
  const app = await service.retrieveAmbassadorApplication(req.params.id)
  res.json({ ambassador_application: app })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(AMBASSADOR_APPLICATION_MODULE)
  const app = await service.updateAmbassadorApplications({ id: req.params.id, ...req.body })
  res.json({ ambassador_application: app })
}

