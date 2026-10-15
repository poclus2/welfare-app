"use client";

import React, { useState } from "react";
import { Package, CircleNotch } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n-context";
import { useCart } from "@/lib/cart-context";
import { STAGE_INDEX, formatPrice, getOrderStage, getPaymentInfo, orderCode } from "@/lib/order-view";
import { DISPLAY_FONT, SK } from "@/components/account/account-ui";

const STEP_LABELS = ["Validée", "Préparée", "Expédiée", "Livrée"] as const;

// status chip: pale colours with dark text (readable), magenta tint for an order on its way
export function orderChip(order: any): { text: string; bg: string; color: string } {
  const stage = getOrderStage(order);
  const payment = getPaymentInfo(order);
  if (stage === "canceled") return { text: "Annulée", bg: "#FDECEC", color: "#9F1C12" };
  if (stage === "delivered") return { text: "Livrée", bg: "#EEF6F1", color: "#0B6B45" };
  if (!payment.paid && payment.method === "mobile_money") return { text: "Paiement en attente", bg: "#FFF1D6", color: "#7A4B00" };
  if (stage === "shipped") return { text: "En route", bg: SK.tint, color: SK.ink };
  if (stage === "prepared") return { text: "En préparation", bg: SK.tint, color: SK.ink };
  return { text: "Validée", bg: SK.tint, color: SK.ink };
}

export const OrderCard = ({ order, onViewDetails }: { order: any; onViewDetails?: (order: any) => void }) => {
  const { t, locale } = useI18n();
  const { addItem } = useCart();
  const [reordering, setReordering] = useState(false);

  const stage = getOrderStage(order);
  const isActive = stage !== "delivered" && stage !== "canceled";
  const stageIdx = stage === "canceled" ? -1 : STAGE_INDEX[stage];
  const chip = orderChip(order);
  const items: any[] = order.items || [];
  const count = items.reduce((n, i) => n + (Number(i.quantity) || 1), 0);
  const orderDate = new Date(order.created_at).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "long" });
  const canReorder = !isActive && items.some((i) => i.variant_id);

  // Put the same items back in the cart (the cart drawer opens as they are added)
  const handleReorder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (reordering) return;
    setReordering(true);
    try {
      for (const item of items) {
        if (item.variant_id) await addItem(item.variant_id, item.quantity, item.thumbnail, item.title, item.unit_price);
      }
    } finally {
      setReordering(false);
    }
  };

  const open = () => onViewDetails && onViewDetails(order);

  return (
    <div className="rounded-[26px] p-[18px] flex flex-col gap-3.5" style={{ background: SK.surface, border: `1px solid ${SK.lineSoft}` }}>
      <button onClick={open} className="flex items-start justify-between gap-3 text-left">
        <div>
          <p style={{ fontFamily: DISPLAY_FONT, fontSize: 20, fontWeight: 700, color: SK.ink }}>{orderCode(order.display_id)}</p>
          <p className="text-[13px]" style={{ color: SK.muted }}>
            {orderDate} · {count} {t(count > 1 ? "articles" : "article")}
          </p>
        </div>
        <span className="px-[11px] py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap" style={{ background: chip.bg, color: chip.color }}>
          {t(chip.text)}
        </span>
      </button>

      {/* where the order is, for orders on their way */}
      {isActive && (
        <div className="flex flex-col gap-1.5" aria-label={`${t("Étape")} ${stageIdx + 1} / 4 : ${t(STEP_LABELS[stageIdx] || "")}`}>
          <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
            {STEP_LABELS.map((_, i) => (
              <div key={i} className="h-[5px] rounded-full" style={{ background: i <= stageIdx ? SK.accent : SK.lineSoft }} />
            ))}
          </div>
          <div className="grid grid-cols-4 text-[12px]" style={{ color: SK.muted }}>
            {STEP_LABELS.map((label, i) => (
              <span key={label} className={i === 0 ? "" : i === 3 ? "text-right" : "text-center"} style={i === stageIdx ? { color: SK.ink, fontWeight: 700 } : undefined}>
                {t(label)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {items.slice(0, 4).map((item) => (
            <div key={item.id} className="w-[46px] h-[46px] rounded-xl overflow-hidden flex items-center justify-center" style={{ background: SK.tint }}>
              {item.thumbnail ? <img src={item.thumbnail} alt="" className="w-full h-full object-contain" /> : <Package className="w-5 h-5" style={{ color: SK.muted }} />}
            </div>
          ))}
          {items.length > 4 && (
            <div className="w-[46px] h-[46px] rounded-xl flex items-center justify-center text-[13px] font-bold" style={{ background: SK.tint }}>
              +{items.length - 4}
            </div>
          )}
        </div>
        <p className="shrink-0" style={{ fontFamily: DISPLAY_FONT, fontSize: 20, fontWeight: 700, color: SK.ink }}>
          {formatPrice(order.total, order.currency_code)}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={open}
          className="flex-1 h-[46px] rounded-full text-[14px] font-bold"
          style={isActive ? { background: SK.accent, color: "#FFFFFF" } : { background: SK.surface, color: SK.ink, border: `1px solid ${SK.ink}` }}
        >
          {isActive ? t("Suivre ma commande") : t("Voir le détail")}
        </button>
        {canReorder && (
          <button
            onClick={handleReorder}
            disabled={reordering}
            className="flex-1 h-[46px] rounded-full text-[14px] font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: SK.surface, color: SK.ink, border: `1px solid ${SK.line}` }}
          >
            {reordering && <CircleNotch className="w-4 h-4 animate-spin" />}
            {t("Commander à nouveau")}
          </button>
        )}
      </div>
    </div>
  );
};
