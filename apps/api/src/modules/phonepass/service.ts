import { AbstractAuthModuleProvider, isString, MedusaError } from "@medusajs/framework/utils"
import { isPresent } from "@medusajs/utils"
import scrypt from "scrypt-kdf"

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

    let authIdentity
    try {
      authIdentity = await authIdentityService.retrieve({ entity_id: phone })
    } catch (error: any) {
      if (error.type === MedusaError.Types.NOT_FOUND) {
        return { success: false, error: "Invalid phone number or password" }
      }
      return { success: false, error: error.message }
    }

    const providerIdentity = authIdentity.provider_identities?.find(
      (pi: any) => pi.provider === this.provider
    )
    const passwordHash = providerIdentity?.provider_metadata?.password

    if (isString(passwordHash)) {
      const buf = Buffer.from(passwordHash, "base64")
      const success = await scrypt.verify(buf, password)
      if (success) {
        return { success, authIdentity: this.sanitizeAuthIdentity_(authIdentity) }
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

    try {
      const identity = await authIdentityService.retrieve({ entity_id: phone })

      // If app_metadata is not defined or empty, no actor was assigned yet (still "claimable")
      if (!isPresent(identity.app_metadata)) {
        const updatedAuthIdentity = await this.upsertAuthIdentity("update", {
          phone,
          password,
          authIdentityService,
        })
        return { success: true, authIdentity: updatedAuthIdentity }
      }

      return { success: false, error: "Identity with phone number already exists" }
    } catch (error: any) {
      if (error.type === MedusaError.Types.NOT_FOUND) {
        const createdAuthIdentity = await this.upsertAuthIdentity("create", {
          phone,
          password,
          authIdentityService,
        })
        return { success: true, authIdentity: createdAuthIdentity }
      }
      return { success: false, error: error.message }
    }
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
