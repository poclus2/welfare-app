// Minimal PawaPay v1 client shared by the payment provider and the store routes.
// Docs: https://docs.pawapay.io/v1/api-reference/deposits/request-deposit

const PAWAPAY_BASE_URL = process.env.PAWAPAY_BASE_URL || "https://api.pawapay.cloud"

export const PAWAPAY_FEE_RATE = 0.03 // Surcharge applied to Mobile Money payments (mirrors the storefront)

let enabledCache: { at: number; list: string[] } | null = null

/** Correspondents enabled for deposits in Cameroon on this PawaPay account (cached 10 min). */
export async function getEnabledCameroonCorrespondents(): Promise<string[]> {
  if (enabledCache && Date.now() - enabledCache.at < 10 * 60 * 1000) return enabledCache.list
  const response = await fetch(`${PAWAPAY_BASE_URL}/active-conf`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  if (!response.ok) throw new Error(`PawaPay active-conf error ${response.status}`)
  const conf: any = await response.json()
  const cmr = (conf.countries || []).find((c: any) => c.country === "CMR")
  const list: string[] = (cmr?.correspondents || [])
    .filter((c: any) => (c.operationTypes || []).some((o: any) => o.operationType === "DEPOSIT"))
    .map((c: any) => c.correspondent)
  enabledCache = { at: Date.now(), list }
  return list
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidDepositId(id: unknown): id is string {
  return typeof id === "string" && UUID_RE.test(id)
}

/**
 * Normalises a Cameroonian phone number to the MSISDN format PawaPay expects (2376XXXXXXXX).
 * Returns null when the number cannot be a valid Cameroonian mobile number.
 */
export function normalizeCameroonMsisdn(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  let digits = raw.replace(/\D/g, "")
  if (digits.startsWith("00")) digits = digits.slice(2)
  if (digits.length === 9) digits = "237" + digits
  if (!/^2376\d{8}$/.test(digits)) return null
  return digits
}

export function computeMobileMoneyAmount(cartTotal: number): number {
  const total = Math.round(Number(cartTotal) || 0)
  return total + Math.round(total * PAWAPAY_FEE_RATE)
}

function getToken(): string {
  const token = process.env.PAWAPAY_API_KEY
  if (!token) throw new Error("PawaPay API token is not configured in PAWAPAY_API_KEY")
  return token
}

export type PawapayDepositRequest = {
  depositId: string
  amount: string
  currency: string
  correspondent: string
  msisdn: string
  statementDescription?: string
}

export async function requestDeposit(input: PawapayDepositRequest): Promise<any> {
  const payload = {
    depositId: input.depositId,
    amount: input.amount,
    currency: input.currency,
    correspondent: input.correspondent,
    payer: { type: "MSISDN", address: { value: input.msisdn } },
    customerTimestamp: new Date().toISOString(),
    // PawaPay: 4-22 alphanumeric chars/spaces
    statementDescription: (input.statementDescription || "The Welfare Shop").replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 22),
  }

  const response = await fetch(`${PAWAPAY_BASE_URL}/deposits`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(`PawaPay API error ${response.status}: ${JSON.stringify(data)}`)
  }
  // data.status is ACCEPTED | REJECTED | DUPLICATE_IGNORED
  return data
}

/** Returns the deposit object (status: ACCEPTED | SUBMITTED | ENQUEUED | COMPLETED | FAILED) or null if unknown. */
export async function getDeposit(depositId: string): Promise<any | null> {
  const response = await fetch(`${PAWAPAY_BASE_URL}/deposits/${encodeURIComponent(depositId)}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(`PawaPay API error ${response.status}: ${JSON.stringify(data)}`)
  }
  return Array.isArray(data) && data.length > 0 ? data[0] : null
}
