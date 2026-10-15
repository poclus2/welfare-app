"use client";

import { useEffect, useState } from "react";
import { CircleNotch } from "@phosphor-icons/react";
import { sdk } from "@/lib/medusa";
import { LandingAmbassadrice } from "@/components/ambassadrices/landing";
import { DashboardInfluenceur } from "@/components/ambassadrices/dashboard";
import { SK } from "@/components/ui/skin-coach/theme";

// A logged-in customer whose account is a creator space sees her dashboard; everyone else
// (logged out, or a customer who isn't a creator) sees the programme page.
export default function AmbassadricesPage() {
  const [state, setState] = useState<"loading" | "guest" | "customer" | "creator">("loading");
  const [creatorData, setCreatorData] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    sdk.client
      .fetch("/store/creator/me", { method: "GET" })
      .then((data: any) => {
        if (cancelled) return;
        setCreatorData(data);
        setState("creator");
      })
      .catch((err: any) => {
        if (cancelled) return;
        // 404: logged in but not a creator; 401: not logged in
        setState(err?.status === 404 ? "customer" : "guest");
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="flex flex-col w-full" style={{ background: SK.ground }}>
      {state === "loading" ? (
        <div className="w-full flex items-center justify-center py-32">
          <CircleNotch className="w-10 h-10 animate-spin" style={{ color: SK.accent }} />
        </div>
      ) : state === "creator" ? (
        <DashboardInfluenceur initialData={creatorData} />
      ) : (
        <LandingAmbassadrice isLoggedIn={state === "customer"} />
      )}
    </main>
  );
}
