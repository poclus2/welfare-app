import { Modules } from "@medusajs/framework/utils"
import { CREATOR_PARTNER_MODULE } from "../modules/creator_partner"
import { isWhatsappSimulated, toE164 } from "./whatsapp-client"

// A creator space is tied to a customer account through the phone number: it is the only thing the
// customer proved she owns (WhatsApp code at signup, see lib/login-ticket.ts). The e-mail is never
// used for this — it is optional and unverified, anyone could sign up with a creator's address.

// In simulated WhatsApp mode the signup code goes back to the browser, so the phone proves nothing
const phoneIsTrusted = () => !(isWhatsappSimulated() && process.env.NODE_ENV === "production")

export function samePhone(a?: string | null, b?: string | null): boolean {
  return !!a && !!b && toE164(a) === toE164(b)
}

// Phones are stored as typed ("654815887", "+237654815887"...): every spelling of the same number
function phoneSpellings(phone: string): string[] {
  const e164 = toE164(phone)
  const spellings = new Set([phone.trim(), e164, e164.slice(1), `00${e164.slice(1)}`])
  if (e164.startsWith("+237")) spellings.add(e164.slice(4))
  return [...spellings].filter(Boolean)
}

const isCustomerId = (id?: string | null) => !!id && id.startsWith("cus_")

// The customer account registered on this phone, if any
export async function findCustomerIdByPhone(container: any, phone?: string | null): Promise<string | null> {
  if (!phone || !phoneIsTrusted()) return null
  const authModuleService = container.resolve(Modules.AUTH)
  const identities = await authModuleService.listAuthIdentities(
    { provider_identities: { entity_id: phoneSpellings(phone), provider: "phonepass" } },
    { relations: ["provider_identities"] }
  )
  for (const identity of identities) {
    const customerId = (identity.app_metadata as any)?.customer_id
    if (isCustomerId(customerId)) return customerId
  }
  return null
}

// The creator space of the logged-in customer. The first time, it is found by the phone she signed up
// with and tied to her account for good.
export async function resolveCreatorForCustomer(
  container: any,
  customerId?: string | null,
  authIdentityId?: string | null
): Promise<any | null> {
  if (!isCustomerId(customerId)) return null
  const cpService = container.resolve(CREATOR_PARTNER_MODULE) as any

  const linked = await cpService.listCreatorPartners({ customer_id: customerId }, {})
  if (linked.length) return linked[0]

  if (!authIdentityId || !phoneIsTrusted()) return null
  const authModuleService = container.resolve(Modules.AUTH)
  const identity = await authModuleService
    .retrieveAuthIdentity(authIdentityId, { relations: ["provider_identities"] })
    .catch(() => null)
  const phone = identity?.provider_identities?.find((pi: any) => pi.provider === "phonepass")?.entity_id
  if (!phone) return null

  const creators = await cpService.listCreatorPartners({}, { take: 1000 })
  const match = creators.find((c: any) => !isCustomerId(c.customer_id) && samePhone(c.phone, phone))
  if (!match) return null

  return cpService.updateCreatorPartners({ id: match.id, customer_id: customerId })
}
