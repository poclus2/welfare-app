"use client";
import { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, ShoppingBag, Users,
  Package, Store, ArrowRight, Clock, AlertTriangle,
  CheckCircle2, XCircle, ChevronRight, Download,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { motion } from "framer-motion";
import Link from "next/link";

function formatPrice(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente paiement", className: "bg-amber-50 text-amber-600 border border-amber-200" },
  awaiting: { label: "En attente paiement", className: "bg-amber-50 text-amber-600 border border-amber-200" },
  paid: { label: "Payé", className: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  captured: { label: "Payé", className: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  ready: { label: "Prêt", className: "bg-blue-50 text-blue-600 border border-blue-200" },
  shipped: { label: "Expédié", className: "bg-purple-50 text-purple-600 border border-purple-200" },
  delivered: { label: "Livré", className: "bg-[#F4EAEB] text-[#C08A8E] border border-[#EDE0E0]" },
  canceled: { label: "Annulé", className: "bg-red-50 text-red-600 border border-red-200" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { label: status, className: "bg-gray-50 text-gray-500" };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${s.className}`}>
      {s.label}
    </span>
  );
}

function KpiCard({
  label, value, delta, deltaPositive, icon: Icon, sub,
}: {
  label: string; value: string; delta: string; deltaPositive: boolean;
  icon: React.ElementType; sub?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 border border-[#EDE0E0] shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#F5F0EB] flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#C08A8E]" />
        </div>
        {delta && (
          <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
            deltaPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
          }`}>
            {deltaPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {delta}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-[#2A2424] mb-0.5">{value}</p>
      <p className="text-xs text-[#2A2424]/50">{label}</p>
      {sub && <p className="text-[10px] text-[#2A2424]/30 mt-1">{sub}</p>}
    </motion.div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-[#EDE0E0] rounded-xl px-4 py-2.5 shadow-lg text-xs">
        <p className="font-bold text-[#2A2424] mb-1">{label}</p>
        <p className="text-[#C08A8E]">{formatPrice(payload[0].value)} FCFA</p>
      </div>
    );
  }
  return null;
}

export default function DashboardClient({
  salesData,
  deliveryData,
  recentOrders,
  urgentTasks,
  topProducts,
  kpis,
}: any) {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "quarterly">("monthly");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-5 lg:p-8 space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2A2424]" style={{ letterSpacing: "-0.02em" }}>
            Vue d'ensemble
          </h1>
          <p className="text-sm text-[#2A2424]/40 mt-0.5">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="CA du mois" value={`${formatPrice(kpis.revenue)} FCFA`} delta="" deltaPositive icon={ShoppingBag} sub="Commandes payées ce mois" />
        <KpiCard label="Commandes" value={kpis.orders.toString()} delta="" deltaPositive icon={Package} sub="Ce mois" />
        <KpiCard label="Nouveaux clients" value={kpis.customers.toString()} delta="" deltaPositive icon={Users} sub="Total inscrits" />
        <KpiCard label="Panier moyen" value={`${formatPrice(kpis.aov)} FCFA`} delta="" deltaPositive={false} icon={Store} sub="Moyenne ce mois" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-[#2A2424]">Tendance des ventes</h2>
              <p className="text-xs text-[#2A2424]/40 mt-0.5">Chiffre d'affaires en FCFA</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C08A8E" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#C08A8E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F4EAEB" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#2A2424", opacity: 0.4 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "#2A2424", opacity: 0.4 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#C08A8E"
                strokeWidth={2.5}
                fill="url(#colorValue)"
                dot={{ fill: "#C08A8E", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#2A2424", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-[#EDE0E0] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#2A2424]">Modes de paiement</h2>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Live</span>
            </div>
            {deliveryData.length > 0 ? (
              <div className="flex items-center gap-4">
                <PieChart width={90} height={90}>
                  <Pie data={deliveryData} cx={40} cy={40} innerRadius={28} outerRadius={42} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {deliveryData.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="space-y-2 flex-1">
                  {deliveryData.map((d: any) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color === "#F4EAEB" ? "#EDE0E0" : d.color }} />
                        <span className="text-xs text-[#2A2424]/60">{d.name}</span>
                      </div>
                      <span className="text-xs font-bold text-[#2A2424]">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">Aucune donnée récente</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#EDE0E0] p-5 shadow-sm flex-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[#2A2424]">Tâches urgentes</h2>
              <span className="text-[10px] font-bold bg-[#F4EAEB] text-[#C08A8E] px-2 py-0.5 rounded-full">
                {urgentTasks.length} en attente
              </span>
            </div>
            <div className="space-y-2.5">
              {urgentTasks.map((t: any, i: number) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#F5F0EB]">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5 ${t.color}`}>
                    {t.type === "payment" ? "Paiement" : "Stock"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#2A2424] leading-tight">{t.order}</p>
                    <p className="text-[10px] text-[#2A2424]/50">{t.detail}</p>
                  </div>
                </div>
              ))}
              {urgentTasks.length === 0 && <p className="text-xs text-gray-400">Aucune tâche urgente.</p>}
            </div>
            <Link href="/dashboard/orders" className="mt-3 flex items-center justify-center gap-1 text-xs font-semibold text-[#C08A8E] hover:text-[#2A2424] transition-colors pt-2 border-t border-[#EDE0E0]">
              Voir toutes les commandes <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-[#EDE0E0] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDE0E0]">
            <h2 className="text-sm font-bold text-[#2A2424]">Commandes récentes</h2>
            <Link href="/dashboard/orders" className="flex items-center gap-1 text-xs font-semibold text-[#C08A8E] hover:text-[#2A2424] transition-colors">
              Voir tout <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F5F0EB]">
                  {["Commande", "Client", "Montant", "Date", "Statut"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold text-[#2A2424]/40 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order: any, i: number) => (
                  <tr key={order.id} className={`border-t border-[#EDE0E0] hover:bg-[#F5F0EB]/50 transition-colors cursor-pointer`}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-xs font-bold text-[#2A2424] font-mono">{order.id}</p>
                        <p className="text-[10px] text-[#2A2424]/40">{order.items} article{order.items > 1 ? "s" : ""}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-[#2A2424]">{order.customer}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-[#2A2424]">
                      {formatPrice(order.amount)} F
                    </td>
                    <td className="px-4 py-3 text-xs text-[#2A2424]/60">
                      {order.time}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-gray-400">Aucune commande.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-[#2A2424]">Top Produits</h2>
            <Link href="/dashboard/products" className="text-xs font-semibold text-[#C08A8E] hover:text-[#2A2424] transition-colors">
              Catalogue
            </Link>
          </div>
          <div className="space-y-4 flex-1">
            {topProducts.map((prod: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 shrink-0 rounded-full bg-[#F5F0EB] flex items-center justify-center text-[10px] font-bold text-[#C08A8E]">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#2A2424] truncate">{prod.name}</p>
                  <p className="text-[10px] text-[#2A2424]/50">{prod.brand}</p>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-xs text-gray-400">Pas de produits.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
