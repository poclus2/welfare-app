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

export async function sendWhatsappOtp(phone: string, code: string): Promise<void> {
  if (DEBUG_LOG) {
    console.log(`[whatsapp-client] DEBUG — would send OTP ${code} to ${phone} via template "${TEMPLATE_NAME}"`)
    return
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
      to: phone.replace(/[^\d+]/g, ""),
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
