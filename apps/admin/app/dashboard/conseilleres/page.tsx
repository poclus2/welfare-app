import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";
import AdvisorsClient, { Advisor } from "./AdvisorsClient";

export const dynamic = "force-dynamic";

const SHOP_URL = (process.env.NEXT_PUBLIC_SHOP_URL || "https://thewelfarecm.com").replace(/\/+$/, "");

export default async function AdvisorsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) return null;

  const data = await fetchAdmin<{ advisors: Advisor[] }>(`/skin-advisors`, token).catch(() => ({ advisors: [] }));

  return <AdvisorsClient advisors={data.advisors} spaceUrl={`${SHOP_URL}/conseillere`} />;
}
