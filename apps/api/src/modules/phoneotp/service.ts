import { AbstractAuthModuleProvider, isString } from "@medusajs/framework/utils"
import { verifyLoginTicket } from "../../lib/login-ticket"

/**
 * Passwordless login by WhatsApp OTP. Never creates accounts — it only
 * authenticates a phone identity created elsewhere (by `phonepass` at
 * signup). This provider's module container is isolated from sibling app
 * modules (the `otp` module, the full auth module service), so it can't
 * verify the OTP or look up the auth identity itself. Instead it trusts a
 * short-lived signed ticket issued by `/store/otp/verify` — which does have
 * full container access — after that route has already verified the code
 * and resolved the matching identity. See `lib/login-ticket.ts`.
 */
class PhoneOtpAuthService extends AbstractAuthModuleProvider {
  static identifier = "phoneotp"
  static DISPLAY_NAME = "Phone/WhatsApp OTP Authentication"

  protected logger_: any

  constructor({ logger }: any, options: any) {
    // @ts-ignore
    super(...arguments)
    this.logger_ = logger
  }

  async authenticate(userData: any) {
    const { ticket } = userData.body ?? {}

    if (!ticket || !isString(ticket)) {
      return { success: false, error: "Ticket should be a string" }
    }

    const authIdentity = verifyLoginTicket(ticket)
    if (!authIdentity) {
      return { success: false, error: "Session de connexion expirée. Redemandez un code." }
    }

    return { success: true, authIdentity }
  }
}

export default PhoneOtpAuthService
