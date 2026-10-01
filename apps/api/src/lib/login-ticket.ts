import crypto from "crypto"

// Bridges /store/otp/verify (which has full container access, so it can look
// up the existing phonepass-created auth identity) and the `phoneotp` auth
// provider (whose module container is isolated from sibling app modules, so
// it cannot resolve the auth or otp services itself). The route verifies the
// OTP and signs the already-resolved identity into a short-lived ticket; the
// provider only ever checks the signature — no DI, no DB access.
const TICKET_TTL_MS = 2 * 60 * 1000

function secret(): string {
  return process.env.JWT_SECRET || "welfare_jwt_super_secret_change_in_prod"
}

export function issueLoginTicket(authIdentity: unknown): string {
  const expiresAt = Date.now() + TICKET_TTL_MS
  const payloadB64 = Buffer.from(JSON.stringify({ authIdentity, expiresAt })).toString("base64url")
  const sig = crypto.createHmac("sha256", secret()).update(payloadB64).digest("hex")
  return `${payloadB64}.${sig}`
}

export function verifyLoginTicket(ticket: string): any | null {
  if (!ticket || !ticket.includes(".")) return null

  const [payloadB64, sig] = ticket.split(".")
  const expectedSig = crypto.createHmac("sha256", secret()).update(payloadB64).digest("hex")
  const sigBuf = Buffer.from(sig, "hex")
  const expectedBuf = Buffer.from(expectedSig, "hex")
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString())
    if (!payload.expiresAt || Date.now() > payload.expiresAt) return null
    return payload.authIdentity
  } catch {
    return null
  }
}
