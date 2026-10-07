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

/**
 * Operator owning a Cameroonian MSISDN (2376XXXXXXXX), from its number range.
 * Returns null for ranges we are not sure about, so they are never blocked.
 */
export function detectCameroonOperator(msisdn: string): "MTN" | "ORANGE" | "NEXTTEL" | null {
  const local = msisdn.slice(3) // 6XXXXXXXX
  const p2 = local.slice(0, 2)
  const p3 = Number(local.slice(0, 3))
  if (p2 === "67" || (p3 >= 650 && p3 <= 654) || (p3 >= 680 && p3 <= 683)) return "MTN"
  if (p2 === "69" || (p3 >= 655 && p3 <= 659) || (p3 >= 686 && p3 <= 689)) return "ORANGE"
  if (p2 === "66") return "NEXTTEL"
  return null
}

const OPERATOR_LABELS = { MTN: "MTN", ORANGE: "Orange", NEXTTEL: "Nexttel" } as const

/** French message for a deposit refused by the operator (PawaPay failureCode / rejectionCode). */
export function describePawapayFailure(code: string | undefined, fallback?: string): string {
  switch (code) {
    case "PAYER_NOT_FOUND":
    case "INVALID_PAYER_FORMAT":
      return "Ce numéro n'a pas de compte MTN Mobile Money actif. Vérifiez le numéro Mobile Money saisi (il peut être différent de votre numéro WhatsApp)."
    case "INSUFFICIENT_BALANCE":
      return "Solde Mobile Money insuffisant. Rechargez votre compte puis réessayez."
    case "PAYMENT_NOT_APPROVED":
      return "Le paiement n'a pas été validé sur votre téléphone (annulé, code PIN erroné ou délai dépassé)."
    case "PAYER_LIMIT_REACHED":
      return "Votre plafond Mobile Money est atteint. Réessayez plus tard ou utilisez le paiement manuel."
    case "TRANSACTION_ALREADY_IN_PROCESS":
      return "Une autre transaction est déjà en cours sur ce numéro. Terminez-la puis réessayez."
    case "CORRESPONDENT_TEMPORARILY_UNAVAILABLE":
      return "MTN Mobile Money est momentanément indisponible. Réessayez dans quelques minutes ou utilisez le paiement manuel."
    default:
      return fallback || "Le paiement Mobile Money a été refusé ou annulé."
  }
}

/** Why this number cannot pay with this correspondent, or null when it can (as far as we know). */
export function operatorMismatchMessage(msisdn: string, correspondent: string): string | null {
  const operator = detectCameroonOperator(msisdn)
  const expected = correspondent.startsWith("MTN") ? "MTN" : correspondent.startsWith("ORANGE") ? "ORANGE" : null
  if (!operator || !expected || operator === expected) return null
  return `Ce numéro est un numéro ${OPERATOR_LABELS[operator]} : le paiement automatisé n'accepte que les numéros ${OPERATOR_LABELS[expected]} Mobile Money. Saisissez un numéro ${OPERATOR_LABELS[expected]} ou choisissez le paiement manuel.`
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

// ─── Admin "Paiements" page: balance and payouts ────────────────────────────────────────────────
// Docs: https://docs.pawapay.io/v1/api-reference/wallet-balances/wallet-balances-for-country
//       https://docs.pawapay.io/v1/api-reference/payouts/request-payout

/** Live balance of the PawaPay wallet for a country (XAF wallet for CMR). */
export async function getWalletBalance(country = "CMR"): Promise<{ balance: number; currency: string } | null> {
  const response = await fetch(`${PAWAPAY_BASE_URL}/v1/wallet-balances/${country}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  const data: any = await response.json().catch(() => null)
  if (!response.ok) throw new Error(`PawaPay wallet-balances error ${response.status}: ${JSON.stringify(data)}`)
  const wallet = (data?.balances || []).find((b: any) => b.country === country)
  return wallet ? { balance: Number(wallet.balance) || 0, currency: wallet.currency } : null
}

/** Payout limits per Cameroonian correspondent, or empty when payouts are not enabled on the account. */
export async function getCameroonPayoutCorrespondents(): Promise<{ correspondent: string; min: number; max: number }[]> {
  const response = await fetch(`${PAWAPAY_BASE_URL}/active-conf`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  if (!response.ok) throw new Error(`PawaPay active-conf error ${response.status}`)
  const conf: any = await response.json()
  const cmr = (conf.countries || []).find((c: any) => c.country === "CMR")
  return (cmr?.correspondents || []).flatMap((c: any) =>
    (c.operationTypes || [])
      .filter((o: any) => o.operationType === "PAYOUT")
      .map((o: any) => ({ correspondent: c.correspondent, min: Number(o.minTransactionLimit) || 0, max: Number(o.maxTransactionLimit) || 0 }))
  )
}

export type PawapayPayoutRequest = {
  payoutId: string
  amount: string
  currency: string
  correspondent: string
  msisdn: string
  statementDescription?: string
}

/** Sends money from the PawaPay wallet to a Mobile Money account. data.status: ACCEPTED | ENQUEUED | REJECTED | DUPLICATE_IGNORED */
export async function requestPayout(input: PawapayPayoutRequest): Promise<any> {
  const payload = {
    payoutId: input.payoutId,
    amount: input.amount,
    currency: input.currency,
    country: "CMR",
    correspondent: input.correspondent,
    recipient: { type: "MSISDN", address: { value: input.msisdn } },
    customerTimestamp: new Date().toISOString(),
    statementDescription: (input.statementDescription || "The Welfare retrait").replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 22),
  }
  const response = await fetch(`${PAWAPAY_BASE_URL}/payouts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`PawaPay API error ${response.status}: ${JSON.stringify(data)}`)
  return data
}

/** Returns the payout (status: ACCEPTED | ENQUEUED | SUBMITTED | COMPLETED | FAILED) or null if unknown. */
export async function getPayout(payoutId: string): Promise<any | null> {
  const response = await fetch(`${PAWAPAY_BASE_URL}/payouts/${encodeURIComponent(payoutId)}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(`PawaPay API error ${response.status}: ${JSON.stringify(data)}`)
  return Array.isArray(data) && data.length > 0 ? data[0] : null
}

/** French message for a refused / failed payout. */
export function describePayoutFailure(code: string | undefined, fallback?: string): string {
  switch (code) {
    case "BALANCE_INSUFFICIENT":
      return "Solde PawaPay insuffisant pour ce retrait."
    case "PAYOUTS_NOT_ALLOWED":
      return "Les retraits ne sont pas activés sur votre compte PawaPay."
    case "AMOUNT_TOO_SMALL":
    case "AMOUNT_TOO_LARGE":
    case "INVALID_AMOUNT":
      return "Montant de retrait hors des limites autorisées par PawaPay."
    case "RECIPIENT_NOT_FOUND":
    case "INVALID_RECIPIENT_FORMAT":
      return "Ce numéro n'a pas de compte Mobile Money actif."
    case "RECIPIENT_NOT_ALLOWED_TO_RECEIVE":
      return "Ce compte Mobile Money ne peut pas recevoir de fonds (plafond ou restriction de l'opérateur)."
    case "CORRESPONDENT_TEMPORARILY_UNAVAILABLE":
      return "L'opérateur Mobile Money est momentanément indisponible. Réessayez plus tard."
    default:
      return fallback || "Le retrait a été refusé."
  }
}
