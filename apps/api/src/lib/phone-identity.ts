import { toE164 } from "./whatsapp-client"

// Customer phone identities (phonepass) are keyed on the number exactly as it was typed at signup
// ("654815887", "+237654815887", "+237 654 815 887"...). The shop now sends "+2376XXXXXXXX" (country
// code picker + national number), so every lookup tries the usual spellings of the same number and
// accounts created with another spelling are still found. The exact spelling always comes first.
export function phoneSpellings(phone: string): string[] {
  const e164 = toE164(phone)
  const spellings = new Set([phone, phone.trim(), e164, e164.slice(1), `00${e164.slice(1)}`])
  if (/^\+237\d{9}$/.test(e164)) {
    const n = e164.slice(4)
    const grouped3 = `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}` // 654 815 887
    const grouped2 = `${n[0]} ${n.slice(1, 3)} ${n.slice(3, 5)} ${n.slice(5, 7)} ${n.slice(7)}` // 6 54 81 58 87
    spellings.add(`0${n}`)
    for (const local of [n, grouped3, grouped2]) {
      spellings.add(local)
      spellings.add(`+237 ${local}`)
      spellings.add(`237 ${local}`)
    }
    spellings.add(`+237${grouped3}`)
  }
  return [...spellings].filter(Boolean)
}

/** The phonepass entity_id (the number as stored) of an auth identity */
export function phonepassEntityId(identity: any): string | undefined {
  return identity?.provider_identities?.find((pi: any) => pi.provider === "phonepass")?.entity_id
}

/**
 * The customer auth identity registered on this phone, whatever spelling it was stored under: the exact
 * spelling first, then one that already has a customer account.
 */
export async function findPhonepassIdentity(authModuleService: any, phone: string): Promise<any | null> {
  const identities: any[] = await authModuleService.listAuthIdentities(
    { provider_identities: { entity_id: phoneSpellings(phone), provider: "phonepass" } },
    { relations: ["provider_identities"] }
  )
  if (!identities.length) return null
  const rank = (identity: any) =>
    phonepassEntityId(identity) === phone ? 0 : (identity.app_metadata as any)?.customer_id ? 1 : 2
  return [...identities].sort((a, b) => rank(a) - rank(b))[0]
}
