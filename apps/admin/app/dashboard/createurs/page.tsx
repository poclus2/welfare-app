import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";
import { CreateursClient } from "./CreateursClient";

export const dynamic = "force-dynamic";

export default async function CreateursPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;

  const [appsData, leaderboardData, creatorsData, configData] = await Promise.all([
    fetchAdmin<{ ambassador_applications: any[] }>(`/ambassador-applications?limit=500`, token).catch((e) => {
      console.error("Error fetching applications:", e);
      return { ambassador_applications: [] };
    }),
    fetchAdmin<{ leaderboard: any[]; year: number; month: number }>(`/creator-leaderboard`, token).catch((e) => {
      console.error("Error fetching leaderboard:", e);
      return { leaderboard: [], year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
    }),
    fetchAdmin<{ creator_partners: any[] }>(`/creator-partners`, token).catch((e) => {
      console.error("Error fetching creator partners:", e);
      return { creator_partners: [] };
    }),
    fetchAdmin<{ config: any }>(`/program-config`, token).catch((e) => {
      console.error("Error fetching program config:", e);
      return { config: null };
    }),
  ]);

  return (
    <CreateursClient
      applications={appsData.ambassador_applications || []}
      leaderboard={leaderboardData.leaderboard || []}
      period={{ year: leaderboardData.year, month: leaderboardData.month }}
      creators={creatorsData.creator_partners || []}
      initialConfig={configData.config}
    />
  );
}
