
import { CREATOR_PARTNER_MODULE } from "../../../../modules/creator_partner"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AMBASSADOR_APPLICATION_MODULE } from "../../../../modules/ambassador_application"
import { createPromotionsWorkflow } from "@medusajs/medusa/core-flows"
import { Resend } from "resend"
import { EMAIL_FROM } from "../../../../lib/email"
import { findCustomerIdByPhone } from "../../../../lib/creator-account"

const escapeHtml = (s: string) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!))

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(AMBASSADOR_APPLICATION_MODULE) as any
  const app = await service.retrieveAmbassadorApplication(req.params.id)
  res.json({ ambassador_application: app })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(AMBASSADOR_APPLICATION_MODULE) as any
  const oldApp = await service.retrieveAmbassadorApplication(req.params.id)
  const app = await service.updateAmbassadorApplications({ id: req.params.id, ...(req.body as any) })

  // If we just approved the application
  if ((req.body as any).status === "approved" && oldApp.status !== "approved") {
    const cpService = req.scope.resolve(CREATOR_PARTNER_MODULE) as any
    let creatorPartner: any = null
    let code = ""
    let customerId: string | null = null
    let newCustomerDiscount = 5
    let startingCommissionRate = 3

    try {
      // 1. Her customer account, found by the (verified) phone she signed up with. None yet: the space is
      //    tied to her account the first time she logs in with that number (lib/creator-account.ts).
      customerId = await findCustomerIdByPhone(req.scope, app.phone)
      // One account, one creator space
      if (customerId && (await cpService.listCreatorPartners({ customer_id: customerId }, {})).length) {
        customerId = null
      }

      // 2. Read the configurable defaults instead of hardcoding 5%/10%
      const configs = await cpService.listProgramConfigs({}, {})
      const configMap: Record<string, string> = {}
      for (const c of configs) { configMap[c.key] = c.value }

      try { if (configMap.new_customer_discount_pct) newCustomerDiscount = Number(JSON.parse(configMap.new_customer_discount_pct)) } catch {}

      let returningCustomerDiscount = 2
      try { if (configMap.returning_customer_discount_pct) returningCustomerDiscount = Number(JSON.parse(configMap.returning_customer_discount_pct)) } catch {}

      let tiers = [{ min: 0, max: 599999, rate: 3 }, { min: 600000, max: 999999, rate: 4 }, { min: 1000000, max: null, rate: 6 }]
      try { if (configMap.commission_tiers) tiers = JSON.parse(configMap.commission_tiers) } catch {}
      startingCommissionRate = [...tiers].sort((a: any, b: any) => a.min - b.min)[0]?.rate ?? 3

      // 3. Generate a code, checking for collisions against existing creators
      const cleanName = app.first_name.toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Z]/g, "");
      code = `${cleanName}${newCustomerDiscount}`;
      let suffix = 1
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const collision = await cpService.listCreatorPartners({ code }, {})
        if (!collision.length) break
        suffix += 1
        code = `${cleanName}${newCustomerDiscount}${suffix}`
      }
      // Internal code for the returning-customer rate — never shown to the client,
      // resolved server-side by /store/creator/apply-code
      const codeReturning = `${code}R`

      // 4. Create CreatorPartner entry first, so both promotions can carry its id
      const storeUrl = process.env.STORE_URL || process.env.NEXT_PUBLIC_STORE_URL || "https://thewelfarecm.com"
      creatorPartner = await cpService.createCreatorPartners({
        application_id: req.params.id,
        customer_id: customerId,
        first_name: app.first_name,
        last_name: app.last_name,
        email: app.email,
        phone: app.phone,
        code: code,
        code_returning: codeReturning,
        referral_link: `${storeUrl}/r/${code}`,
        instagram: app.instagram,
        tiktok: app.tiktok,
        youtube: app.youtube,
        other_link: app.other_link,
      })

      // 5. Create the two Promotions (new-customer + returning-customer rate)
      await createPromotionsWorkflow(req.scope).run({
        input: {
          promotionsData: [
            {
              code: code,
              type: "standard",
              status: "active",
              is_automatic: false,
              application_method: {
                type: "percentage",
                target_type: "order",
                value: newCustomerDiscount
              },
              // @ts-ignore
              metadata: {
                is_influencer: true,
                is_creator_partner: true,
                influencer_id: customerId,
                creator_partner_id: creatorPartner.id,
                application_scope: "new_customer",
                commission_rate: startingCommissionRate
              }
            } as any,
            {
              code: codeReturning,
              type: "standard",
              status: "active",
              is_automatic: false,
              application_method: {
                type: "percentage",
                target_type: "order",
                value: returningCustomerDiscount
              },
              // @ts-ignore
              metadata: {
                is_influencer: true,
                is_creator_partner: true,
                influencer_id: customerId,
                creator_partner_id: creatorPartner.id,
                application_scope: "returning_customer",
                commission_rate: startingCommissionRate
              }
            } as any
          ]
        }
      });
    } catch (err: any) {
      // Never leave an "approved" application with no working creator space behind it (nor send a
      // welcome e-mail with a code that doesn't exist): undo, and tell the admin so she can retry.
      console.error("[ambassador-approval] creator creation failed:", err)
      if (creatorPartner?.id) {
        await cpService.deleteCreatorPartners(creatorPartner.id).catch(() => {})
      }
      const reverted = await service.updateAmbassadorApplications({ id: req.params.id, status: oldApp.status })
      res.status(500).json({
        message: "La création de l'espace créatrice a échoué, la candidature n'a pas été validée. Réessayez.",
        ambassador_application: reverted,
      })
      return
    }

    // 6. Welcome e-mail with her code and the way into her dashboard
    if (process.env.RESEND_API_KEY) {
      try {
        const storefrontUrl = process.env.STORE_URL || process.env.NEXT_PUBLIC_STORE_URL || "https://thewelfarecm.com"
        const dashboardRedirect = encodeURIComponent("/ambassadrices")
        const accountUrl = customerId
          ? `${storefrontUrl}/account/login?redirect=${dashboardRedirect}`
          : `${storefrontUrl}/account/register?phone=${encodeURIComponent(app.phone || "")}&email=${encodeURIComponent(app.email || "")}&redirect=${dashboardRedirect}`
        const accountHint = customerId
          ? "Connectez-vous à votre compte The Welfare pour suivre vos ventes et vos commissions :"
          : `Créez votre compte The Welfare avec le numéro WhatsApp de votre candidature (${escapeHtml(app.phone || "")}) pour suivre vos ventes et vos commissions :`

        const resend = new Resend(process.env.RESEND_API_KEY);
        const { error } = await resend.emails.send({
          from: EMAIL_FROM,
          to: app.email,
          subject: "Bienvenue dans le programme Créateurs Partenaires The Welfare !",
          html: `
            <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; padding: 20px;">
              <h2>Bonjour ${escapeHtml(app.first_name)},</h2>
              <p>Félicitations ! Votre candidature pour devenir Créateur/Créatrice Partenaire The Welfare a été <strong>approuvée</strong>.</p>
              <p>Voici votre code promo personnel que vous pouvez partager avec votre communauté :</p>
              <div style="padding: 15px; background-color: #f4f4f4; border-radius: 8px; display: inline-block; font-size: 20px; font-weight: bold; color: #2A2424; margin: 15px 0;">
                ${code}
              </div>
              <p>Ce code offre <strong>${newCustomerDiscount}% de réduction</strong> sur notre boutique, et vous génère une commission de ${startingCommissionRate}% sur chaque vente associée (paliers progressifs selon vos ventes du mois).</p>
              <p>${accountHint}</p>
              <p style="margin: 24px 0;">
                <a href="${accountUrl}" style="background-color: #2A2424; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Accéder à mon espace créatrice</a>
              </p>
              <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
              <p>À très vite !<br><strong>L'équipe The Welfare</strong></p>
            </div>
          `
        });
        if (error) console.error("[ambassador-approval] welcome e-mail rejected:", error)
      } catch (e) {
        console.error("[ambassador-approval] welcome e-mail failed:", e)
      }
    }
  }

  res.json({ ambassador_application: app })
}
