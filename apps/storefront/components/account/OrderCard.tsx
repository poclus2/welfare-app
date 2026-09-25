
"use client";

import React from "react";
import { Package, Clock, MapPin, DownloadSimple, CheckCircle, Truck, House, ArrowCounterClockwise } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n-context";

const formatPrice = (amount: number, currencyCode: string) => {
  const noDecimal = ['xaf', 'xof', 'jpy', 'krw'].includes(currencyCode?.toLowerCase());
  const value = noDecimal ? amount : amount / 100;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currencyCode || 'XAF' }).format(value);
};

const getOrderCode = (displayId: number) => {
  return `#WF-${String(displayId).padStart(4, '0')}`;
};

export const OrderCard = ({ order, onViewDetails }: { order: any, onViewDetails?: (order: any) => void }) => {
  const { t } = useI18n();
  const isCompleted = order.status === "completed";
  const isShipped = order.status === "shipped";
  
  const orderDate = new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  const articlesStr = order.items?.map((i: any) => `${i.title} (${i.quantity}x)`).join(" • ") || t("Articles divers");

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-5 md:p-8 shadow-sm mb-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 cursor-pointer" onClick={() => onViewDetails && onViewDetails(order)}>
        <div>
          <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-3">
            <h3 className="text-lg md:text-xl font-bold text-[#2A2424]">
              {t("Commande")} {getOrderCode(order.display_id)}
            </h3>
            <span className="text-gray-400 text-sm md:text-base">• {orderDate}</span>
          </div>
          
          {isCompleted ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E6F4EA] text-[#1E7E34] rounded-lg text-xs font-semibold">
              <CheckCircle weight="fill" className="w-4 h-4" />
              {t("Livré")}
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FDF4E7] text-[#D97706] rounded-lg text-xs font-semibold">
              <Clock weight="bold" className="w-4 h-4" />
              {t("Livraison estimée : Bientôt")}
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {!isCompleted && (
            <button onClick={() => onViewDetails && onViewDetails(order)} className="flex items-center gap-2 px-4 py-2.5 bg-[#cd858d] text-white rounded-xl text-xs font-semibold hover:bg-[#b5737a] transition-colors">
              <MapPin weight="bold" className="w-4 h-4" />
              {t("Suivre le colis en direct")}
            </button>
          )}
          {isCompleted && (
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#F4EAEB] text-[#2A2424] rounded-xl text-xs font-semibold hover:bg-[#e8d5d6] transition-colors">
              <ArrowCounterClockwise weight="bold" className="w-4 h-4" />
              {t("Commander à nouveau")}
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#F4EAEB] text-[#2A2424] rounded-xl text-xs font-semibold hover:bg-[#e8d5d6] transition-colors">
            <DownloadSimple weight="bold" className="w-4 h-4" />
            {t("Facture PDF")}
          </button>
        </div>
      </div>

      {/* Progress Bar for Active Orders */}
      {!isCompleted && (
        <div className="bg-[#FAF5F0] rounded-2xl p-4 md:p-6 mb-6">
          <div className="flex justify-between items-start relative">
            {/* Connecting line background */}
            <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-gray-200 -z-0"></div>
            {/* Connecting line active */}
            <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-[#cd858d] -z-0" style={{ width: isShipped ? '66%' : '33%' }}></div>
            
            {/* Step 1: Validée */}
            <div className="flex flex-col items-center relative z-10 w-1/4">
              <div className="w-10 h-10 rounded-full bg-[#cd858d] text-white flex items-center justify-center mb-2 shadow-[0_0_0_4px_#FAF5F0]">
                <CheckCircle weight="bold" className="w-5 h-5" />
              </div>
              <p className="text-[10px] md:text-xs font-semibold text-[#cd858d]">{t("Validée")}</p>
              <p className="text-[9px] text-gray-400 mt-1 hidden md:block">{orderDate}</p>
            </div>
            
            {/* Step 2: Préparée */}
            <div className="flex flex-col items-center relative z-10 w-1/4">
              <div className="w-10 h-10 rounded-full bg-[#cd858d] text-white flex items-center justify-center mb-2 shadow-[0_0_0_4px_#FAF5F0]">
                <CheckCircle weight="bold" className="w-5 h-5" />
              </div>
              <p className="text-[10px] md:text-xs font-semibold text-[#cd858d]">{t("Préparée")}</p>
            </div>
            
            {/* Step 3: En transit */}
            <div className="flex flex-col items-center relative z-10 w-1/4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-[0_0_0_4px_#FAF5F0] ${isShipped ? 'bg-[#cd858d] text-white' : 'bg-white text-gray-400 border border-gray-200'}`}>
                <Truck weight="fill" className="w-5 h-5" />
              </div>
              <p className={`text-[10px] md:text-xs font-semibold ${isShipped ? 'text-[#cd858d]' : 'text-gray-400'}`}>{t("En transit")}</p>
            </div>
            
            {/* Step 4: Livraison */}
            <div className="flex flex-col items-center relative z-10 w-1/4">
              <div className="w-10 h-10 rounded-full bg-white text-gray-400 border border-gray-200 flex items-center justify-center mb-2 shadow-[0_0_0_4px_#FAF5F0]">
                <House weight="fill" className="w-5 h-5" />
              </div>
              <p className="text-[10px] md:text-xs font-semibold text-gray-400">{t("Livraison")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Items & Total */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-gray-100">
        <div className="flex text-sm text-gray-500 max-w-2xl leading-relaxed">
          <span className="font-semibold text-gray-400 mr-2 uppercase text-[10px] tracking-widest mt-0.5">{t("Articles :")}</span>
          <span className="line-clamp-2">{articlesStr}</span>
        </div>
        <div className="text-base font-semibold text-[#2A2424] shrink-0">
          {t("Total :")} {formatPrice(order.total, order.currency_code)} {t("TTC")}
        </div>
      </div>
    </div>
  );
};
