"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ReferralRedirect() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;

  useEffect(() => {
    if (!code) {
      router.push("/shop");
      return;
    }

    // The API handles the tracking and redirect,
    // but since we're a Next.js SPA, we track client-side and redirect
    const apiUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
    
    // Ping the tracking API (fire and forget)
    fetch(`${apiUrl}/store/r/${code.toUpperCase()}`, {
      method: "GET",
      redirect: "manual",
    }).catch(() => {});
    
    // Store the promo code in session for automatic application at checkout
    sessionStorage.setItem("promo_code", code.toUpperCase());
    sessionStorage.setItem("promo_source", "referral_link");
    
    // Redirect to shop with promo parameter
    router.push(`/shop?promo=${code.toUpperCase()}`);
  }, [code, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFDFC]">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-[#E5B6B9] border-t-[#C2164A] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#2A2424]/60 text-sm">Redirection en cours...</p>
      </div>
    </div>
  );
}
