import { AbstractAuthModuleProvider, isString, MedusaError } from "@medusajs/framework/utils"
import { isPresent } from "@medusajs/framework/utils"
import scrypt from "scrypt-kdf"
import { verifySignupTicket } from "../../lib/login-ticket"
import { phoneSpellings } from "../../lib/phone-identity"

type PhonePassOptions = {
  hashConfig?: { logN: number; r: number; p: number }
}

/**
 * Auth provider mirroring Medusa's built-in emailpass provider, keyed on
 * `phone` instead of `email`. Kept as a sibling of `emailpass` (still used
 * for the admin "user" actor type) rather than a replacement of it.
 */
class PhonePassAuthService extends AbstractAuthModuleProvider {
  static identifier = "phonepass"
  static DISPLAY_NAME = "Phone/Password Authentication"

  protected config_: PhonePassOptions
  protected logger_: any

  constructor({ logger }: { logger: any }, options: PhonePassOptions) {
    // @ts-ignore
    super(...arguments)
    this.config_ = options
    this.logger_ = logger
  }

  async hashPassword(password: string) {
    const hashConfig = this.config_?.hashConfig ?? { logN: 15, r: 8, p: 1 }
    const passwordHash = await scrypt.kdf(password, hashConfig)
    return passwordHash.toString("base64")
  }

  async update(data: any, authIdentityService: any) {
    const { password, entity_id } = data ?? {}

    if (!entity_id) {
      return {
        success: false,
        error: `Cannot update ${this.provider} provider identity without entity_id`,
      }
    }

    if (!password || !isString(password)) {
      return { success: true }
    }

    let authIdentity
    try {
      const passwordHash = await this.hashPassword(password)
      const providerMetadata = await this.getProviderMetadata_(entity_id, authIdentityService)

      authIdentity = await authIdentityService.update(entity_id, {
        provider_metadata: {
          ...providerMetadata,
          password: passwordHash,
        },
      })
    } catch (error: any) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      authIdentity: this.sanitizeAuthIdentity_(authIdentity),
    }
  }

  async authenticate(userData: any, authIdentityService: any) {
    const { phone, password } = userData.body ?? {}

    if (!password || !isString(password)) {
      return { success: false, error: "Password should be a string" }
    }
    if (!phone || !isString(phone)) {
      return { success: false, error: "Phone should be a string" }
    }

    // The number may have been stored under another spelling at signup (lib/phone-identity.ts)
    let identities: any[]
    try {
      identities = await this.findIdentities_(phone, authIdentityService)
    } catch (error: any) {
      return { success: false, error: error.message }
    }

    for (const authIdentity of identities) {
      const passwordHash = this.getProviderIdentity_(authIdentity)?.provider_metadata?.password
      if (isString(passwordHash) && (await scrypt.verify(Buffer.from(passwordHash, "base64"), password))) {
        return { success: true, authIdentity: this.sanitizeAuthIdentity_(authIdentity) }
      }
    }

    return { success: false, error: "Invalid phone number or password" }
  }

  async register(userData: any, authIdentityService: any) {
    const { phone, password } = userData.body ?? {}

    if (!password || !isString(password)) {
      return { success: false, error: "Password should be a string" }
    }
    if (!phone || !isString(phone)) {
      return { success: false, error: "Phone should be a string" }
    }
    // The number must have been verified by WhatsApp code just before (see lib/login-ticket.ts)
    const { signup_ticket } = userData.body ?? {}
    if (!isString(signup_ticket) || !verifySignupTicket(signup_ticket, phone)) {
      return { success: false, error: "Vérification du numéro expirée. Redemandez un code." }
    }

    try {
      // The same number under another spelling is the same person: no second identity for it
      const identities = await this.findIdentities_(phone, authIdentityService)
      if (identities.some((identity) => isPresent(identity.app_metadata))) {
        return { success: false, error: "Identity with phone number already exists" }
      }

      // If app_metadata is not defined or empty, no actor was assigned yet (still "claimable")
      const claimable = identities[0]
      if (claimable) {
        const updatedAuthIdentity = await this.upsertAuthIdentity("update", {
          phone: this.getProviderIdentity_(claimable).entity_id,
          password,
          authIdentityService,
        })
        return { success: true, authIdentity: updatedAuthIdentity }
      }

      const createdAuthIdentity = await this.upsertAuthIdentity("create", {
        phone,
        password,
        authIdentityService,
      })
      return { success: true, authIdentity: createdAuthIdentity }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // The identities stored under any spelling of this number, the exact spelling first
  async findIdentities_(phone: string, authIdentityService: any): Promise<any[]> {
    const found: any[] = []
    for (const entityId of phoneSpellings(phone)) {
      try {
        const identity = await authIdentityService.retrieve({ entity_id: entityId })
        if (!found.some((f) => f.id === identity.id)) found.push(identity)
      } catch (error: any) {
        if (error.type !== MedusaError.Types.NOT_FOUND) throw error
      }
    }
    return found
  }

  async upsertAuthIdentity(
    type: "create" | "update",
    { phone, password, authIdentityService }: { phone: string; password: string; authIdentityService: any }
  ) {
    const passwordHash = await this.hashPassword(password)
    const providerMetadata: Record<string, any> =
      type === "update" ? await this.getProviderMetadata_(phone, authIdentityService) : {}
    providerMetadata.password = passwordHash

    const authIdentity =
      type === "create"
        ? await authIdentityService.create({ entity_id: phone, provider_metadata: providerMetadata })
        : await authIdentityService.update(phone, { provider_metadata: providerMetadata })

    return this.sanitizeAuthIdentity_(authIdentity)
  }

  async getProviderMetadata_(entityId: string, authIdentityService: any) {
    const authIdentity = await authIdentityService.retrieve({ entity_id: entityId })
    const providerIdentity = this.getProviderIdentity_(authIdentity)
    return { ...(providerIdentity?.provider_metadata ?? {}) }
  }

  sanitizeAuthIdentity_(authIdentity: any) {
    const copy = JSON.parse(JSON.stringify(authIdentity))
    const providerIdentity = this.getProviderIdentity_(copy)
    if (providerIdentity?.provider_metadata) {
      delete providerIdentity.provider_metadata.password
    }
    return copy
  }

  getProviderIdentity_(authIdentity: any) {
    return authIdentity.provider_identities?.find((pi: any) => pi.provider === this.provider)
  }
}

export default PhonePassAuthService
