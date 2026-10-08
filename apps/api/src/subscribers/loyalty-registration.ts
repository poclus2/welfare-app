import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { Resend } from "resend"
import { pointsForTotal } from "../lib/loyalty"
import { EMAIL_FROM } from "../lib/email"

// order.placed: credit loyalty points to the customer (once per order), and invite guests to open an
// account so they can collect them.
export default async function loyaltyRegistration({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const query = container.resolve("query")

    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "email", "customer_id", "total", "metadata", "customer.*", "shipping_address.first_name"],
      filters: { id: data.id },
    })

    if (!orders || orders.length === 0) return
    const order: any = orders[0]

    const earnedPoints = pointsForTotal(order.total)

    // Points go to customers with an account — and only once per order, even if the event is replayed
    if (order.customer_id && earnedPoints > 0 && order.metadata?.loyalty_points_earned == null) {
      try {
        const customerModuleService = container.resolve(Modules.CUSTOMER)
        const orderModuleService: any = container.resolve(Modules.ORDER)
        const currentPoints = Number(order.customer?.metadata?.loyalty_points) || 0
        const newPoints = currentPoints + earnedPoints

        await customerModuleService.updateCustomers(order.customer_id, {
          metadata: { ...(order.customer?.metadata || {}), loyalty_points: newPoints },
        })
        // remembered on the order so a cancellation can take exactly these points back
        await orderModuleService.updateOrders([
          { id: order.id, metadata: { ...(order.metadata || {}), loyalty_points_earned: earnedPoints } },
        ])
        console.log(`Attributed ${earnedPoints} loyalty points to customer ${order.customer_id}. New total: ${newPoints}`)
      } catch (err) {
        console.error("Error updating customer loyalty points:", err)
      }
    }

    // If the order already has a customer, they are already registered
    if (order.customer_id) {
      console.log(`Order ${order.id} already linked to customer ${order.customer_id}. Skipping loyalty registration email.`)
      return
    }
    if (!order.email) return

    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY is not set. Cannot send loyalty registration email.")
      return
    }

    const resend = new Resend(resendApiKey)
    const storeUrl = process.env.STORE_CORS?.split(",")[0] || "https://thewelfarecm.com"
    const registerUrl = `${storeUrl}/account/register?email=${encodeURIComponent(order.email)}`
    const from = process.env.LOYALTY_EMAIL_FROM || EMAIL_FROM
    const firstName = order.shipping_address?.first_name || ""

    const { error } = await resend.emails.send({
      from,
      to: [order.email],
      subject: "Votre programme de fidélité The Welfare",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #2A2424;">
          <h2 style="color: #2A2424; font-weight: 300;">Félicitations pour votre commande !</h2>
          <p>Bonjour ${firstName},</p>
          <p>Merci pour votre achat sur The Welfare Shop. Saviez-vous que vous venez de débloquer <strong>${earnedPoints} points de fidélité</strong> ?</p>
          <p>Pour activer votre compte, cumuler vos points et suivre vos commandes, il vous suffit de créer votre compte en cliquant sur le lien ci-dessous :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${registerUrl}" style="background-color: #2A2424; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Activer mon compte fidélité</a>
          </div>
          <p style="font-size: 14px; color: #666;">Si vous avez déjà un compte, vous pouvez ignorer cet e-mail.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #999;">The Welfare Shop - Révélez la science d'une peau rayonnante.</p>
        </div>
      `,
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
