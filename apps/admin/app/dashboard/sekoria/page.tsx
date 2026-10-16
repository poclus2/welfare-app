import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SekoriaClient } from "./SekoriaClient";

export const dynamic = "force-dynamic";

export default async function SekoriaPage() {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) redirect("/login");
  return <SekoriaClient />;
}
