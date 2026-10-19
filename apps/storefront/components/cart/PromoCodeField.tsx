"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useI18n } from "@/lib/i18n-context";
import { getCreatorCodeCookie } from "@/lib/creator-code-cookie";
import { CheckCircle, Tag, X } from "@phosphor-icons/react";
import { SK } from "@/components/account/account-ui";

export function PromoCodeField() {
  const { t } = useI18n();
  const { cartId, promoCodes, pendingPromoCode, applyPromoCode, removePromoCode } = useCart();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const autoTried = useRef(false);

  // Auto-apply a code remembered from an /r/[code] visit, once a cart exists.
  useEffect(() => {
    if (!cartId || autoTried.current || promoCodes.length > 0) return;
    const pending = getCreatorCodeCookie();
    if (pending) {
      autoTried.current = true;
      applyPromoCode(pending).catch(() => {});
    }
  }, [cartId, promoCodes.length, applyPromoCode]);

  const handleApply = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError("");
    const result = await applyPromoCode(input.trim());
    setLoading(false);
    if (result.ok) {
      setInput("");
    } else {
      setError(result.error || t("Code invalide"));
    }
  };

  const appliedCode = promoCodes[0] || pendingPromoCode;
  if (appliedCode) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[16px] px-3.5 py-3" style={{ background: SK.tint }}>
        <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: SK.ink }}>
          <CheckCircle className="w-[18px] h-[18px] shrink-0" weight="fill" style={{ color: SK.accent }} />
          <span>
            {t("Code")} <span className="font-bold">{appliedCode}</span>{" "}
            {promoCodes[0] ? t("appliqué") : t("enregistré : livraison offerte au choix de la livraison")}
          </span>
        </div>
        <button
          onClick={() => removePromoCode(appliedCode)}
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: SK.surface, color: SK.ink }}
          aria-label={t("Retirer le code")}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: SK.muted }} />
          <input
            value={input}
            onChange={(e) => { setInput(e.target.value.toUpperCase()); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            placeholder={t("Code promo")}
            aria-label={t("Code promo")}
            aria-invalid={!!error}
            className="w-full h-[46px] pl-10 pr-3 rounded-full text-[14px] outline-none focus:ring-2"
            style={{ border: `1px solid ${error ? "#D93025" : SK.line}`, background: SK.surface, color: SK.ink, ["--tw-ring-color" as any]: SK.accent }}
          />
        </div>
        <button
          onClick={handleApply}
          disabled={loading || !input.trim()}
          className="h-[46px] px-4 rounded-full text-[14px] font-bold disabled:opacity-40 transition-opacity"
          style={{ border: `1px solid ${SK.ink}`, color: SK.ink, background: SK.surface }}
        >
          {loading ? "…" : t("Appliquer")}
        </button>
      </div>
      {error && <p className="text-[12px] px-3" style={{ color: "#B3261E" }}>{error}</p>}
    </div>
  );
}
