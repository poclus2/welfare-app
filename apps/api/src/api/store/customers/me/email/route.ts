import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

// POST /store/customers/me/email { email }
//
// Customers who sign up with a phone number get a placeholder e-mail (<digits>@phone.thewelfarecm.com)
// because Medusa needs one, and Medusa's own customer update can't change it. Order e-mails would go
// to that address, so this lets her replace it with a real one. Only a placeholder can be replaced here.
const PLACEHOLDER_DOMAIN = "@phone.thewelfarecm.com"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id
  if (!customerId) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const email = String((req.body as any)?.email || "").trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.endsWith(PLACEHOLDER_DOMAIN) || email.length > 200) {
    return res.status(400).json({ message: "Adresse e-mail invalide." })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: current } = await query.graph({ entity: "customer", fields: ["id", "email"], filters: { id: customerId } })
  const customer: any = current[0]
  if (!customer) {
    return res.status(404).json({ message: "Compte introuvable." })
  }
  if (!String(customer.email || "").toLowerCase().endsWith(PLACEHOLDER_DOMAIN)) {
    return res.status(400).json({ message: "Votre adresse e-mail est déjà renseignée." })
  }

  const { data: taken } = await query.graph({
    entity: "customer",
    fields: ["id"],
    filters: { email, has_account: true },
  })
  if (taken.length) {
    return res.status(409).json({ message: "Cette adresse e-mail est déjà utilisée par un compte." })
  }

  await req.scope.resolve(Modules.CUSTOMER).updateCustomers(customerId, { email })
  res.json({ email })
}
