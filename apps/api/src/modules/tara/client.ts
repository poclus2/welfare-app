// Minimal Tara Money client (Orange Money Cameroun). Docs: dashboard → API → Documentation (taramoney.com/app/api).
// Tara has no sandbox: every call moves real money.
//
// What the API gives us, and what it doesn't:
//  - POST /mobilepay sends the push to the customer's phone; we choose the productId (our payment reference).
//  - POST /transactions/status { productId } → SUCCESS | FAILURE | PENDING. It does NOT return the amount paid.
//  - The Mobile Money webhook carries neither productId nor amount and is never retried: it cannot be matched
//    to a cart, so the server-side status check is the only source of truth.
// Because the paid amount is never reported back, the amount we asked for is signed together with the cart
// (signTaraPaymentForCart) and the provider trusts only that signed amount.

import { createHash, createHmac, timingSafeEqual } from "crypto"

const TARA_BASE_URL = (process.env.TARA_BASE_URL || "https://www.dklo.co/api/tara").replace(/\/+$/, "")

function credentials(): { apiKey: string; businessId: string } {
  const apiKey = process.env.TARA_API_KEY
  const businessId = process.env.TARA_BUSINESS_ID
  if (!apiKey || !businessId) throw new Error("Tara is not configured (TARA_API_KEY / TARA_BUSINESS_ID)")
  return { apiKey, businessId }
}

export function isTaraConfigured(): boolean {
  return !!(process.env.TARA_API_KEY && process.env.TARA_BUSINESS_ID)
}

async function post(path: string, body: Record<string, unknown>): Promise<any> {
  const response = await fetch(`${TARA_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...credentials(), ...body }),
  })
  const data = await response.json().catch(() => null)
  // Never log the request body: it carries the API key
  if (!response.ok) throw new Error(`Tara API error ${response.status} on ${path}: ${JSON.stringify(data)}`)
  return data
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidTaraPaymentId(id: unknown): id is string {
  return typeof id === "string" && UUID_RE.test(id)
}

// ─── Payment ↔ cart ↔ amount binding ────────────────────────────────────────────────────────────
const paymentKey = () => createHash("sha256").update(`tara-payment:${credentials().apiKey}`).digest()

export function signTaraPaymentForCart(paymentId: string, cartId: string, amount: number): string {
  return createHmac("sha256", paymentKey()).update(`${paymentId}:${cartId}:${Math.round(amount)}`).digest("hex")
}

export function taraTokenMatches(paymentId: unknown, cartId: string, amount: unknown, token: unknown): boolean {
  if (!isValidTaraPaymentId(paymentId) || typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token)) return false
  const value = Number(amount)
  if (!Number.isFinite(value) || value <= 0) return false
  const expected = Buffer.from(signTaraPaymentForCart(paymentId, cartId, value), "hex")
  return timingSafeEqual(Buffer.from(token, "hex"), expected)
}

// ─── Collection ─────────────────────────────────────────────────────────────────────────────────

export type TaraMobilePayRequest = {
  paymentId: string
  amount: number
  msisdn: string // 2376XXXXXXXX
  productName: string
  webHookUrl: string
}

/** Sends the push. Returns { status: "SUCCESS" | "FAILURE", message, vendor: "ORANGE_CAMEROON" | "MTN_CAMEROON" }. */
export async function requestMobilePay(input: TaraMobilePayRequest): Promise<any> {
  return post("/mobilepay", {
    productId: input.paymentId,
    productName: input.productName,
    productPrice: Math.round(input.amount),
    phoneNumber: input.msisdn,
    webHookUrl: input.webHookUrl,
  })
}

export type TaraStatus = "SUCCESS" | "FAILURE" | "PENDING"

/** Status of a payment we started, normalised (anything unknown or not final yet counts as PENDING). */
export async function getTaraPaymentStatus(paymentId: string): Promise<{ status: TaraStatus; message?: string }> {
  const data = await post("/transactions/status", { productId: paymentId })
  const raw = String(data?.status || "").toUpperCase()
  const status: TaraStatus =
    raw === "SUCCESS" || raw === "PAID" || raw === "SUCCESSFUL" || raw === "COMPLETED"
      ? "SUCCESS"
      : raw === "FAILURE" || raw === "FAILED" || raw === "CANCELED" || raw === "CANCELLED" || raw === "REJECTED" || raw === "EXPIRED"
        ? "FAILURE"
        : "PENDING"
  return { status, message: typeof data?.message === "string" ? data.message : undefined }
}

export function describeTaraFailure(message?: string): string {
  return message
    ? `Le paiement Orange Money a été refusé ou annulé (${message}).`
    : "Le paiement Orange Money a été refusé ou annulé (solde insuffisant, code PIN erroné ou délai dépassé)."
}
