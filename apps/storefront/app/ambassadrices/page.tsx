"use client";

import { useAuthStore } from "@/store/auth";
import { LandingAmbassadrice } from "@/components/ambassadrices/landing";
import { DashboardInfluenceur } from "@/components/ambassadrices/dashboard";

export default function AmbassadricesPage() {
  const { role } = useAuthStore();

  return (
    <main className="flex flex-col w-full bg-[#FDFDFC]">
      {role === "INFLUENCEUR" ? <DashboardInfluenceur /> : <LandingAmbassadrice />}
    </main>
  );
}
