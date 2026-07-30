"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2, Phone, Loader2, MapPin, CreditCard, User, Package, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function formatPrice(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending_payment: { label: "En attente paiement", className: "bg-amber-50 text-amber-600 border border-amber-200" },
  paid: { label: "Payé", className: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  preparing: { label: "En préparation", className: "bg-blue-50 text-blue-600 border border-blue-200" },
  ready: { label: "Prêt", className: "bg-violet-50 text-violet-600 border border-violet-200" },
  shipped: { label: "Expédié", className: "bg-purple-50 text-purple-600 border border-purple-200" },
  delivered: { label: "Livré", className: "bg-[#F4EAEB] text-[#C08A8E] border border-[#EDE0E0]" },
  cancelled: { label: "Annulé", className: "bg-red-50 text-red-500 border border-red-200" },
};

type Order = {
  id: string;
  rawId: string;
  customer: string;
  phone: string;
  items: number;
  itemsList: any[];
  amount: number;
  payment: string;
  delivery: string;
  store: string | null;
  status: string;
  date: string;
  address: string | null;
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { label: status, className: "bg-gray-50 text-gray-500 border border-gray-200" };
  return <span className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap ${s.className}`}>{s.label}</span>;
}

export default function OrderDetailClient({ order }: { order: Order }) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isMarkingReady, setIsMarkingReady] = useState(false);

  const handleConfirmPayment = async () => {
    setIsConfirming(true);
    // Simulation of API call
    await new Promise((r) => setTimeout(r, 1500)); 
    setIsConfirming(false);
    alert(`✅ Paiement de ${order.id} confirmé !`);
    router.refresh();
  };

  const handleMarkAsReady = async () => {
    setIsMarkingReady(true);
    // Simulation of API call
    await new Promise((r) => setTimeout(r, 1500)); 
    setIsMarkingReady(false);
    alert(`📦 Commande ${order.id} prête !`);
    router.refresh();
  };

  const waPhone = order.phone?.replace(/\s+/g, "").replace("+", "");

  return (
    <div className="p-5 lg:p-8 max-w-7xl mx-auto pb-32 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <Link href="/dashboard/orders" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2A2424]/50 hover:text-[#2A2424] transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Retour aux commandes
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-[#2A2424] font-mono">{order.id}</h1>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-2 mt-3 text-sm font-medium text-[#2A2424]/50">
            <Calendar className="w-4 h-4" />
            {order.date}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale - Articles */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#EDE0E0] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Package className="w-5 h-5 text-[#C08A8E]" />
              <h2 className="text-lg font-bold text-[#2A2424]">Articles commandés ({order.items})</h2>
            </div>
            
            <div className="space-y-4">
              {order.itemsList && order.itemsList.length > 0 ? (
                order.itemsList.map((item: any, i: number) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl border border-[#F5F0EB] bg-[#F9F6F4]">
                    <div className="w-16 h-16 rounded-xl bg-white border border-[#EDE0E0] overflow-hidden shrink-0 flex items-center justify-center">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.product_title || item.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[#2A2424]/20 text-xs">Img</span>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="text-sm font-bold text-[#2A2424] line-clamp-2 leading-snug">{item.product_title || item.title}</p>
                      {item.variant_title && item.variant_title !== "Default Variant" && (
                        <p className="text-xs text-[#2A2424]/50 mt-1">{item.variant_title}</p>
                      )}
                    </div>
                    <div className="text-right flex flex-col justify-center shrink-0">
                      <p className="text-sm font-bold text-[#2A2424]">{formatPrice(item.unit_price || 0)} FCFA</p>
                      <p className="text-xs font-semibold text-[#2A2424]/50 mt-1">Qté: {item.quantity}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-sm text-[#2A2424]/40 bg-[#F5F0EB] rounded-xl">
                  Aucun article trouvé pour cette commande.
                </div>
              )}
            </div>

            {/* Résumé financier simple */}
            <div className="mt-8 pt-6 border-t border-[#EDE0E0] flex justify-end">
              <div className="w-full sm:w-1/2 space-y-3">
                <div className="flex justify-between text-sm font-medium text-[#2A2424]/60">
                  <span>Sous-total</span>
                  <span>{formatPrice(order.amount)} FCFA</span>
                </div>
                {/* On pourrait rajouter la livraison ici si elle n'est pas incluse dans le montant */}
                <div className="flex justify-between text-lg font-bold text-[#2A2424] pt-3 border-t border-[#F5F0EB]">
                  <span>Total</span>
                  <span>{formatPrice(order.amount)} FCFA</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne latérale - Infos additionnelles */}
        <div className="space-y-6">
          {/* Client */}
          <div className="bg-white border border-[#EDE0E0] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-[#C08A8E]" />
              <h2 className="text-lg font-bold text-[#2A2424]">Client</h2>
            </div>
            <div>
              <p className="text-base font-bold text-[#2A2424]">{order.customer}</p>
              <p className="text-sm font-medium text-[#2A2424]/60 mt-1">{order.phone}</p>
            </div>
          </div>

          {/* Livraison */}
          <div className="bg-white border border-[#EDE0E0] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-[#C08A8E]" />
              <h2 className="text-lg font-bold text-[#2A2424]">Livraison</h2>
            </div>
            {order.delivery === "domicile" ? (
              <>
                <p className="text-sm font-bold text-[#2A2424] mb-1">🏠 Livraison à domicile</p>
                <p className="text-sm font-medium text-[#2A2424]/60 leading-relaxed">{order.address}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-[#2A2424] mb-1">
                  {order.store === "hippodrome" ? "🏇 Retrait Hippodrome" : order.store === "playce" ? "🛍️ Retrait Playce" : "🏪 Retrait Boutique"}
                </p>
                <p className="text-sm font-medium text-[#2A2424]/60 leading-relaxed">
                  Le client passera récupérer sa commande.
                </p>
              </>
            )}
          </div>

          {/* Paiement */}
          <div className="bg-white border border-[#EDE0E0] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-[#C08A8E]" />
              <h2 className="text-lg font-bold text-[#2A2424]">Paiement</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <p className="text-sm font-bold text-[#2A2424]">{order.payment}</p>
                <p className="text-xs font-medium text-[#2A2424]/50">{order.status === "pending_payment" ? "En attente" : "Confirmé"}</p>
              </div>
            </div>
          </div>

          {/* Espace vide pour ne pas que la barre fixe chevauche le contenu (uniquement sur mobile si on scroll bas) */}
          <div className="h-6 lg:hidden"></div>
        </div>
      </div>

      {/* Barre d'actions (Fixée en bas sur mobile, ou intégrée dans le layout) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#EDE0E0] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40 lg:static lg:bg-transparent lg:border-none lg:shadow-none lg:p-0 lg:mt-6 flex flex-col sm:flex-row gap-3">
        {order.status === "pending_payment" && (
          <button
            onClick={handleConfirmPayment}
            disabled={isConfirming}
            className="flex-1 flex items-center justify-center gap-2 py-4 lg:py-3.5 px-6 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all disabled:opacity-60 shadow-lg shadow-emerald-500/20"
          >
            {isConfirming ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            Confirmer le paiement
          </button>
        )}
        
        {["paid", "preparing"].includes(order.status) && (
          <button 
            onClick={handleMarkAsReady}
            disabled={isMarkingReady}
            className="flex-1 flex items-center justify-center gap-2 py-4 lg:py-3.5 px-6 bg-[#2A2424] text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg shadow-black/10 disabled:opacity-60"
          >
            {isMarkingReady ? <Loader2 className="w-5 h-5 animate-spin" /> : <Package className="w-5 h-5" />}
            Marquer comme prêt
          </button>
        )}

        {order.phone && waPhone && (
          <a
            href={`https://wa.me/${waPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-4 lg:py-3.5 px-6 bg-[#25D366] text-white rounded-xl text-sm font-bold hover:bg-[#1DA851] transition-all shadow-lg shadow-[#25D366]/20"
          >
            <Phone className="w-5 h-5" />
            Contacter {order.customer.split(' ')[0]}
          </a>
        )}
      </div>
    </div>
  );
}
