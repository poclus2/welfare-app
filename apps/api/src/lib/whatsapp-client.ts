// Direct Meta WhatsApp Cloud API client — no BSP (Twilio/360dialog) in between.
// Requires a Meta Business/WABA setup done outside this codebase: a verified
// WhatsApp Business phone number, an "Authentication" category template
// (one variable — the code — plus the native "Copy code" OTP button) approved
// by Meta, and a long-lived System User access token. See the OTP plan for
// the exact setup checklist.

const API_VERSION = process.env.WHATSAPP_API_VERSION || "v21.0"
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const TEMPLATE_NAME = process.env.WHATSAPP_OTP_TEMPLATE_NAME || "otp_code"

// When set, no real WhatsApp message is sent — the code is logged instead.
// Lets the whole OTP flow (generation, hashing, expiry, rate limits, login)
// be exercised locally without a configured Meta WABA.
const DEBUG_LOG = process.env.WHATSAPP_DEBUG_LOG === "true"

// Simulated mode: the signup route also hands the code back to the browser so the form fills itself
// in (nobody can receive a WhatsApp message yet). Turn WHATSAPP_DEBUG_LOG off once the WABA is live.
export const isWhatsappSimulated = () => DEBUG_LOG

// Zindua (https://zindua.run) — managed WhatsApp OTP API. Used when ZINDUA_API_KEY is set (and the
// simulated mode is off); otherwise the direct Meta Cloud API below is used.
const ZINDUA_API_KEY = process.env.ZINDUA_API_KEY
const ZINDUA_TEMPLATE = process.env.ZINDUA_OTP_TEMPLATE || "otp-verification"
const ZINDUA_URL = process.env.ZINDUA_API_URL || "https://zindua.run/api/v1/send"

// Numbers are stored and verified exactly as the customer typed them (e.g. "654815887" or
// "+237654815887"); only the outgoing message needs the international form. Local 9-digit
// Cameroon numbers get +237.
export function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (phone.trim().startsWith("+")) return `+${digits}`
  if (digits.startsWith("00")) return `+${digits.slice(2)}`
  if (digits.length === 9) return `+237${digits}`
  return `+${digits}`
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function postToZindua(phone: string, template: string, variables: Record<string, string>): Promise<void> {
  // Zindua protects its WhatsApp line: two sends less than ~1 s apart get a 429 ("Wait 1s"). If it still
  // happens, wait what it asks for and try again (at most 2 retries).
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(ZINDUA_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${ZINDUA_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        to: toE164(phone),
        channel: "whatsapp",
        template,
        variables,
        lang: "fr",
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (res.ok) return

    const body = await res.text().catch(() => "")
    if (res.status === 429 && attempt < 2) {
      let waitMs = 1500
      try {
        const retryAfter = Number(JSON.parse(body)?.retryAfterSec)
        if (Number.isFinite(retryAfter) && retryAfter > 0) waitMs = Math.min(5000, Math.ceil(retryAfter) * 1000 + 300)
      } catch {}
      await sleep(waitMs)
      continue
    }
    throw new Error(`Zindua error (${res.status}): ${body.slice(0, 300)}`)
  }
}

// Sends go one at a time, at least ZINDUA_MIN_GAP_MS apart, so two customers asking for a code in the
// same second don't make one of them fail.
const ZINDUA_MIN_GAP_MS = 1100
let zinduaQueue: Promise<unknown> = Promise.resolve()
let lastZinduaSend = 0

function sendViaZindua(phone: string, template: string, variables: Record<string, string>): Promise<void> {
  const run = zinduaQueue.then(async () => {
    const wait = lastZinduaSend + ZINDUA_MIN_GAP_MS - Date.now()
    if (wait > 0) await sleep(wait)
    try {
      await postToZindua(phone, template, variables)
    } finally {
      lastZinduaSend = Date.now()
    }
  })
  zinduaQueue = run.catch(() => undefined)
  return run
}

export async function sendWhatsappOtp(phone: string, code: string): Promise<void> {
  if (DEBUG_LOG) {
    console.log(`[whatsapp-client] DEBUG — would send OTP ${code} to ${phone} via template "${TEMPLATE_NAME}"`)
    return
  }

  if (ZINDUA_API_KEY) {
    return sendViaZindua(phone, ZINDUA_TEMPLATE, { code })
  }

  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    throw new Error(
      "WhatsApp Cloud API is not configured: set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN " +
      "(or set WHATSAPP_DEBUG_LOG=true to log codes instead of sending them, for local testing)."
    )
  }

  const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toE164(phone).slice(1), // Meta wants digits only, with the country code
      type: "template",
      template: {
        name: TEMPLATE_NAME,
        language: { code: "fr" },
        components: [
          { type: "body", parameters: [{ type: "text", text: code }] },
          // Meta's documented "copy code" button for Authentication templates
          // uses sub_type "url" in the send payload even though the button
          // itself was registered as an OTP/COPY_CODE button when the
          // template was created — this is the one field most likely to
          // need a tweak once tested against a real WABA.
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [{ type: "text", text: code }],
          },
        ],
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`WhatsApp Cloud API error (${res.status}): ${body}`)
  }
}

// Any other WhatsApp message (a template created in the Zindua dashboard, plain text with {{variables}}),
// e.g. the advisor told about a new scan. Only through Zindua: the direct Meta API would need a template
// approved by Meta for each one. Resolves to false when nothing could be sent (not configured).
export async function sendWhatsappTemplate(phone: string, template: string, variables: Record<string, string>): Promise<boolean> {
  if (DEBUG_LOG) {
    console.log(`[whatsapp-client] DEBUG — would send template "${template}" to ${phone}:`, variables)
    return true
  }
  if (!ZINDUA_API_KEY) {
    console.warn(`[whatsapp-client] ZINDUA_API_KEY is not set: template "${template}" not sent to ${phone}`)
    return false
  }
  await sendViaZindua(phone, template, variables)
  return true
}
