import { cookies } from "next/headers";
import { DeliverySettingsClient } from "./DeliverySettingsClient";

export const dynamic = "force-dynamic";

export default async function DeliverySettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    return <div className="p-8 text-red-500">Non autorisÃ©. Veuillez vous reconnecter.</div>;
  }

  return <DeliverySettingsClient token={token} />;
}
