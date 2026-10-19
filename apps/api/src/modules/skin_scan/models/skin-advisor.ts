import { model } from "@medusajs/framework/utils"

// A skin advisor (client request, 2026-10-18): each new scan is given to one of the active advisors, who is
// told on WhatsApp and opens it in her own space on the shop (/conseillere), never in the admin.
export const SkinAdvisor = model.define("skin_advisor", {
  id: model.id({ prefix: "adv" }).primaryKey(),
  name: model.text(),
  whatsapp: model.text(), // digits with the country code, as in wa.me links (237…); also her login
  active: model.boolean().default(true),
  password_hash: model.text().nullable(), // scrypt (lib/skin-advisor-auth.ts), never the password itself
  // raised when her password changes or she is deactivated: her open sessions stop working
  session_version: model.number().default(0),
  last_assigned_at: model.dateTime().nullable(), // turn-taking: the one who waited longest gets the next scan
}).indexes([{ on: ["whatsapp"], unique: true, where: "deleted_at IS NULL" }])
