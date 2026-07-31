"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2, Phone, Loader2, MapPin, CreditCard, User, Package, Calendar, MessageSquare, Clock, ArrowRight, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  capturePaymentAction, 
  refundPaymentAction, 
  addInternalNoteAction, 
  createFulfillmentAction, 
  createShipmentAction 
} from "../../../actions/orders";

function formatPrice(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

const PAYMENT_STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-red-50 text-red-600 border border-red-200" },
  authorized: { label: "Autorisé", className: "bg-amber-50 text-amber-600 border border-amber-200" },
  paid: { label: "Payé", className: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  captured: { label: "Payé", className: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  refunded: { label: "Remboursé", className: "bg-gray-100 text-gray-600 border border-gray-300" },
};

const FULFILLMENT_STATUS_MAP: Record<string, { label: string; className: string }> = {
  not_fulfilled: { label: "Non Traité", className: "bg-red-50 text-red-600 border border-red-200" },
  partially_fulfilled: { label: "Part. Traité", className: "bg-amber-50 text-amber-600 border border-amber-200" },
  fulfilled: { label: "Prêt (Expédition créée)", className: "bg-blue-50 text-blue-600 border border-blue-200" },
  partially_shipped: { label: "Part. Expédié", className: "bg-purple-50 text-purple-600 border border-purple-200" },
  shipped: { label: "Expédié", className: "bg-purple-50 text-purple-600 border border-purple-200" },
  delivered: { label: "Livré", className: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
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
  fulfillments: any[];
  payment_collections: any[];
  payment_status: string;
  fulfillment_status: string;
  metadata: any;
};

export default function OrderDetailClient({ order }: { order: Order }) {
  const router = useRouter();

  // Loading states
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isFulfilling, setIsFulfilling] = useState(false);
  const [isShipping, setIsShipping] = useState(false);
  
  // Modals state
  const [newNote, setNewNote] = useState("");
  const [showFulfillModal, setShowFulfillModal] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrierName, setCarrierName] = useState("");
  
  // Selected fulfillment to ship
  const [selectedFulfillmentId, setSelectedFulfillmentId] = useState<string | null>(null);

  const paymentCollection = order.payment_collections?.[0];
  const paymentObj = paymentCollection?.payments?.[0];
  const paymentId = paymentObj?.id;

  const handleCapturePayment = async () => {
    if (!paymentId) return alert("Aucun paiement trouvé pour cette commande.");
    setIsCapturing(true);
    const res = await capturePaymentAction(paymentId, order.rawId);
    setIsCapturing(false);
    if (res.success) {
      alert("✅ Paiement capturé avec succès !");
    } else {
      alert(`❌ Erreur: ${res.error}`);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsAddingNote(true);
    const notes = order.metadata?.internal_notes || [];
    const updatedNotes = [...notes, { text: newNote, date: new Date().toISOString() }];
    const res = await addInternalNoteAction(order.rawId, updatedNotes);
    setIsAddingNote(false);
    if (res.success) {
      setNewNote("");
    } else {
      alert(`❌ Erreur: ${res.error}`);
    }
  };

  const handleCreateFulfillment = async () => {
    setIsFulfilling(true);
    // Fulfill all items for simplicity
    const itemsToFulfill = order.itemsList.map(item => ({ id: item.id, quantity: item.quantity }));
    const res = await createFulfillmentAction(order.rawId, itemsToFulfill);
    setIsFulfilling(false);
    if (res.success) {
      setShowFulfillModal(false);
      alert("📦 Expédition créée (Prêt à envoyer) !");
    } else {
      alert(`❌ Erreur: ${res.error}`);
    }
  };

  const handleCreateShipment = async () => {
    if (!selectedFulfillmentId) return;
    setIsShipping(true);
    const res = await createShipmentAction(order.rawId, selectedFulfillmentId, trackingNumber, carrierName);
    setIsShipping(false);
    if (res.success) {
      setShowShipModal(false);
      setTrackingNumber("");
      setCarrierName("");
      setSelectedFulfillmentId(null);
      alert("🚚 Commande marquée comme expédiée !");
    } else {
      alert(`❌ Erreur: ${res.error}`);
    }
  };

  const waPhone = order.phone?.replace(/\s+/g, "").replace("+", "");

  const payStatusInfo = PAYMENT_STATUS_MAP[order.payment_status] || PAYMENT_STATUS_MAP.pending;
  const fulStatusInfo = FULFILLMENT_STATUS_MAP[order.fulfillment_status] || FULFILLMENT_STATUS_MAP.not_fulfilled;

  // Build timeline
  const timeline: { type: string; title: string; date: string; icon: React.ReactNode; bg: string; desc?: string }[] = [
    { type: "order", title: "Commande passée", date: order.date, icon: <Package className="w-4 h-4 text-white" />, bg: "bg-blue-500" }
  ];
  if (order.payment_status === "captured" || order.payment_status === "paid") {
    timeline.push({ type: "payment", title: "Paiement capturé", date: "Effectué", icon: <CreditCard className="w-4 h-4 text-white" />, bg: "bg-emerald-500" });
  }
  if (order.fulfillments && order.fulfillments.length > 0) {
    timeline.push({ type: "fulfillment", title: "Expédition créée (Prêt)", date: "Effectué", icon: <CheckCircle2 className="w-4 h-4 text-white" />, bg: "bg-violet-500" });
  }
  if (order.fulfillment_status === "shipped") {
    timeline.push({ type: "shipment", title: "Commande expédiée", date: "Effectué", icon: <Truck className="w-4 h-4 text-white" />, bg: "bg-purple-500" });
  }
  const notes = order.metadata?.internal_notes || [];
  notes.forEach((note: any) => {
    timeline.push({ 
      type: "note", 
      title: "Note interne ajoutée", 
      desc: note.text,
      date: new Date(note.date).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }), 
      icon: <MessageSquare className="w-4 h-4 text-white" />, 
      bg: "bg-gray-400" 
    });
  });

  return (
    <div className="p-5 lg:p-8 max-w-7xl mx-auto pb-40 lg:pb-8">
      {/* En-tête */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <Link href="/dashboard/orders" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2A2424]/50 hover:text-[#2A2424] transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Retour aux commandes
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-[#2A2424] font-mono">{order.id}</h1>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap ${payStatusInfo.className}`}>
              Paiement: {payStatusInfo.label}
            </span>
            <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap ${fulStatusInfo.className}`}>
              Logistique: {fulStatusInfo.label}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne Principale */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Bloc: Articles */}
          <div className="bg-white border border-[#EDE0E0] rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
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
                  Aucun article trouvé.
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-[#EDE0E0] flex justify-end">
              <div className="w-full sm:w-1/2 space-y-3">
                <div className="flex justify-between text-sm font-medium text-[#2A2424]/60">
                  <span>Sous-total</span>
                  <span>{formatPrice(order.amount)} FCFA</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-[#2A2424] pt-3 border-t border-[#F5F0EB]">
                  <span>Total</span>
                  <span>{formatPrice(order.amount)} FCFA</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bloc: Timeline */}
          <div className="bg-white border border-[#EDE0E0] rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-[#C08A8E]" />
              <h2 className="text-lg font-bold text-[#2A2424]">Historique</h2>
            </div>
            <div className="space-y-6">
              {timeline.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${item.bg}`}>
                      {item.icon}
                    </div>
                    {i !== timeline.length - 1 && <div className="w-0.5 h-full bg-[#EDE0E0] mt-2"></div>}
                  </div>
                  <div className="pb-2 pt-1.5">
                    <p className="text-sm font-bold text-[#2A2424]">{item.title}</p>
                    {item.desc && <p className="text-sm text-[#2A2424]/70 mt-1 bg-[#F5F0EB] p-2 rounded-lg">{item.desc}</p>}
                    <p className="text-[11px] font-semibold text-[#2A2424]/40 mt-1">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Colonne Latérale */}
        <div className="space-y-6">
          
          {/* Gestion Financière */}
          <div className="bg-white border border-[#EDE0E0] rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#C08A8E]" />
                <h2 className="text-lg font-bold text-[#2A2424]">Paiement</h2>
              </div>
            </div>
            <div className="bg-[#F5F0EB] rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📱</span>
                <div>
                  <p className="text-sm font-bold text-[#2A2424]">{order.payment}</p>
                  <p className="text-xs font-medium text-[#2A2424]/60 mt-0.5">{payStatusInfo.label}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              {order.payment_status === "pending" || order.payment_status === "authorized" ? (
                <button
                  onClick={handleCapturePayment}
                  disabled={isCapturing}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors disabled:opacity-60"
                >
                  {isCapturing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Marquer comme payé
                </button>
              ) : null}
              {/* Le remboursement pourrait ouvrir une modale ici */}
            </div>
          </div>

          {/* Client & Livraison */}
          <div className="bg-white border border-[#EDE0E0] rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-[#C08A8E]" />
              <h2 className="text-lg font-bold text-[#2A2424]">Client</h2>
            </div>
            <div className="mb-6">
              <p className="text-base font-bold text-[#2A2424]">{order.customer}</p>
              <p className="text-sm font-medium text-[#2A2424]/60 mt-1">{order.phone}</p>
            </div>

            <div className="flex items-center gap-2 mb-4 pt-4 border-t border-[#EDE0E0]">
              <MapPin className="w-5 h-5 text-[#C08A8E]" />
              <h2 className="text-lg font-bold text-[#2A2424]">Livraison</h2>
            </div>
            {order.delivery === "domicile" ? (
              <>
                <p className="text-sm font-bold text-[#2A2424] mb-1">🏠 À domicile</p>
                <p className="text-sm font-medium text-[#2A2424]/60 leading-relaxed">{order.address}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-[#2A2424] mb-1">
                  {order.store === "hippodrome" ? "🏇 Retrait Hippodrome" : order.store === "playce" ? "🛍️ Retrait Playce" : "🏪 Retrait Boutique"}
                </p>
                <p className="text-sm font-medium text-[#2A2424]/60 leading-relaxed">Le client passera récupérer.</p>
              </>
            )}
          </div>

          {/* Notes Internes */}
          <div className="bg-white border border-[#EDE0E0] rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-[#C08A8E]" />
              <h2 className="text-lg font-bold text-[#2A2424]">Notes Internes</h2>
            </div>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Ex: Le client a appelé..."
              className="w-full bg-[#F5F0EB] text-[#2A2424] text-sm rounded-xl p-3 outline-none min-h-[80px] resize-none mb-3"
            />
            <button
              onClick={handleAddNote}
              disabled={isAddingNote || !newNote.trim()}
              className="w-full py-2.5 bg-[#2A2424] text-white rounded-xl text-sm font-bold hover:bg-black transition-colors disabled:opacity-50"
            >
              {isAddingNote ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Enregistrer la note"}
            </button>
          </div>
          
          <div className="h-20 lg:hidden"></div>
        </div>
      </div>

      {/* Barre d'actions flottante mobile / Fixe en desktop */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#EDE0E0] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40 lg:static lg:bg-transparent lg:border-none lg:shadow-none lg:p-0 lg:mt-6 flex flex-col sm:flex-row gap-3">
        {order.fulfillment_status === "not_fulfilled" && (
          <button 
            onClick={() => setShowFulfillModal(true)}
            className="flex-1 flex items-center justify-center gap-2 py-4 lg:py-3.5 px-6 bg-[#2A2424] text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg shadow-black/10"
          >
            <Package className="w-5 h-5" />
            Créer une expédition
          </button>
        )}
        
        {order.fulfillments?.length > 0 && order.fulfillment_status !== "shipped" && (
          <button 
            onClick={() => {
              setSelectedFulfillmentId(order.fulfillments[0].id);
              setShowShipModal(true);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-4 lg:py-3.5 px-6 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20"
          >
            <Truck className="w-5 h-5" />
            Marquer comme expédié
          </button>
        )}

        {waPhone && (
          <a
            href={`https://wa.me/${waPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-4 lg:py-3.5 px-6 bg-[#25D366] text-white rounded-xl text-sm font-bold hover:bg-[#1DA851] transition-all shadow-lg shadow-[#25D366]/20"
          >
            <Phone className="w-5 h-5" />
            Contacter WhatsApp
          </a>
        )}
      </div>

      {/* Fulfill Modal */}
      {showFulfillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[#2A2424] mb-2">Créer une expédition</h3>
            <p className="text-sm text-[#2A2424]/60 mb-6">Confirmez la préparation des articles pour expédition.</p>
            
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
              {order.itemsList.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3 bg-[#F5F0EB] p-3 rounded-xl">
                  <Package className="w-4 h-4 text-[#C08A8E]" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#2A2424] line-clamp-1">{item.product_title || item.title}</p>
                  </div>
                  <span className="text-sm font-bold text-[#2A2424]">x{item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowFulfillModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm"
              >
                Annuler
              </button>
              <button 
                onClick={handleCreateFulfillment}
                disabled={isFulfilling}
                className="flex-1 flex items-center justify-center py-3 bg-[#2A2424] text-white rounded-xl font-bold text-sm disabled:opacity-50"
              >
                {isFulfilling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Valider"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ship Modal */}
      {showShipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[#2A2424] mb-2">Expédier la commande</h3>
            <p className="text-sm text-[#2A2424]/60 mb-6">Ajoutez les informations d'expédition pour informer le client.</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-[#2A2424]/60 uppercase tracking-widest mb-1.5">Livreur / Transporteur</label>
                <input 
                  type="text" 
                  value={carrierName}
                  onChange={e => setCarrierName(e.target.value)}
                  placeholder="Ex: Livreur interne"
                  className="w-full bg-[#F5F0EB] border-none rounded-xl p-3 outline-none text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2A2424]/60 uppercase tracking-widest mb-1.5">Numéro de suivi (Optionnel)</label>
                <input 
                  type="text" 
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  placeholder="Ex: TRK12345"
                  className="w-full bg-[#F5F0EB] border-none rounded-xl p-3 outline-none text-sm font-medium"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowShipModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm"
              >
                Annuler
              </button>
              <button 
                onClick={handleCreateShipment}
                disabled={isShipping}
                className="flex-1 flex items-center justify-center py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 disabled:opacity-50"
              >
                {isShipping ? <Loader2 className="w-4 h-4 animate-spin" /> : "Expédier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
