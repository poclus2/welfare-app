
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

      // 2. Generate a code
      const cleanName = app.first_name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z]/g, "");
      const code = `${cleanName}5`;

      // 3. Create Promotion
      try {
        await createPromotionsWorkflow(req.scope).run({
          input: {
            promotionsData: [{
              code: code,
              type: "standard",
              is_automatic: false,
              application_method: {
                type: "percentage",
                target_type: "order",
                value: 5
              },
              // @ts-ignore
              metadata: {
                is_influencer: true,
                is_creator_partner: true,
                influencer_id: customerId,
                commission_rate: 10
              }
            } as any]
          }
        });
        
        // Create CreatorPartner entry
        const cpService = req.scope.resolve(CREATOR_PARTNER_MODULE) as any
        const storeUrl = process.env.STORE_URL || process.env.NEXT_PUBLIC_STORE_URL || "https://thewelfare.store"
        await cpService.createCreatorPartners({
          application_id: req.params.id,
          customer_id: customerId,
          first_name: app.first_name,
          last_name: app.last_name,
          email: app.email,
          phone: app.phone,
          code: code,
          referral_link: `${storeUrl}/r/${code}`,
          instagram: app.instagram,
          tiktok: app.tiktok,
          youtube: app.youtube,
          other_link: app.other_link,
        })
        
      } catch (err) {
        console.error("Workflow create error:", err);
      }
      
      // 4. Send Email Notification
      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "The Welfare <contact@thewelfare.store>",
          to: app.email,
          subject: "Bienvenue dans l équipe des Ambassadrices The Welfare !",
          html: `
            <div style="font-family: sans-serif; max-w-2xl; margin: 0 auto; padding: 20px;">
              <h2>Bonjour ${app.first_name},</h2>
              <p>Félicitations ! Votre candidature pour devenir ambassadrice The Welfare a été <strong>approuvée</strong>.</p>
              <p>Voici votre code promo personnel que vous pouvez partager avec votre communauté :</p>
              <div style="padding: 15px; background-color: #f4f4f4; border-radius: 8px; display: inline-block; font-size: 20px; font-weight: bold; color: #2A2424; margin: 15px 0;">
                ${code}
              </div>
              <p>Ce code offre <strong>5% de réduction</strong> sur notre boutique, et vous génère une commission de 10% sur chaque vente associée.</p>
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

