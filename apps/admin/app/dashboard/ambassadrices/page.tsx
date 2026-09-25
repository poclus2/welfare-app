import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";
import { AmbassadorClient } from "./AmbassadorClient";

export const dynamic = "force-dynamic";

export default async function AmbassadorApplicationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;

  // 1. Fetch applications
  const appsData = await fetchAdmin<{ ambassador_applications: any[] }>(
    `/ambassador-applications?limit=500`,
    token
  ).catch((e) => {
    console.error("Error fetching ambassador apps:", e);
    return { ambassador_applications: [] };
  });

  const applications = appsData.ambassador_applications || [];

  // 2. Fetch influencers stats
  const statsData = await fetchAdmin<{ influencers: any[] }>(
    `/influencer-stats`,
    token
  ).catch((e) => {
    console.error("Error fetching influencer stats:", e);
    return { influencers: [] };
  });

  let influencers = statsData.influencers || [];

  return (
    <AmbassadorClient 
      applications={applications} 
      influencers={influencers} 
    />
  );
}
