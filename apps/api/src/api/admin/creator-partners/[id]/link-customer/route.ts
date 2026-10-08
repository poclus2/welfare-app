import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CREATOR_PARTNER_MODULE } from "../../../../../modules/creator_partner"
import { findCustomerIdByPhone } from "../../../../../lib/creator-account"

// Manual link, for a creator who signed up with another number than the one on her application:
// ties the creator space to the customer account registered on `phone`.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cpService = req.scope.resolve(CREATOR_PARTNER_MODULE) as any
  const { phone } = (req.body || {}) as { phone?: string }
  if (!phone || String(phone).replace(/\D/g, "").length < 9) {
    res.status(400).json({ message: "Numéro de téléphone du compte client requis" })
    return
  }

  const creator = await cpService.retrieveCreatorPartner(req.params.id)
  const customerId = await findCustomerIdByPhone(req.scope, phone)
  if (!customerId) {
    res.status(404).json({ message: "Aucun compte client n'est inscrit avec ce numéro" })
    return
  }

  const taken = await cpService.listCreatorPartners({ customer_id: customerId }, {})
  if (taken.some((c: any) => c.id !== creator.id)) {
    res.status(409).json({ message: `Ce compte client est déjà rattaché à l'espace créatrice ${taken[0].code}` })
    return
  }

  const updated = await cpService.updateCreatorPartners({ id: creator.id, customer_id: customerId })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "first_name", "last_name", "phone", "email"],
    filters: { id: customerId },
  })
  res.json({ creator_partner: updated, customer: customers[0] || null })
}
