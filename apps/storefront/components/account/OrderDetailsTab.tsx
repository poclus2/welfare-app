"use client";

import React, { useState } from "react";
import { Package, ArrowLeft, XCircle, CircleNotch, Check } from "@phosphor-icons/react";
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
import { Card, DISPLAY_FONT, SK, SectionTitle } from "@/components/account/account-ui";
import { orderChip } from "@/components/account/OrderCard";

type StepState = "done" | "current" | "todo";

export const OrderDetailsTab = ({ order, onBack }: { order: any; onBack: () => void }) => {
  const { t, locale } = useI18n();
  const { addItem } = useCart();
  const { openChat } = useChatStore();
  const [reordering, setReordering] = useState(false);
  if (!order) return null;

  const dateLocale = locale === "en" ? "en-GB" : "fr-FR";
  const stage = getOrderStage(order);
  const isCanceled = stage === "canceled";
  const stageIdx = isCanceled ? -1 : STAGE_INDEX[stage];
  const trackingNumber = getTrackingNumber(order);
  const payment = getPaymentInfo(order);
  const shipping = getShippingInfo(order);
  const address = order.shipping_address;
  const chip = orderChip(order);

  const orderDate = new Date(order.created_at).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" });
  const orderTime = new Date(order.created_at).toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" });
  const country = address?.country_code
    ? (() => { try { return new Intl.DisplayNames([dateLocale], { type: "region" }).of(String(address.country_code).toUpperCase()); } catch { return String(address.country_code).toUpperCase(); } })()
    : "";

  const subtotal = order.item_subtotal ?? (order.items || []).reduce((sum: number, i: any) => sum + (Number(i.total) || 0), 0);
  const discount = Number(order.discount_total) || 0;
  const total = order.total ?? 0;
  const canReorder = (order.items || []).some((i: any) => i.variant_id);
  const paymentLabel = payment.method === "mobile_money" ? t("Mobile Money") : payment.method === "cash" ? t("Paiement à la livraison") : t("Paiement");

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

  // the order's life, from what the order really carries (stages from the fulfillments, payment captured)
  // the stage is the last one REACHED: it and the ones before are done, the next one is in progress
  const stageState = (i: number): StepState => (i <= stageIdx ? "done" : i === stageIdx + 1 ? "current" : "todo");
  const steps: { label: string; detail: string; state: StepState }[] = [
    { label: t("Commande validée"), detail: `${orderDate} · ${orderTime}`, state: "done" },
    {
      label: payment.paid ? t("Payée") : payment.method === "cash" ? t("À régler à la livraison") : t("Paiement en attente"),
      detail: paymentLabel,
      state: payment.paid ? "done" : "todo",
    },
    { label: t("Préparée en boutique"), detail: stageIdx === 0 ? t("Nous préparons votre commande.") : "", state: stageState(1) },
    {
      label: t("Expédiée"),
      detail: stageIdx === 1 ? t("Bientôt remise au livreur.") : stageIdx >= 2 && trackingNumber ? `${t("N° de suivi")} : ${trackingNumber}` : "",
      state: stageState(2),
    },
    { label: t("Livrée"), detail: stageIdx === 2 ? t("Votre colis est en route vers vous.") : stageIdx === 3 ? t("Votre commande a été livrée.") : "", state: stageState(3) },
  ];

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex items-center justify-between h-11">
        <button
          onClick={onBack}
          aria-label={t("Retour aux commandes")}
          className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: SK.surface, border: `1px solid ${SK.line}`, color: SK.ink }}
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>
        <span className="px-3 py-[7px] rounded-full text-[12px] font-bold" style={{ background: chip.bg, color: chip.color }}>{t(chip.text)}</span>
      </div>

      <div>
        <SectionTitle as="h1" light={t("Commande")} bold={orderCode(order.display_id)} size={34} nowrap />
        <p className="mt-1.5 text-[14px]" style={{ color: SK.muted }}>
          {t("Passée le")} {orderDate} · {paymentLabel}
        </p>
      </div>

      {isCanceled ? (
        <div className="rounded-[22px] p-5 flex items-center gap-3.5" style={{ background: "#FDECEC", border: "1px solid #F5C2C0" }}>
          <XCircle weight="fill" className="w-7 h-7 shrink-0" style={{ color: "#9F1C12" }} />
          <div>
            <p className="font-bold text-[15px]" style={{ color: "#9F1C12" }}>{t("Cette commande a été annulée.")}</p>
            <p className="text-[14px] mt-0.5" style={{ color: "#9F1C12" }}>{t("Pour toute question, notre assistant est là pour vous aider.")}</p>
          </div>
        </div>
      ) : (
        <Card className="px-[18px] pt-[18px] pb-1.5">
          <p className="text-[12px] font-bold uppercase tracking-[0.06em] mb-3" style={{ color: SK.muted }}>{t("Où en est ma commande")}</p>
          {steps.map((s, i) => (
            <div key={i} className="flex gap-3.5">
              <div className="flex flex-col items-center w-[26px]">
                <div
                  className="w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: s.state === "done" ? SK.accent : SK.surface,
                    border: s.state === "done" ? "none" : `2px solid ${s.state === "current" ? SK.accent : SK.line}`,
                  }}
                >
                  {s.state === "done" && <Check weight="bold" className="w-3.5 h-3.5 text-white" />}
                  {s.state === "current" && <span className="w-2.5 h-2.5 rounded-full" style={{ background: SK.accent }} />}
                </div>
                {i < steps.length - 1 && <div className="flex-1 w-0.5 min-h-[22px]" style={{ background: s.state === "done" ? SK.accent : SK.lineSoft }} />}
              </div>
              <div className="pt-0.5 pb-[18px]">
                <p className="text-[15px]" style={{ fontWeight: s.state === "current" ? 700 : 600, color: s.state === "todo" ? SK.muted : SK.ink }}>{s.label}</p>
                {s.detail && <p className="text-[13px]" style={{ color: SK.muted }}>{s.detail}</p>}
              </div>
            </div>
          ))}
        </Card>
      )}

      <div className="flex flex-col gap-2.5">
        <SectionTitle light={t("Vos")} bold={t("articles")} size={26} />
        {(order.items || []).map((item: any) => (
          <div key={item.id} className="flex items-center gap-3 rounded-[22px] p-2.5" style={{ background: SK.surface, border: `1px solid ${SK.lineSoft}` }}>
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: SK.tint }}>
              {item.thumbnail ? <img src={item.thumbnail} alt="" className="w-full h-full object-contain" /> : <Package className="w-7 h-7" style={{ color: SK.muted }} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold leading-snug" style={{ color: SK.ink }}>{item.title}</p>
              <p className="text-[13px]" style={{ color: SK.muted }}>{t("Quantité :")} {item.quantity}</p>
            </div>
            <p className="text-[14px] font-bold whitespace-nowrap" style={{ color: SK.ink }}>{formatPrice(item.total, order.currency_code)}</p>
          </div>
        ))}
      </div>

      <Card className="p-[18px] flex flex-col gap-2.5">
        <div className="flex justify-between text-[14px]"><span style={{ color: SK.muted }}>{t("Sous-total")}</span><span>{formatPrice(subtotal, order.currency_code)}</span></div>
        <div className="flex justify-between text-[14px]">
          <span style={{ color: SK.muted }}>{t("Livraison")}{shipping.name ? ` · ${shipping.name}` : ""}</span>
          <span>{shipping.total > 0 ? formatPrice(shipping.total, order.currency_code) : t("Gratuite")}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-[14px]"><span style={{ color: SK.muted }}>{t("Réduction")}</span><span style={{ color: "#0B6B45" }}>− {formatPrice(discount, order.currency_code)}</span></div>
        )}
        <div className="h-px" style={{ background: SK.lineSoft }} />
        <div className="flex justify-between items-baseline">
          <span className="text-[15px] font-bold">{payment.paid ? t("Total payé") : t("Total à régler")}</span>
          <span style={{ fontFamily: DISPLAY_FONT, fontSize: 24, fontWeight: 700 }}>{formatPrice(total, order.currency_code)}</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <Card className="p-3.5">
          <p className="text-[12px] font-bold uppercase tracking-[0.06em] mb-1.5" style={{ color: SK.muted }}>{t("Livraison")}</p>
          {address ? (
            <div className="text-[14px] leading-relaxed">
              <p className="font-semibold">{address.first_name} {address.last_name}</p>
              {address.address_1 && <p>{address.address_1}</p>}
              {address.address_2 && <p>{address.address_2}</p>}
              {(address.postal_code || address.city) && <p>{[address.postal_code, address.city].filter(Boolean).join(" ")}</p>}
              {country && <p>{country}</p>}
              {address.phone && <p className="pt-1" style={{ color: SK.muted }}>{address.phone}</p>}
            </div>
          ) : (
            <p className="text-[14px]" style={{ color: SK.muted }}>{t("Adresse non disponible.")}</p>
          )}
        </Card>
        <Card className="p-3.5">
          <p className="text-[12px] font-bold uppercase tracking-[0.06em] mb-1.5" style={{ color: SK.muted }}>{t("Paiement")}</p>
          <p className="text-[14px] leading-relaxed">{paymentLabel}</p>
          <p className="text-[14px] font-semibold" style={{ color: payment.paid ? "#0B6B45" : "#7A4B00" }}>
            {payment.paid ? t("Payée") : t("En attente de paiement")}
          </p>
        </Card>
      </div>

      <Card tint className="p-[18px] flex flex-col gap-3">
        <p style={{ fontFamily: DISPLAY_FONT, fontSize: 21, lineHeight: 1.2, fontWeight: 400 }}>
          {t("Une question sur")} <span style={{ fontWeight: 700 }}>{t("votre commande ?")}</span>
        </p>
        <p className="text-[14px] leading-relaxed" style={{ color: "#3F3331" }}>{t("Notre assistant est là pour vous accompagner.")}</p>
        <button onClick={() => openChat()} className="self-start h-[46px] px-[18px] rounded-full text-[14px] font-bold" style={{ background: SK.surface, color: SK.ink }}>
          {t("Poser une question")}
        </button>
      </Card>

      {canReorder && (
        <button
          onClick={handleReorder}
          disabled={reordering}
          className="h-[58px] rounded-full text-[16px] font-bold flex items-center justify-center gap-2 disabled:opacity-70"
          style={{ background: SK.accent, color: "#FFFFFF" }}
        >
          {reordering && <CircleNotch className="w-5 h-5 animate-spin" />}
          {t("Commander à nouveau")}
        </button>
      )}
    </div>
  );
};
