"use client";

import { useState } from "react";
import { Search, Filter, ChevronDown, Eye, CheckCircle2, Phone, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

const MOCK_ORDERS = [
  { id: "WLF-M8X2K", customer: "Aïssatou Diallo", phone: "+221 77 123 45 67", items: 3, amount: 54500, payment: "Wave", delivery: "domicile", store: null, status: "pending_payment", date: "28 Jul 2026, 21:47", address: "Sacré Cœur 3, Villa 47, Dakar" },
  { id: "WLF-N9Y3L", customer: "Fatou Ndiaye", phone: "+221 76 234 56 78", items: 1, amount: 18500, payment: "Orange Money", delivery: "retrait", store: "hippodrome", status: "paid", date: "28 Jul 2026, 21:34", address: null },
  { id: "WLF-P2Z4M", customer: "Rokhaya Ba", phone: "+221 70 345 67 89", items: 2, amount: 33000, payment: "Wave", delivery: "retrait", store: "playce", status: "ready", date: "28 Jul 2026, 21:10", address: null },
  { id: "WLF-Q5A5N", customer: "Mariama Camara", phone: "+221 77 456 78 90", items: 4, amount: 78000, payment: "Free Money", delivery: "domicile", store: null, status: "shipped", date: "28 Jul 2026, 20:51", address: "Almadies, Rue 10, Dakar" },
  { id: "WLF-R6B6O", customer: "Binta Sow", phone: "+221 76 567 89 01", items: 1, amount: 22000, payment: "Wave", delivery: "retrait", store: "hippodrome", status: "delivered", date: "28 Jul 2026, 18:03", address: null },
  { id: "WLF-S7C7P", customer: "Aminata Fall", phone: "+221 70 678 90 12", items: 2, amount: 41000, payment: "Orange Money", delivery: "domicile", store: null, status: "preparing", date: "28 Jul 2026, 17:22", address: "Mermoz, Villa 8, Dakar" },
];

type Order = typeof MOCK_ORDERS[0];

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { label: status, className: "bg-gray-50 text-gray-500 border border-gray-200" };
  return <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${s.className}`}>{s.label}</span>;
}

const DELIVERY_FILTERS = ["Tous", "Domicile", "Hippodrome", "Playce"];
const STATUS_FILTERS = ["Tous", "En attente paiement", "Payé", "En préparation", "Prêt", "Expédié", "Livré", "Annulé"];
const STATUS_VALUES: Record<string, string> = {
  "Tous": "all", "En attente paiement": "pending_payment", "Payé": "paid",
  "En préparation": "preparing", "Prêt": "ready", "Expédié": "shipped",
  "Livré": "delivered", "Annulé": "cancelled",
};

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("Tous");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const filtered = MOCK_ORDERS.filter((o) => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase());
    const matchDelivery = deliveryFilter === "Tous" ||
      (deliveryFilter === "Domicile" && o.delivery === "domicile") ||
      (deliveryFilter === "Hippodrome" && o.store === "hippodrome") ||
      (deliveryFilter === "Playce" && o.store === "playce");
    const matchStatus = statusFilter === "Tous" || o.status === STATUS_VALUES[statusFilter];
    return matchSearch && matchDelivery && matchStatus;
  });

  const handleConfirmPayment = async (order: Order) => {
    setIsConfirming(true);
    await new Promise((r) => setTimeout(r, 1500)); // simulate API call
    setIsConfirming(false);
    setSelectedOrder(null);
    alert(`✅ Paiement de ${order.id} confirmé !`);
  };

  return (
    <div className="p-5 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2A2424]" style={{ letterSpacing: "-0.02em" }}>Commandes</h1>
          <p className="text-sm text-[#2A2424]/40 mt-0.5">{MOCK_ORDERS.length} commandes au total</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
            ⚡ {MOCK_ORDERS.filter(o => o.status === "pending_payment").length} en attente de paiement
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#EDE0E0] p-4 mb-5 space-y-3 shadow-sm">
        {/* Search */}
        <div className="flex items-center gap-2 bg-[#F5F0EB] border border-[#EDE0E0] rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-[#2A2424]/30 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Chercher par numéro de commande ou client..."
            className="flex-1 text-sm text-[#2A2424] bg-transparent outline-none placeholder:text-[#2A2424]/30"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Delivery filter */}
          <div className="flex items-center gap-1 bg-[#F5F0EB] rounded-xl p-1">
            {DELIVERY_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setDeliveryFilter(f)}
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  deliveryFilter === f ? "bg-[#2A2424] text-white shadow-sm" : "text-[#2A2424]/50 hover:text-[#2A2424]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-[11px] font-semibold text-[#2A2424]/60 bg-[#F5F0EB] border border-[#EDE0E0] rounded-xl px-3 py-2 outline-none"
          >
            {STATUS_FILTERS.map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#EDE0E0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5F0EB] border-b border-[#EDE0E0]">
                {["Commande", "Client", "Montant", "Paiement", "Livraison", "Statut", "Date", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-[#2A2424]/40 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-b border-[#EDE0E0] hover:bg-[#F5F0EB]/40 transition-colors">
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-bold text-[#2A2424] font-mono">{order.id}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs font-semibold text-[#2A2424]">{order.customer}</p>
                    <p className="text-[10px] text-[#2A2424]/40">{order.phone}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs font-bold text-[#2A2424] whitespace-nowrap">{formatPrice(order.amount)} FCFA</p>
                    <p className="text-[10px] text-[#2A2424]/40">{order.items} article{order.items > 1 ? "s" : ""}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[10px] font-semibold text-[#2A2424]/60 bg-[#F5F0EB] px-2 py-1 rounded-lg whitespace-nowrap">
                      📱 {order.payment}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[10px] font-semibold text-[#2A2424]/60 whitespace-nowrap">
                      {order.delivery === "domicile" ? "🏠 Domicile" : order.store === "hippodrome" ? "🏇 Hippodrome" : "🛍️ Playce"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-[10px] text-[#2A2424]/40 whitespace-nowrap">{order.date}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#C08A8E] hover:text-[#2A2424] transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Détail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-sm text-[#2A2424]/30">Aucune commande trouvée</div>
          )}
        </div>
      </div>

      {/* Order Detail Drawer */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 z-40 bg-black/40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[420px] bg-white shadow-2xl overflow-y-auto"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#EDE0E0] sticky top-0 bg-white z-10">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#2A2424]/40">Commande</p>
                  <p className="text-lg font-bold text-[#2A2424] font-mono">{selectedOrder.id}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 text-[#2A2424]/30 hover:text-[#2A2424] hover:bg-[#F5F0EB] rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <StatusBadge status={selectedOrder.status} />
                  <p className="text-[10px] text-[#2A2424]/40">{selectedOrder.date}</p>
                </div>

                {/* Customer */}
                <div className="bg-[#F5F0EB] rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#2A2424]/40 mb-2">Client</p>
                  <p className="text-sm font-bold text-[#2A2424]">{selectedOrder.customer}</p>
                  <p className="text-xs text-[#2A2424]/50 mt-1">{selectedOrder.phone}</p>
                </div>

                {/* Delivery */}
                <div className="bg-[#F5F0EB] rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#2A2424]/40 mb-2">Livraison</p>
                  {selectedOrder.delivery === "domicile" ? (
                    <>
                      <p className="text-sm font-bold text-[#2A2424]">🏠 À domicile</p>
                      <p className="text-xs text-[#2A2424]/50 mt-1">{selectedOrder.address}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-[#2A2424]">
                        {selectedOrder.store === "hippodrome" ? "🏇 The Welfare Hippodrome" : "🛍️ The Welfare Playce"}
                      </p>
                      <p className="text-xs text-[#2A2424]/50 mt-1">
                        {selectedOrder.store === "hippodrome" ? "Route de l'Hippodrome, Dakar" : "Playce Dakar, Almadies"}
                      </p>
                    </>
                  )}
                </div>

                {/* Payment */}
                <div className="bg-[#F5F0EB] rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#2A2424]/40 mb-2">Paiement</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📱</span>
                      <p className="text-sm font-bold text-[#2A2424]">{selectedOrder.payment}</p>
                    </div>
                    <p className="text-sm font-bold text-[#2A2424]">{formatPrice(selectedOrder.amount)} FCFA</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  {selectedOrder.status === "pending_payment" && (
                    <button
                      onClick={() => handleConfirmPayment(selectedOrder)}
                      disabled={isConfirming}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors disabled:opacity-60"
                    >
                      {isConfirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Confirmer le paiement
                    </button>
                  )}
                  <a
                    href={`https://wa.me/${selectedOrder.phone.replace(/\s+/g, "").replace("+", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#25D366] text-white rounded-xl text-sm font-bold hover:bg-[#1DA851] transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    Contacter sur WhatsApp
                  </a>
                  {["paid", "preparing"].includes(selectedOrder.status) && (
                    <button className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#2A2424] text-white rounded-xl text-sm font-bold hover:bg-black transition-colors">
                      Marquer comme prêt
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
