import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { Resend } from "resend"

export default async function loyaltyRegistration({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const query = container.resolve("query")
    
    // Fetch the order with customer details
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "email", "customer_id", "first_name", "last_name"],
      filters: { id: data.id }
    })
    
    if (!orders || orders.length === 0) return
    const order = orders[0]

    // If order already has a customer, they are already registered
    if (order.customer_id) {
      console.log(`Order ${order.id} already linked to customer ${order.customer_id}. Skipping loyalty email.`)
      return
    }

    // Initialize Resend
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY is not set. Cannot send loyalty registration email.")
      return
    }
    
    const resend = new Resend(resendApiKey)
    const storeUrl = process.env.STORE_CORS?.split(",")[0] || "https://thewelfare.store"
    const registerUrl = `${storeUrl}/account/register?email=${encodeURIComponent(order.email)}`

    // Send the magic link email
    const { error } = await resend.emails.send({
      from: "The Welfare Shop <hello@thewelfare.store>", // Resend requires a verified domain to send from
      to: [order.email],
      subject: "?? Votre programme de fid�lit� The Welfare",
      html: `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #2A2424;">
          <h2 style="color: #2A2424; font-weight: 300;">F�licitations pour votre commande !</h2>
          <p>Bonjour ${order.first_name || ""},</p>
          <p>Merci pour votre achat sur The Welfare Shop. Saviez-vous que vous venez de d�bloquer des points de fid�lit� ?</p>
          <p>Pour activer votre compte, cumuler vos points, et suivre vos commandes, il vous suffit de choisir un mot de passe en cliquant sur le lien ci-dessous :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${registerUrl}" style="background-color: #2A2424; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Activer mon compte fid�lit�</a>
          </div>
          <p style="font-size: 14px; color: #666;">Si vous avez d�j� un compte, vous pouvez ignorer cet e-mail.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #999;">The Welfare Shop - R�v�lez la science d'une peau rayonnante.</p>
        </div>
      `
    })

    if (error) {
      console.error("Failed to send loyalty registration email:", error)
    } else {
      console.log(`Loyalty registration email sent to ${order.email}`)
    }

  } catch (err) {
    console.error("Error in loyalty registration subscriber:", err)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
