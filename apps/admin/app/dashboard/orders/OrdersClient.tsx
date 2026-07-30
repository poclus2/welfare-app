"use client";

import { useState } from "react";
import { Search, Filter, ChevronDown, Eye, CheckCircle2, Phone, X, Loader2 } from "lucide-react";
import Link from "next/link";

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
  return <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${s.className}`}>{s.label}</span>;
}

const DELIVERY_FILTERS = ["Tous", "Domicile", "Hippodrome", "Playce"];
const STATUS_FILTERS = ["Tous", "En attente paiement", "Payé", "En préparation", "Prêt", "Expédié", "Livré", "Annulé"];
const STATUS_VALUES: Record<string, string> = {
  "Tous": "all", "En attente paiement": "pending_payment", "Payé": "paid",
  "En préparation": "preparing", "Prêt": "ready", "Expédié": "shipped",
  "Livré": "delivered", "Annulé": "cancelled",
};

export default function OrdersClient({ initialOrders, totalCount }: { initialOrders: Order[]; totalCount: number }) {
  const [search, setSearch] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("Tous");
  const [statusFilter, setStatusFilter] = useState("Tous");

  const filtered = initialOrders.filter((o) => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase());
    const matchDelivery = deliveryFilter === "Tous" ||
      (deliveryFilter === "Domicile" && o.delivery === "domicile") ||
      (deliveryFilter === "Hippodrome" && o.store === "hippodrome") ||
      (deliveryFilter === "Playce" && o.store === "playce");
    const matchStatus = statusFilter === "Tous" || o.status === STATUS_VALUES[statusFilter];
    return matchSearch && matchDelivery && matchStatus;
  });

  return (
    <div className="p-5 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2A2424]" style={{ letterSpacing: "-0.02em" }}>Commandes</h1>
          <p className="text-sm text-[#2A2424]/40 mt-0.5">{totalCount} commandes au total</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
            ⚡ {initialOrders.filter(o => o.status === "pending_payment").length} en attente de paiement
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
                      {order.delivery === "domicile" ? "🏠 Domicile" : order.store === "hippodrome" ? "🏇 Hippodrome" : order.store === "playce" ? "🛍️ Playce" : "🏪 Retrait"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-[10px] text-[#2A2424]/40 whitespace-nowrap">{order.date}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/dashboard/orders/${order.rawId}`}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#C08A8E] hover:text-[#2A2424] transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Détail
                    </Link>
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
    </div>
  );
}
