import crypto from "crypto"
import { sendWhatsappOtp } from "./whatsapp-client"

const CODE_LENGTH = 6
const EXPIRY_MINUTES = 5
const MAX_ATTEMPTS = 5
const MAX_SENDS_PER_WINDOW = 3
const SEND_WINDOW_MINUTES = 15
const MAX_SENDS_PER_DAY = 10

export type OtpPurpose = "signup" | "login"

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex")
}

function generateCode(): string {
  // Avoid Math.random for anything security-adjacent.
  const n = crypto.randomInt(0, 10 ** CODE_LENGTH)
  return n.toString().padStart(CODE_LENGTH, "0")
}

export class OtpRateLimitError extends Error {}

export async function generateAndSendOtp(
  service: any,
  phone: string,
  purpose: OtpPurpose
): Promise<void> {
  const windowStart = new Date(Date.now() - SEND_WINDOW_MINUTES * 60 * 1000)
  const dayStart = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const recent = await service.listOtpCodes(
    { phone, purpose, created_at: { $gte: dayStart } },
    {}
  )
  const recentInWindow = recent.filter((r: any) => new Date(r.created_at) >= windowStart)

  if (recentInWindow.length >= MAX_SENDS_PER_WINDOW) {
    throw new OtpRateLimitError("Trop de tentatives récentes. Réessayez dans quelques minutes.")
  }
  if (recent.length >= MAX_SENDS_PER_DAY) {
    throw new OtpRateLimitError("Limite quotidienne de codes atteinte pour ce numéro.")
  }

  const code = generateCode()
  const expires_at = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000)

  await service.createOtpCodes({
    phone,
    code_hash: hashCode(code),
    purpose,
    expires_at,
    attempts: 0,
  })

  await sendWhatsappOtp(phone, code)
}

export async function verifyOtp(
  service: any,
  phone: string,
  code: string,
  purpose: OtpPurpose
): Promise<boolean> {
  // Sorted in application code rather than via the query config's
  // orderBy/limit — that config was silently not taking effect against
  // this auto-generated list method, so verification was matching stale
  // unconsumed rows (usually already-expired ones) instead of the latest.
  const candidates = await service.listOtpCodes({ phone, purpose, consumed_at: null })
  const otp = candidates
    .slice()
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
  if (!otp) return false

  if (new Date(otp.expires_at) < new Date()) return false
  if (otp.attempts >= MAX_ATTEMPTS) return false

  const matches = otp.code_hash === hashCode(code)

  if (!matches) {
    await service.updateOtpCodes({ id: otp.id, attempts: otp.attempts + 1 })
    return false
  }

  await service.updateOtpCodes({ id: otp.id, consumed_at: new Date() })
  return true
}
