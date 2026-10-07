"use server";

import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";
import { revalidatePath } from "next/cache";

// Withdrawal from the PawaPay wallet to one of the shop's Mobile Money accounts. Every check (allowed
// number, payouts enabled, limits, balance) is done by the API route, not here.
export async function requestPayoutAction(amount: number, msisdn: string, note: string) {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) return { success: false, error: "Non autorisé : veuillez vous reconnecter." };
  try {
    const res = await fetchAdmin<{ payout: any }>("/pawapay/payouts", token, {
      method: "POST",
      body: JSON.stringify({ amount, msisdn, note }),
    });
    revalidatePath("/dashboard/payments");
    return { success: true, payout: res.payout };
  } catch (error: any) {
    revalidatePath("/dashboard/payments");
    return { success: false, error: error.message };
  }
}
