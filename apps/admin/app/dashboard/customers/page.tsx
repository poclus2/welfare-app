import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";
import CustomersClient, { Customer } from "./CustomersClient";

export const dynamic = "force-dynamic";

// Mirrors the storefront's loyalty formula (apps/storefront/app/account/page.tsx)
// so the tier shown here always matches what the customer sees themselves.
const LOYALTY_TIERS = [
  { name: "Découverte", min: 0, max: 500, color: "#8B7B7B" },
  { name: "Bien-être", min: 500, max: 1500, color: "#C97C85" },
  { name: "Prestige", min: 1500, max: 3000, color: "#9B59B6" },
  { name: "Élite", min: 3000, max: Infinity, color: "#F59E0B" },
];

function getLoyaltyTier(points: number) {
  return LOYALTY_TIERS.find((t) => points >= t.min && points < t.max) || LOYALTY_TIERS[0];
}

export default async function CustomersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) return null;

  const [customersData, ordersData, creatorPartnersData] = await Promise.all([
    fetchAdmin<{ customers: any[]; count: number }>(`/customers?limit=100&fields=*,*addresses`, token).catch(() => ({ customers: [], count: 0 })),
    fetchAdmin<{ orders: any[] }>(`/orders?limit=999`, token).catch(() => ({ orders: [] })),
    fetchAdmin<{ creator_partners: any[] }>(`/creator-partners`, token).catch(() => ({ creator_partners: [] })),
  ]);

  const ordersByCustomer: Record<string, any[]> = {};
  ordersData.orders.forEach(o => {
    if (o.customer_id) {
      if (!ordersByCustomer[o.customer_id]) ordersByCustomer[o.customer_id] = [];
      ordersByCustomer[o.customer_id].push(o);
    }
  });

  const creatorPartnerByCustomer: Record<string, any> = {};
  creatorPartnersData.creator_partners.forEach(cp => {
    if (cp.customer_id) creatorPartnerByCustomer[cp.customer_id] = cp;
  });

  // Map Medusa customers to UI customers
  const mappedCustomers: Customer[] = customersData.customers.map((c) => {
    const customerOrders = (ordersByCustomer[c.id] || [])
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const ordersCount = customerOrders.length;

    const totalSpent = customerOrders.reduce((acc: number, o: any) => acc + (o.total || 0), 0) || 0;
    const aov = ordersCount > 0 ? Math.round(totalSpent / ordersCount) : 0;
    const loyaltyPoints = customerOrders.reduce((acc: number, o: any) => acc + Math.floor((o.total || 0) / 100), 0);
    const loyaltyTier = getLoyaltyTier(loyaltyPoints);

    const orders = customerOrders.map((o: any) => {
      let status = "pending_payment";
      if (o.payment_status === "captured" || o.payment_status === "paid") {
        status = "paid";
      }
      if (o.status === "completed" || o.fulfillment_status === "delivered") {
        status = "delivered";
      } else if (o.status === "canceled") {
        status = "cancelled";
      } else if (o.fulfillment_status === "shipped") {
        status = "shipped";
      }

      return {
        id: `WLF-${o.display_id || o.id.split('_')[1]?.substring(0, 5).toUpperCase() || 'XXX'}`,
        rawId: o.id,
        amount: o.total || 0,
        status,
        date: new Date(o.created_at).toLocaleString("fr-FR", {
          day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
        })
      };
    });

    let customerName = "Client Inconnu";
    if (c.first_name || c.last_name) {
      customerName = `${c.first_name || ""} ${c.last_name || ""}`.trim();
    } else if (customerOrders[0]?.shipping_address?.first_name || customerOrders[0]?.shipping_address?.last_name) {
      const sa = customerOrders[0].shipping_address;
      customerName = `${sa.first_name || ""} ${sa.last_name || ""}`.trim();
    }

    const addresses = (c.addresses || []).map((a: any) => ({
      id: a.id,
      firstName: a.first_name || "",
      lastName: a.last_name || "",
      address1: a.address_1 || "",
      address2: a.address_2 || "",
      city: a.city || "",
      province: a.province || "",
      postalCode: a.postal_code || "",
      countryCode: (a.country_code || "").toUpperCase(),
      phone: a.phone || "",
      isDefaultShipping: !!a.is_default_shipping,
      isDefaultBilling: !!a.is_default_billing,
    }));

    const creatorPartner = creatorPartnerByCustomer[c.id]
      ? {
          code: creatorPartnerByCustomer[c.id].code,
          status: creatorPartnerByCustomer[c.id].status,
          isCreatorOfMonth: !!creatorPartnerByCustomer[c.id].is_creator_of_month,
        }
      : null;

    return {
      id: c.id,
      name: customerName || "Client Inconnu",
      email: c.email || "—",
      phone: c.phone || "—",
      ordersCount,
      totalSpent,
      aov,
      loyaltyPoints,
      loyaltyTier,
      hasAccount: c.has_account,
      date: new Date(c.created_at).toLocaleString("fr-FR", {
        day: "2-digit", month: "short", year: "numeric"
      }),
      orders,
      addresses,
      creatorPartner,
    };
  });

  return <CustomersClient initialCustomers={mappedCustomers} totalCount={customersData.count} />;
}
