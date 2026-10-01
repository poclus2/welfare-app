"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, Eye, Phone, Mail, ShoppingBag, Download, X, MapPin, Megaphone, Sparkle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function formatPrice(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending_payment: { label: "En attente paiement", className: "bg-amber-50 text-amber-600 border border-amber-200" },
  paid: { label: "Payé", className: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  ready: { label: "Prêt", className: "bg-blue-50 text-blue-600 border border-blue-200" },
  shipped: { label: "Expédié", className: "bg-purple-50 text-purple-600 border border-purple-200" },
  delivered: { label: "Livré", className: "bg-[#F4EAEB] text-[#C08A8E] border border-[#EDE0E0]" },
  cancelled: { label: "Annulé", className: "bg-red-50 text-red-500 border border-red-200" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { label: status, className: "bg-gray-50 text-gray-500 border border-gray-200" };
  return <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${s.className}`}>{s.label}</span>;
}

type Order = {
  id: string;
  rawId: string;
  amount: number;
  status: string;
  date: string;
};

type Address = {
  id: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  postalCode: string;
  countryCode: string;
  phone: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
};

type LoyaltyTier = { name: string; min: number; max: number; color: string };

type CreatorPartnerInfo = {
  code: string;
  status: string;
  isCreatorOfMonth: boolean;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  ordersCount: number;
  totalSpent: number;
  aov: number;
  loyaltyPoints: number;
  loyaltyTier: LoyaltyTier;
  hasAccount: boolean;
  date: string;
  orders: Order[];
  addresses: Address[];
  creatorPartner: CreatorPartnerInfo | null;
};

export default function CustomersClient({ initialCustomers, totalCount }: { initialCustomers: Customer[]; totalCount: number }) {
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filtered = initialCustomers.filter((c) => {
    const term = search.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term) || c.phone.includes(term);
  });

  const exportToCSV = () => {
    const headers = ["Nom", "Email", "Téléphone", "Commandes", "Montant Total (FCFA)", "Date Inscription"];
    const rows = filtered.map(c => [
      c.name,
      c.email,
      c.phone,
      c.ordersCount.toString(),
      c.totalSpent.toString(),
      c.date
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    // UTF-8 BOM is required for Excel to properly read accents
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `clients_welfare_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-5 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2A2424]" style={{ letterSpacing: "-0.02em" }}>Clients</h1>
          <p className="text-sm text-[#2A2424]/40 mt-0.5">{totalCount} clients dans la base de données</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#EDE0E0] text-[#2A2424] rounded-xl text-sm font-bold hover:bg-[#F5F0EB] transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#EDE0E0] p-4 mb-5 shadow-sm">
        <div className="flex items-center gap-2 bg-[#F5F0EB] border border-[#EDE0E0] rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-[#2A2424]/30 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Chercher par nom, email ou téléphone..."
            className="flex-1 text-sm text-[#2A2424] bg-transparent outline-none placeholder:text-[#2A2424]/30"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#EDE0E0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5F0EB] border-b border-[#EDE0E0]">
                {["Client", "Contact", "Commandes", "Total des commandes", "Inscription", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-[#2A2424]/40 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.id} className="border-b border-[#EDE0E0] hover:bg-[#F5F0EB]/40 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#2A2424] text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {customer.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#2A2424]">{customer.name}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-1 inline-block ${
                          customer.hasAccount ? "bg-emerald-50 text-emerald-600" : "bg-[#EDE0E0] text-[#2A2424]/40"
                        }`}>
                          {customer.hasAccount ? "Compte actif" : "Invité"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-[11px] font-semibold text-[#2A2424] truncate max-w-[150px]">{customer.email}</p>
                    <p className="text-[10px] text-[#2A2424]/40">{customer.phone || "—"}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-bold text-[#2A2424]">{customer.ordersCount}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs font-bold text-[#2A2424]">{formatPrice(customer.totalSpent)} FCFA</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-[10px] text-[#2A2424]/40 whitespace-nowrap">{customer.date}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#C08A8E] hover:text-[#2A2424] transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Fiche
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-sm text-[#2A2424]/30">Aucun client trouvé</div>
          )}
        </div>
      </div>

      {/* Customer Detail Drawer */}
      <AnimatePresence>
        {selectedCustomer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCustomer(null)}
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2A2424] text-white flex items-center justify-center text-sm font-bold">
                    {selectedCustomer.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#2A2424]">{selectedCustomer.name}</p>
                    <p className="text-[10px] text-[#2A2424]/40">Client depuis {selectedCustomer.date}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="p-2 text-[#2A2424]/30 hover:text-[#2A2424] hover:bg-[#F5F0EB] rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Contact info */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#2A2424]/40">Contact</h3>
                  <div className="bg-[#F5F0EB] rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-[#2A2424]/40" />
                      <p className="text-xs font-semibold text-[#2A2424]">{selectedCustomer.email}</p>
                    </div>
                    {selectedCustomer.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-[#2A2424]/40" />
                        <p className="text-xs font-semibold text-[#2A2424]">{selectedCustomer.phone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lifetime metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border border-[#EDE0E0] rounded-xl p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#2A2424]/40 mb-1">Commandes</p>
                    <p className="text-xl font-bold text-[#2A2424]">{selectedCustomer.ordersCount}</p>
                  </div>
                  <div className="bg-white border border-[#EDE0E0] rounded-xl p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#2A2424]/40 mb-1">Dépensé</p>
                    <p className="text-lg font-bold text-[#C08A8E]">{formatPrice(selectedCustomer.totalSpent)} <span className="text-[10px]">F</span></p>
                  </div>
                  <div className="bg-white border border-[#EDE0E0] rounded-xl p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#2A2424]/40 mb-1">Panier moyen</p>
                    <p className="text-lg font-bold text-[#2A2424]">{formatPrice(selectedCustomer.aov)} <span className="text-[10px]">F</span></p>
                  </div>
                  <div className="bg-white border border-[#EDE0E0] rounded-xl p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#2A2424]/40 mb-1">Fidélité</p>
                    <p className="text-lg font-bold" style={{ color: selectedCustomer.loyaltyTier.color }}>
                      {selectedCustomer.loyaltyTier.name}
                    </p>
                    <p className="text-[10px] text-[#2A2424]/40">{selectedCustomer.loyaltyPoints.toLocaleString("fr-FR")} pts</p>
                  </div>
                </div>

                {/* Creator partner cross-link */}
                {selectedCustomer.creatorPartner && (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#2A2424]/40">Programme créateurs</h3>
                    <Link
                      href="/dashboard/createurs"
                      className="block bg-[#F5F0EB] rounded-xl p-4 hover:bg-[#EDE0E0]/60 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#C08A8E] shrink-0">
                            <Megaphone className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#2A2424] font-mono">{selectedCustomer.creatorPartner.code}</p>
                            <p className="text-[10px] text-[#2A2424]/40">
                              {selectedCustomer.creatorPartner.status === "active" ? "Actif" :
                                selectedCustomer.creatorPartner.status === "suspended" ? "Suspendu" :
                                selectedCustomer.creatorPartner.status === "ambassador" ? "Ambassadeur" :
                                selectedCustomer.creatorPartner.status}
                            </p>
                          </div>
                        </div>
                        {selectedCustomer.creatorPartner.isCreatorOfMonth && (
                          <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 whitespace-nowrap">
                            <Sparkle className="w-3 h-3" /> Créatrice du mois
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                )}

                {/* Addresses */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#2A2424]/40">Adresses</h3>
                  {selectedCustomer.addresses.length === 0 ? (
                    <p className="text-xs text-[#2A2424]/40">Aucune adresse enregistrée.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedCustomer.addresses.map((addr) => (
                        <div key={addr.id} className="bg-[#F5F0EB] rounded-xl p-4 flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-[#2A2424]/40 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs font-bold text-[#2A2424]">{addr.firstName} {addr.lastName}</p>
                              {addr.isDefaultShipping && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600">Par défaut</span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#2A2424]/60 mt-0.5">
                              {addr.address1}{addr.address2 ? `, ${addr.address2}` : ""}
                            </p>
                            <p className="text-[11px] text-[#2A2424]/60">
                              {[addr.city, addr.province, addr.postalCode].filter(Boolean).join(", ")}{addr.countryCode ? ` — ${addr.countryCode}` : ""}
                            </p>
                            {addr.phone && <p className="text-[11px] text-[#2A2424]/40 mt-0.5">{addr.phone}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {selectedCustomer.phone && (
                  <a
                    href={`https://wa.me/${selectedCustomer.phone.replace(/\s+/g, "").replace("+", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-xl text-xs font-bold hover:bg-[#1DA851] transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    Contacter sur WhatsApp
                  </a>
                )}

                {/* Order history */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#2A2424]/40">
                    Historique des commandes {selectedCustomer.orders.length > 0 && `(${selectedCustomer.orders.length})`}
                  </h3>
                  {selectedCustomer.orders.length === 0 ? (
                    <p className="text-xs text-[#2A2424]/40">Aucune commande pour le moment.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedCustomer.orders.map((order) => (
                        <Link
                          key={order.id}
                          href={`/dashboard/orders/${order.rawId}`}
                          className="bg-white border border-[#EDE0E0] rounded-xl p-4 flex items-center justify-between hover:border-[#C08A8E] hover:shadow-sm transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#F5F0EB] flex items-center justify-center text-[#2A2424]">
                              <ShoppingBag className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#2A2424] font-mono">{order.id}</p>
                              <p className="text-[10px] text-[#2A2424]/40">{order.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col items-end gap-1">
                              <p className="text-xs font-bold text-[#2A2424]">{formatPrice(order.amount)} F</p>
                              <StatusBadge status={order.status} />
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#2A2424]/20 group-hover:text-[#C08A8E] transition-colors" />
                          </div>
                        </Link>
                      ))}
                    </div>
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
