"use client";

import { useAuthStore } from "@/store/auth";
import { LandingAmbassadrice } from "@/components/ambassadrices/landing";
import { DashboardInfluenceur } from "@/components/ambassadrices/dashboard";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/home/footer";

export default function AmbassadricesPage() {
  const { role, setRole } = useAuthStore();

  return (
    <main className="min-h-screen bg-[#FDFDFC] flex flex-col w-full">
      <Navbar />
      
      <div className="flex-1">
        {role === "INFLUENCEUR" ? <DashboardInfluenceur /> : <LandingAmbassadrice />}
      </div>
      
      <Footer />

      {/* Dev Tool to toggle roles for testing */}
      <div className="fixed bottom-4 right-4 bg-white border border-[#F4EAEB] shadow-2xl rounded-xl p-4 z-50 text-xs flex flex-col gap-2">
        <p className="font-bold text-[#2A2424] mb-1">Simuler un Rôle</p>
        <button onClick={() => setRole("GUEST")} className={`px-4 py-2 rounded-lg font-medium transition-colors ${role === "GUEST" ? "bg-[#2A2424] text-white" : "bg-[#F8F5F2] text-[#2A2424]/70 hover:bg-[#F4EAEB]"}`}>GUEST</button>
        <button onClick={() => setRole("CUSTOMER")} className={`px-4 py-2 rounded-lg font-medium transition-colors ${role === "CUSTOMER" ? "bg-[#2A2424] text-white" : "bg-[#F8F5F2] text-[#2A2424]/70 hover:bg-[#F4EAEB]"}`}>CUSTOMER</button>
        <button onClick={() => setRole("INFLUENCEUR")} className={`px-4 py-2 rounded-lg font-medium transition-colors ${role === "INFLUENCEUR" ? "bg-[#2A2424] text-white" : "bg-[#F8F5F2] text-[#2A2424]/70 hover:bg-[#F4EAEB]"}`}>INFLUENCEUR</button>
      </div>
    </main>
  );
}
