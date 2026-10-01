
import { CREATOR_PARTNER_MODULE } from "../../../../modules/creator_partner"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AMBASSADOR_APPLICATION_MODULE } from "../../../../modules/ambassador_application"
import { createPromotionsWorkflow } from "@medusajs/medusa/core-flows"
import { Resend } from "resend"

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
    try {
      // 1. Find existing customer or fallback to email
      const query = req.scope.resolve("query")
      const { data: customers } = await query.graph({
        entity: "customer",
        fields: ["id", "email"],
        filters: { email: app.email }
      })
      const customerId = customers?.length > 0 ? customers[0].id : app.email

      const cpService = req.scope.resolve(CREATOR_PARTNER_MODULE) as any

      // 2. Read the configurable defaults instead of hardcoding 5%/10%
      const configs = await cpService.listProgramConfigs({}, {})
      const configMap: Record<string, string> = {}
      for (const c of configs) { configMap[c.key] = c.value }

      let newCustomerDiscount = 5
      try { if (configMap.new_customer_discount_pct) newCustomerDiscount = Number(JSON.parse(configMap.new_customer_discount_pct)) } catch {}

      let returningCustomerDiscount = 2
      try { if (configMap.returning_customer_discount_pct) returningCustomerDiscount = Number(JSON.parse(configMap.returning_customer_discount_pct)) } catch {}

      let tiers = [{ min: 0, max: 599999, rate: 3 }, { min: 600000, max: 999999, rate: 4 }, { min: 1000000, max: null, rate: 6 }]
      try { if (configMap.commission_tiers) tiers = JSON.parse(configMap.commission_tiers) } catch {}
      const startingCommissionRate = [...tiers].sort((a: any, b: any) => a.min - b.min)[0]?.rate ?? 3

      // 3. Generate a code, checking for collisions against existing creators
      const cleanName = app.first_name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z]/g, "");
      let code = `${cleanName}${newCustomerDiscount}`;
      let suffix = 1
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const collision = await cpService.listCreatorPartners({ code }, {})
        if (!collision.length) break
        suffix += 1
        code = `${cleanName}${newCustomerDiscount}${suffix}`
      }
      // Internal code for the returning-customer rate \u2014 never shown to the client,
      // resolved server-side by /store/creator/apply-code
      const codeReturning = `${code}R`

      // 4. Create CreatorPartner entry first, so both promotions can carry its id
      const storeUrl = process.env.STORE_URL || process.env.NEXT_PUBLIC_STORE_URL || "https://thewelfarecm.com"
      let creatorPartner: any = null
      try {
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

      } catch (err) {
        console.error("Workflow create error:", err);
      }
      
      // 4. Send Email Notification
      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "The Welfare <contact@thewelfare.store>",
          to: app.email,
          subject: "Bienvenue dans le programme Créateurs Partenaires The Welfare !",
          html: `
            <div style="font-family: sans-serif; max-w-2xl; margin: 0 auto; padding: 20px;">
              <h2>Bonjour ${app.first_name},</h2>
              <p>Félicitations ! Votre candidature pour devenir Créateur/Créatrice Partenaire The Welfare a été <strong>approuvée</strong>.</p>
              <p>Voici votre code promo personnel que vous pouvez partager avec votre communauté :</p>
              <div style="padding: 15px; background-color: #f4f4f4; border-radius: 8px; display: inline-block; font-size: 20px; font-weight: bold; color: #2A2424; margin: 15px 0;">
                ${code}
              </div>
              <p>Ce code offre <strong>${newCustomerDiscount}% de réduction</strong> sur notre boutique, et vous génère une commission de ${startingCommissionRate}% sur chaque vente associée (paliers progressifs selon vos ventes du mois).</p>
              <p>Si vous avez des questions, n hésitez pas à nous contacter.</p>
              <p>À très vite !<br><strong>L équipe The Welfare</strong></p>
            </div>
          `
        });
      }
    } catch (e) {
      console.error("Error creating promo or sending email:", e)
    }
  }

  res.json({ ambassador_application: app })
}

