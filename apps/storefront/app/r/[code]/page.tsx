"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "../../../lib/cart-context";
import { setCreatorCodeCookie } from "../../../lib/creator-code-cookie";

export default function ReferralRedirect() {
  const params = useParams();
  const router = useRouter();
  const { cartId, applyPromoCode } = useCart();
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

    // Remember the code for 30 days so it survives closing the tab before
    // there's a cart to apply it to yet.
    setCreatorCodeCookie(code.toUpperCase());

    // If a cart already exists, apply it right away instead of waiting for checkout.
    if (cartId) {
      applyPromoCode(code.toUpperCase()).catch(() => {});
    }

    // Redirect to shop with promo parameter
    router.push(`/shop?promo=${code.toUpperCase()}`);
  }, [code, router, cartId, applyPromoCode]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFDFC]">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-[#E5B6B9] border-t-[#C2164A] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#2A2424]/60 text-sm">Redirection en cours...</p>
      </div>
    </div>
  );
}
