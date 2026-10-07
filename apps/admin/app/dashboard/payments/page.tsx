import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";
import PaymentsClient, { Overview } from "./PaymentsClient";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) return null;

  let overview: Overview | null = null;
  let error = "";
  try {
    overview = await fetchAdmin<Overview>("/pawapay/overview", token);
  } catch (e: any) {
    console.error("Failed to load PawaPay overview", e);
    error = e.message || "Impossible de charger les paiements.";
  }

  return <PaymentsClient overview={overview} error={error} />;
}
