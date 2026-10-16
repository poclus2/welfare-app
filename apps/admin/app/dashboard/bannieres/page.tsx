import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BannersClient } from "./BannersClient";

export const dynamic = "force-dynamic";

export default async function BannersPage() {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) redirect("/login");
  return <BannersClient />;
}
