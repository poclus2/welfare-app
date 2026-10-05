"use client";

import React, { useState } from "react";
import { Package, Truck, House, CheckCircle, ArrowCounterClockwise, MapPin, Receipt, Headset, ArrowLeft, XCircle, CircleNotch } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n-context";
import { useCart } from "@/lib/cart-context";
import { useChatStore } from "@/lib/store/use-chat-store";
import {
  STAGE_INDEX,
  formatPrice,
  getOrderStage,
  getPaymentInfo,
  getShippingInfo,
  getTrackingNumber,
  orderCode,
} from "@/lib/order-view";

const STEPS = [
  { key: "validated", label: "Validée", Icon: CheckCircle },
  { key: "prepared", label: "Préparée", Icon: Package },
  { key: "shipped", label: "Expédiée", Icon: Truck },
  { key: "delivered", label: "Livrée", Icon: House },
] as const;

const STAGE_TEXT = {
  validated: { badge: "Commande validée", event: "Votre commande est validée, nous la préparons." },
  prepared: { badge: "En préparation", event: "Votre commande est en cours de préparation." },
  shipped: { badge: "Colis expédié", event: "Votre colis a été remis au livreur." },
  delivered: { badge: "Colis livré", event: "Votre commande a été livrée." },
} as const;

export const OrderDetailsTab = ({ order, onBack }: { order: any, onBack: () => void }) => {
  const { t, locale } = useI18n();
  const { addItem } = useCart();
  const { openChat } = useChatStore();
  const [reordering, setReordering] = useState(false);
  if (!order) return null;

  const dateLocale = locale === "en" ? "en-GB" : "fr-FR";
  const stage = getOrderStage(order);
  const isCanceled = stage === "canceled";
  const stageIdx = isCanceled ? 0 : STAGE_INDEX[stage];
  const trackingNumber = getTrackingNumber(order);
  const payment = getPaymentInfo(order);
  const shipping = getShippingInfo(order);
  const address = order.shipping_address;

  const orderDate = new Date(order.created_at).toLocaleDateString(dateLocale, { day: "2-digit", month: "long", year: "numeric" });
  const orderTime = new Date(order.created_at).toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" });
  const country = address?.country_code
    ? (() => { try { return new Intl.DisplayNames([dateLocale], { type: "region" }).of(String(address.country_code).toUpperCase()); } catch { return String(address.country_code).toUpperCase(); } })()
    : "";

  const subtotal =
    order.item_subtotal ?? (order.items || []).reduce((sum: number, i: any) => sum + (Number(i.total) || 0), 0);
  const discount = Number(order.discount_total) || 0;
  const total = order.total ?? 0;
  const canReorder = (order.items || []).some((i: any) => i.variant_id);

  const handleReorder = async () => {
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

  const paymentLabel =
    payment.method === "mobile_money" ? t("Mobile Money") : payment.method === "cash" ? t("Paiement à la livraison") : t("Paiement");

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Breadcrumb & Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-[#cd858d] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("Retour aux commandes")}
        </button>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl text-[#2A2424] mb-2">
              {t("Commande")} {orderCode(order.display_id)}
            </h1>
            <p className="text-sm text-gray-500">
              {t("Passée le")} {orderDate} {t("à")} {orderTime}
            </p>
          </div>
          {canReorder && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleReorder}
                disabled={reordering}
                className="flex items-center gap-2 px-4 py-2 bg-[#2A4B3A] text-white rounded-xl text-xs font-semibold hover:bg-[#1f382b] transition-colors shadow-sm disabled:opacity-60"
              >
                {reordering ? <CircleNotch className="w-4 h-4 animate-spin" /> : <ArrowCounterClockwise weight="bold" className="w-4 h-4" />}
                {t("Recommander")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status tracker */}
      {isCanceled ? (
        <div className="bg-[#FDECEC] border border-[#F5C2C0] rounded-3xl p-6 md:p-8 mb-8 flex items-center gap-4">
          <XCircle weight="fill" className="w-8 h-8 text-[#B42318] shrink-0" />
          <div>
            <p className="font-semibold text-[#B42318]">{t("Cette commande a été annulée.")}</p>
            <p className="text-sm text-[#B42318]/80 mt-0.5">{t("Pour toute question, notre assistant est là pour vous aider.")}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg ${stage === "delivered" ? "bg-[#E6F4EA] text-[#1E7E34]" : "bg-[#e8f5e9] text-[#2A4B3A]"}`}>
                {t(STAGE_TEXT[stage as keyof typeof STAGE_TEXT].badge)}
              </span>
              {trackingNumber && (
                <span className="text-sm text-gray-500 font-medium hidden md:inline-block">
                  {t("N° Suivi :")} <span className="text-[#2A2424]">{trackingNumber}</span>
                </span>
              )}
            </div>
          </div>

          {/* Tracking Line: the 4 steps sit at 12.5%, 37.5%, 62.5% and 87.5% */}
          <div className="relative mb-12 mt-4">
            <div className="absolute top-6 left-[12.5%] right-[12.5%] h-1 bg-[#FAF5F0] -z-0"></div>
            <div className="absolute top-6 left-[12.5%] h-1 bg-[#cd858d] -z-0 transition-all duration-1000" style={{ width: `${(stageIdx / 3) * 75}%` }}></div>

            <div className="flex justify-between relative z-10">
              {STEPS.map(({ key, label, Icon }, i) => {
                const done = i <= stageIdx;
                return (
                  <div key={key} className="flex flex-col items-center w-1/4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-[0_0_0_6px_white] ${done ? "bg-[#cd858d] text-white" : "bg-[#FAF5F0] text-gray-400"}`}>
                      <Icon weight={done ? "bold" : "fill"} className="w-6 h-6" />
                    </div>
                    <p className={`text-[10px] md:text-xs font-bold uppercase tracking-wider text-center ${done ? "text-[#cd858d]" : "text-gray-400"}`}>{t(label)}</p>
                    {i === 0 && <p className="text-[10px] text-gray-400 mt-1 text-center hidden md:block">{orderDate}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current status */}
          <div className="bg-[#FAF5F0] rounded-2xl p-4 flex items-center gap-3">
            <MapPin weight="fill" className="w-5 h-5 text-[#cd858d]" />
            <p className="text-xs text-[#2A2424]">
              <span className="font-semibold text-[#cd858d]">{t("Où en est ma commande :")}</span> {t(STAGE_TEXT[stage as keyof typeof STAGE_TEXT].event)}
            </p>
          </div>
        </div>
      )}

      {/* Articles */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
          <h2 className="text-xl text-[#2A2424]">{t("Articles du Rituel")} <span className="text-xs font-sans text-gray-400 ml-2 tracking-widest uppercase">({order.items?.length || 0} {t("PRODUITS")})</span></h2>
        </div>

        <div className="space-y-6 mb-8">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex gap-4 md:gap-6 bg-[#FAF5F0]/50 p-4 rounded-2xl">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-white flex-shrink-0 border border-gray-100 overflow-hidden relative">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                    <Package className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <h4 className="text-sm md:text-base font-semibold text-[#2A2424]">{item.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{t("Quantité :")} {item.quantity}</p>
              </div>
              <div className="flex flex-col justify-center items-end text-right shrink-0">
                <p className="text-base md:text-lg font-semibold text-[#2A2424]">{formatPrice(item.total, order.currency_code)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{t("Sous-total articles")}</span>
              <span>{formatPrice(subtotal, order.currency_code)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-[#1E7E34]">
                <span>{t("Réduction")}</span>
                <span>- {formatPrice(discount, order.currency_code)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600">
              <span>{t("Livraison")}{shipping.name ? ` — ${shipping.name}` : ""}</span>
              <span>{shipping.total > 0 ? formatPrice(shipping.total, order.currency_code) : t("Gratuit")}</span>
            </div>
          </div>
          <div className="flex justify-between items-end pt-6 border-t border-gray-200">
            <p className="text-lg text-[#2A2424]">{payment.paid ? t("Total payé") : t("Total à régler")}</p>
            <p className="text-2xl font-semibold text-[#2A2424]">{formatPrice(total, order.currency_code)}</p>
          </div>
        </div>
      </div>

      {/* Grid 2 cols: Address & Payment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Delivery Address */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Truck weight="bold" className="w-5 h-5 text-[#cd858d]" />
            <h3 className="text-base font-bold text-[#2A2424]">{t("Adresse de livraison")}</h3>
          </div>
          {address ? (
            <div className="text-sm text-gray-600 space-y-1 leading-relaxed">
              <p className="font-semibold text-[#2A2424]">{address.first_name} {address.last_name}</p>
              {address.address_1 && <p>{address.address_1}</p>}
              {address.address_2 && <p>{address.address_2}</p>}
              {(address.postal_code || address.city) && <p>{[address.postal_code, address.city].filter(Boolean).join(" ")}</p>}
              {country && <p>{country}</p>}
              {address.phone && <p className="pt-2">{address.phone}</p>}
            </div>
          ) : (
            <p className="text-sm text-gray-400">{t("Adresse non disponible.")}</p>
          )}
        </div>

        {/* Payment */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Receipt weight="bold" className="w-5 h-5 text-[#cd858d]" />
              <h3 className="text-base font-bold text-[#2A2424]">{t("Paiement")}</h3>
            </div>
            <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg ${payment.paid ? "bg-[#E6F4EA] text-[#1E7E34]" : "bg-[#FDF4E7] text-[#D97706]"}`}>
              {payment.paid ? t("Payée") : t("En attente de paiement")}
            </span>
          </div>

          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="text-xs text-gray-600">
              <p className="font-semibold text-[#2A2424]">{paymentLabel}</p>
              <p>{formatPrice(total, order.currency_code)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Support Banner */}
      <div className="bg-[#FAF5F0] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-[#2A4B3A] text-white flex items-center justify-center shrink-0">
          <Headset weight="fill" className="w-8 h-8" />
        </div>
        <div className="text-center md:text-left flex-1">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#cd858d] mb-1">{t("Support The Welfare")}</p>
          <h4 className="text-base font-bold text-[#2A2424] mb-1">{t("Une question sur votre commande ?")}</h4>
          <p className="text-xs text-gray-500">{t("Notre assistant est là pour vous accompagner.")}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => openChat()} className="px-6 py-3 bg-[#2A4B3A] text-white text-xs font-semibold rounded-xl hover:bg-[#1f382b] transition-colors">
            {t("Poser une question")}
          </button>
        </div>
      </div>

    </div>
  );
};
