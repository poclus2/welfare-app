
"use client";

import React from "react";
import { Package, Truck, House, CheckCircle, DownloadSimple, ArrowCounterClockwise, MapPin, Receipt, WarningCircle, Headset, ArrowLeft, ArrowUpRight } from "@phosphor-icons/react";
import Image from "next/image";
import { useI18n } from "@/lib/i18n-context";

const formatPrice = (amount: number, currencyCode: string) => {
  const noDecimal = ['xaf', 'xof', 'jpy', 'krw'].includes(currencyCode?.toLowerCase());
  const value = noDecimal ? amount : amount / 100;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currencyCode || 'XAF' }).format(value);
};

const getOrderCode = (displayId: number) => {
  return `#WF-${String(displayId).padStart(4, '0')}`;
};

export const OrderDetailsTab = ({ order, onBack }: { order: any, onBack: () => void }) => {
  const { t } = useI18n();
  if (!order) return null;

  const isCompleted = order.status === "completed";
  const isShipped = order.status === "shipped";
  
  const orderDate = new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const orderTime = new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // Calculate totals
  const subtotal = order.subtotal || order.total;
  const shippingTotal = order.shipping_total || 0;
  const total = order.total || 0;

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
              {t("Commande")} {getOrderCode(order.display_id)}
            </h1>
            <p className="text-sm text-gray-500">
              {t("Passée le")} {orderDate} {t("à")} {orderTime} • {isCompleted ? t("Livrée") : t("Livraison estimée : Bientôt")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-[#2A2424] rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors shadow-sm">
              <DownloadSimple weight="bold" className="w-4 h-4" />
              {t("Facture PDF")}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#2A4B3A] text-white rounded-xl text-xs font-semibold hover:bg-[#1f382b] transition-colors shadow-sm">
              <ArrowCounterClockwise weight="bold" className="w-4 h-4" />
              {t("Recommander")}
            </button>
          </div>
        </div>
      </div>

      {/* Acheminement / Status Tracker */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg ${isCompleted ? 'bg-[#E6F4EA] text-[#1E7E34]' : 'bg-[#e8f5e9] text-[#2A4B3A]'}`}>
              {isCompleted ? t("Colis Livré") : t("Colis en cours d'acheminement")}
            </span>
            <span className="text-sm text-gray-500 font-medium hidden md:inline-block">
              {t("N° Suivi :")} <span className="text-[#2A2424]">WF{order.id.substring(order.id.length - 8).toUpperCase()}</span>
            </span>
          </div>
          <button className="text-xs font-bold tracking-widest uppercase text-[#cd858d] hover:text-[#b5737a] transition-colors flex items-center gap-1">
            {t("Portail transporteur")} <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Tracking Line */}
        <div className="relative mb-12 mt-4 px-4 md:px-12">
          {/* Background line */}
          <div className="absolute top-6 left-12 right-12 h-1 bg-[#FAF5F0] -z-0"></div>
          {/* Active line */}
          <div className="absolute top-6 left-12 right-12 h-1 bg-[#cd858d] -z-0 transition-all duration-1000" style={{ width: isCompleted ? '100%' : isShipped ? '66%' : '33%' }}></div>
          
          <div className="flex justify-between relative z-10">
            {/* Validée */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#cd858d] text-white flex items-center justify-center mb-3 shadow-[0_0_0_6px_white]">
                <CheckCircle weight="bold" className="w-6 h-6" />
              </div>
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#cd858d] text-center">{t("Validée")}</p>
              <p className="text-[10px] text-gray-400 mt-1 text-center hidden md:block">{orderDate}</p>
            </div>
            
            {/* Préparée */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#cd858d] text-white flex items-center justify-center mb-3 shadow-[0_0_0_6px_white]">
                <CheckCircle weight="bold" className="w-6 h-6" />
              </div>
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#cd858d] text-center">{t("Préparée")}</p>
            </div>
            
            {/* Pris en charge */}
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-[0_0_0_6px_white] ${isShipped || isCompleted ? 'bg-[#cd858d] text-white' : 'bg-[#FAF5F0] text-[#cd858d]'}`}>
                <Truck weight="fill" className="w-6 h-6" />
              </div>
              <p className={`text-[10px] md:text-xs font-bold uppercase tracking-wider text-center ${isShipped || isCompleted ? 'text-[#cd858d]' : 'text-[#cd858d]/50'}`}>{t("Pris en charge")}</p>
            </div>
            
            {/* Livraison */}
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-[0_0_0_6px_white] ${isCompleted ? 'bg-[#cd858d] text-white' : 'bg-[#FAF5F0] text-gray-400'}`}>
                <House weight="fill" className="w-6 h-6" />
              </div>
              <p className={`text-[10px] md:text-xs font-bold uppercase tracking-wider text-center ${isCompleted ? 'text-[#cd858d]' : 'text-gray-400'}`}>{t("Livraison")}</p>
            </div>
          </div>
        </div>

        {/* Latest event */}
        <div className="bg-[#FAF5F0] rounded-2xl p-4 flex items-center gap-3">
          <MapPin weight="fill" className="w-5 h-5 text-[#cd858d]" />
          <p className="text-xs text-[#2A2424]">
            <span className="font-semibold text-[#cd858d]">{t("Dernier événement :")}</span> {t("Votre commande est en cours de traitement logistique.")}
          </p>
          <span className="ml-auto text-[10px] font-bold tracking-widest uppercase text-[#cd858d] hidden md:block">
            {t("Remise contre signature")}
          </span>
        </div>
      </div>

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
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#cd858d] mb-1">{t("Soins et Beauté")}</p>
                <h4 className="text-sm md:text-base font-semibold text-[#2A2424]">{item.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{t("Quantité :")} {item.quantity}</p>
              </div>
              <div className="flex flex-col justify-center items-end text-right shrink-0">
                <p className="text-base md:text-lg font-semibold text-[#2A2424]">{formatPrice(item.total, order.currency_code)}</p>
                <p className="text-[10px] text-gray-400 mt-1">{t("TVA incluse")}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Echantillons offerts */}
        <div className="bg-[#FAF5F0] border border-[#F1E5D8] rounded-2xl p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package weight="fill" className="w-5 h-5 text-[#cd858d]" />
            <p className="text-xs font-semibold text-[#2A2424]">{t("ÉCHANTILLONS DÉCOUVERTE OFFERTS")}</p>
          </div>
          <span className="text-xs font-semibold text-[#cd858d]">{t("Offert")}</span>
        </div>

        {/* Totals */}
        <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{t("Sous-total articles")}</span>
              <span>{formatPrice(subtotal, order.currency_code)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span className="flex items-center gap-2">{t("Livraison Standard")} <span className="px-2 py-0.5 bg-[#E6F4EA] text-[#1E7E34] text-[10px] font-bold tracking-widest uppercase rounded">{t("Offerte")}</span></span>
              <span>{shippingTotal > 0 ? formatPrice(shippingTotal, order.currency_code) : t("Gratuit")}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{t("Échantillons & Pochette cadeau")}</span>
              <span>{t("Gratuit")}</span>
            </div>
          </div>
          <div className="flex justify-between items-end pt-6 border-t border-gray-200">
            <div>
              <p className="text-lg text-[#2A2424]">{t("Total payé")}</p>
              <p className="text-[10px] text-gray-400 mt-1">{t("TVA incluse")}</p>
            </div>
            <p className="text-2xl font-semibold text-[#2A2424]">{formatPrice(total, order.currency_code)}</p>
          </div>
        </div>
      </div>

      {/* Grid 2 cols: Address & Billing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Delivery Address */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Truck weight="bold" className="w-5 h-5 text-[#cd858d]" />
            <h3 className="text-base font-bold text-[#2A2424]">{t("Adresse de livraison")}</h3>
          </div>
          <div className="text-sm text-gray-600 space-y-1 mb-6 leading-relaxed">
            <p className="font-semibold text-[#2A2424]">{order.shipping_address?.first_name} {order.shipping_address?.last_name}</p>
            <p>{order.shipping_address?.address_1}</p>
            {order.shipping_address?.address_2 && <p>{order.shipping_address?.address_2}</p>}
            <p>{order.shipping_address?.postal_code} {order.shipping_address?.city}</p>
            <p>{order.shipping_address?.country_code?.toUpperCase()}</p>
            <p className="pt-2">{order.shipping_address?.phone}</p>
          </div>
          <div className="bg-[#FAF5F0] p-4 rounded-xl flex items-start gap-3">
            <WarningCircle weight="fill" className="w-4 h-4 text-[#cd858d] shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-600 leading-relaxed">
              {t("Instruction livreur : Si absent, merci de déposer le colis chez le gardien.")}
            </p>
          </div>
        </div>

        {/* Billing */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Receipt weight="bold" className="w-5 h-5 text-[#cd858d]" />
              <h3 className="text-base font-bold text-[#2A2424]">{t("Facturation & Paiement")}</h3>
            </div>
            <span className="px-3 py-1 bg-[#E6F4EA] text-[#1E7E34] text-[10px] font-bold uppercase tracking-widest rounded-lg">{t("Payée")}</span>
          </div>
          
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100">
            <div className="px-3 py-1.5 bg-white border border-gray-200 rounded font-bold text-xs shadow-sm">CB</div>
            <div className="text-xs text-gray-600">
              <p className="font-semibold text-[#2A2424]">{t("Carte Bancaire sécurisée")}</p>
              <p>{t("Paiement validé")}</p>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-auto">
            {t("L'adresse de facturation est identique à l'adresse de livraison.")}
          </p>

          <button className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-[#FAF5F0] text-[#cd858d] font-semibold text-xs rounded-xl hover:bg-[#F4EAEB] transition-colors">
            <DownloadSimple weight="bold" className="w-4 h-4" />
            {t("Télécharger le duplicata")}
          </button>
        </div>
      </div>

      {/* Support Banner */}
      <div className="bg-[#FAF5F0] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-[#2A4B3A] text-white flex items-center justify-center shrink-0">
          <Headset weight="fill" className="w-8 h-8" />
        </div>
        <div className="text-center md:text-left flex-1">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#cd858d] mb-1">{t("Support The Welfare")}</p>
          <h4 className="text-base font-bold text-[#2A2424] mb-1">{t("Une question sur votre expédition ?")}</h4>
          <p className="text-xs text-gray-500">{t("Notre équipe est à votre écoute pour vous accompagner.")}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="px-6 py-3 bg-[#2A4B3A] text-white text-xs font-semibold rounded-xl hover:bg-[#1f382b] transition-colors">
            {t("Nous Contacter")}
          </button>
          <button className="px-6 py-3 bg-white text-[#2A2424] text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            {t("FAQ Livraison")}
          </button>
        </div>
      </div>

    </div>
  );
};
