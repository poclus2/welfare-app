"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useI18n } from "@/lib/i18n-context";
import { getCreatorCodeCookie } from "@/lib/creator-code-cookie";
import { CheckCircle, Tag, X } from "@phosphor-icons/react";

export function PromoCodeField() {
  const { t } = useI18n();
  const { cartId, promoCodes, applyPromoCode, removePromoCode } = useCart();
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

  const appliedCode = promoCodes[0];
  if (appliedCode) {
    return (
      <div className="flex items-center justify-between bg-[#F4EAEB]/60 rounded-xl px-3 py-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#2A2424]">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0" weight="fill" />
          <span>{t("Code")} <span className="font-mono">{appliedCode}</span> {t("appliqué")}</span>
        </div>
        <button
          onClick={() => removePromoCode(appliedCode)}
          className="text-[#2A2424]/40 hover:text-[#2A2424] transition-colors shrink-0"
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
          <Tag className="w-3.5 h-3.5 text-[#2A2424]/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={input}
            onChange={(e) => { setInput(e.target.value.toUpperCase()); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            placeholder={t("Code promo")}
            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-[#EDE0E0] text-xs bg-white focus:outline-none focus:border-[#C2164A] transition-colors"
          />
        </div>
        <button
          onClick={handleApply}
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 bg-[#2A2424] text-white rounded-xl text-xs font-bold disabled:opacity-40 transition-opacity"
        >
          {loading ? "..." : t("Appliquer")}
        </button>
      </div>
      {error && <p className="text-[10px] text-red-500 px-1">{error}</p>}
    </div>
  );
}
