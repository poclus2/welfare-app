"use client";

import React, { useState } from "react";
import { Package, Clock, MapPin, CheckCircle, Truck, House, ArrowCounterClockwise, XCircle, CircleNotch } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n-context";
import { useCart } from "@/lib/cart-context";
import { STAGE_INDEX, formatPrice, getOrderStage, orderCode } from "@/lib/order-view";

const STEPS = [
  { key: "validated", label: "Validée", Icon: CheckCircle },
  { key: "prepared", label: "Préparée", Icon: Package },
  { key: "shipped", label: "Expédiée", Icon: Truck },
  { key: "delivered", label: "Livrée", Icon: House },
] as const;

const BADGES = {
  validated: { text: "Commande validée", cls: "bg-[#FDF4E7] text-[#D97706]", Icon: Clock },
  prepared: { text: "En préparation", cls: "bg-[#FDF4E7] text-[#D97706]", Icon: Package },
  shipped: { text: "Expédiée", cls: "bg-[#EAF2FB] text-[#1D4ED8]", Icon: Truck },
  delivered: { text: "Livré", cls: "bg-[#E6F4EA] text-[#1E7E34]", Icon: CheckCircle },
  canceled: { text: "Annulée", cls: "bg-[#FDECEC] text-[#B42318]", Icon: XCircle },
} as const;

export const OrderCard = ({ order, onViewDetails }: { order: any, onViewDetails?: (order: any) => void }) => {
  const { t, locale } = useI18n();
  const { addItem } = useCart();
  const [reordering, setReordering] = useState(false);

  const stage = getOrderStage(order);
  const badge = BADGES[stage];
  const isActive = stage !== "delivered" && stage !== "canceled";
  const stageIdx = stage === "canceled" ? 0 : STAGE_INDEX[stage];

  const orderDate = new Date(order.created_at).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  const articlesStr = (order.items || []).map((i: any) => `${i.title} (${i.quantity}x)`).join(" • ");

  // Put the same items back in the cart (the cart drawer opens as they are added)
  const handleReorder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (reordering) return;
    setReordering(true);
    try {
      for (const item of order.items || []) {
        if (item.variant_id) await addItem(item.variant_id, item.quantity, item.thumbnail, item.title, item.unit_price);
      }
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-5 md:p-8 shadow-sm mb-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 cursor-pointer" onClick={() => onViewDetails && onViewDetails(order)}>
        <div>
          <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-3">
            <h3 className="text-lg md:text-xl font-bold text-[#2A2424]">
              {t("Commande")} {orderCode(order.display_id)}
            </h3>
            <span className="text-gray-400 text-sm md:text-base">• {orderDate}</span>
          </div>

          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${badge.cls}`}>
            <badge.Icon weight="fill" className="w-4 h-4" />
            {t(badge.text)}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isActive && (
            <button onClick={(e) => { e.stopPropagation(); onViewDetails && onViewDetails(order); }} className="flex items-center gap-2 px-4 py-2.5 bg-[#cd858d] text-white rounded-xl text-xs font-semibold hover:bg-[#b5737a] transition-colors">
              <MapPin weight="bold" className="w-4 h-4" />
              {t("Suivre ma commande")}
            </button>
          )}
          {!isActive && (
            <button onClick={(e) => { e.stopPropagation(); onViewDetails && onViewDetails(order); }} className="flex items-center gap-2 px-4 py-2.5 bg-[#F4EAEB] text-[#2A2424] rounded-xl text-xs font-semibold hover:bg-[#e8d5d6] transition-colors">
              {t("Voir le détail")}
            </button>
          )}
          {!isActive && (order.items || []).some((i: any) => i.variant_id) && (
            <button onClick={handleReorder} disabled={reordering} className="flex items-center gap-2 px-4 py-2.5 bg-[#F4EAEB] text-[#2A2424] rounded-xl text-xs font-semibold hover:bg-[#e8d5d6] transition-colors disabled:opacity-60">
              {reordering ? <CircleNotch className="w-4 h-4 animate-spin" /> : <ArrowCounterClockwise weight="bold" className="w-4 h-4" />}
              {t("Commander à nouveau")}
            </button>
          )}
        </div>
      </div>

      {/* Progress bar for orders on their way */}
      {isActive && (
        <div className="bg-[#FAF5F0] rounded-2xl p-4 md:p-6 mb-6">
          <div className="flex justify-between items-start relative">
            {/* Connecting line background */}
            <div className="absolute top-5 left-[12.5%] right-[12.5%] h-0.5 bg-gray-200 -z-0"></div>
            {/* Connecting line active: the 4 steps sit at 12.5%, 37.5%, 62.5% and 87.5% */}
            <div className="absolute top-5 left-[12.5%] h-0.5 bg-[#cd858d] -z-0" style={{ width: `${(stageIdx / 3) * 75}%` }}></div>

            {STEPS.map(({ key, label, Icon }, i) => {
              const done = i <= stageIdx;
              return (
                <div key={key} className="flex flex-col items-center relative z-10 w-1/4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-[0_0_0_4px_#FAF5F0] ${done ? "bg-[#cd858d] text-white" : "bg-white text-gray-400 border border-gray-200"}`}>
                    <Icon weight={done ? "bold" : "fill"} className="w-5 h-5" />
                  </div>
                  <p className={`text-[10px] md:text-xs font-semibold ${done ? "text-[#cd858d]" : "text-gray-400"}`}>{t(label)}</p>
                  {i === 0 && <p className="text-[9px] text-gray-400 mt-1 hidden md:block">{orderDate}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Items & Total */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-gray-100">
        <div className="flex text-sm text-gray-500 max-w-2xl leading-relaxed">
          {articlesStr && (
            <>
              <span className="font-semibold text-gray-400 mr-2 uppercase text-[10px] tracking-widest mt-0.5">{t("Articles :")}</span>
              <span className="line-clamp-2">{articlesStr}</span>
            </>
          )}
        </div>
        <div className="text-base font-semibold text-[#2A2424] shrink-0">
          {t("Total :")} {formatPrice(order.total, order.currency_code)}
        </div>
      </div>
    </div>
  );
};
