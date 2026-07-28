"use client";

import { useState } from "react";
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

/* ─── Mock data (remplacé par API réelle en phase 2) ────────────── */
const salesData = [
  { month: "Jan", value: 420000 },
  { month: "Fév", value: 380000 },
  { month: "Mar", value: 510000 },
  { month: "Avr", value: 490000 },
  { month: "Mai", value: 620000 },
  { month: "Jun", value: 580000 },
  { month: "Jul", value: 780000 },
  { month: "Aoû", value: 920000 },
];

const deliveryData = [
  { name: "Domicile", value: 58, color: "#2A2424" },
  { name: "Hippodrome", value: 25, color: "#C08A8E" },
  { name: "Playce", value: 17, color: "#F4EAEB" },
];

const recentOrders = [
  { id: "WLF-M8X2K", customer: "Aïssatou Diallo", items: 3, amount: 54500, payment: "Wave", delivery: "Domicile", status: "pending_payment", time: "il y a 5 min" },
  { id: "WLF-N9Y3L", customer: "Fatou Ndiaye", items: 1, amount: 18500, payment: "Orange Money", delivery: "Hippodrome", status: "paid", time: "il y a 18 min" },
  { id: "WLF-P2Z4M", customer: "Rokhaya Ba", items: 2, amount: 33000, payment: "Wave", delivery: "Playce", status: "ready", time: "il y a 42 min" },
  { id: "WLF-Q5A5N", customer: "Mariama Camara", items: 4, amount: 78000, payment: "Free Money", delivery: "Domicile", status: "shipped", time: "il y a 1h" },
  { id: "WLF-R6B6O", customer: "Binta Sow", items: 1, amount: 22000, payment: "Wave", delivery: "Hippodrome", status: "delivered", time: "il y a 3h" },
];

const urgentTasks = [
  { type: "payment", label: "Paiement à confirmer", order: "WLF-M8X2K", detail: "Wave · 54 500 FCFA", time: "il y a 5 min", color: "bg-amber-100 text-amber-700" },
  { type: "stock", label: "Stock faible", order: "COSRX Snail Mucin", detail: "3 unités restantes", time: "il y a 2h", color: "bg-red-100 text-red-600" },
  { type: "payment", label: "Paiement à confirmer", order: "WLF-T8D8Q", detail: "Orange Money · 18 500 FCFA", time: "il y a 3h", color: "bg-amber-100 text-amber-700" },
];

const topProducts = [
  { name: "COSRX Snail 96 Mucin", brand: "COSRX", sold: 142, trend: 12 },
  { name: "Beauty of Joseon SPF 50+", brand: "Beauty of Joseon", sold: 98, trend: 8 },
  { name: "Anua Niacinamide Toner", brand: "Anua", sold: 87, trend: -3 },
  { name: "Laneige Lip Sleeping Mask", brand: "Laneige", sold: 74, trend: 5 },
  { name: "Purito Centella Serum", brand: "Purito", sold: 61, trend: 15 },
];

/* ─── Status badge ──────────────────────────────────────────────── */
const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending_payment: { label: "En attente paiement", className: "bg-amber-50 text-amber-600 border border-amber-200" },
  paid: { label: "Payé", className: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  ready: { label: "Prêt", className: "bg-blue-50 text-blue-600 border border-blue-200" },
  shipped: { label: "Expédié", className: "bg-purple-50 text-purple-600 border border-purple-200" },
  delivered: { label: "Livré", className: "bg-[#F4EAEB] text-[#C08A8E] border border-[#EDE0E0]" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { label: status, className: "bg-gray-50 text-gray-500" };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${s.className}`}>
      {s.label}
    </span>
  );
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

/* ─── KPI Card ──────────────────────────────────────────────────── */
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
        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
          deltaPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
        }`}>
          {deltaPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {delta}
        </span>
      </div>
      <p className="text-2xl font-bold text-[#2A2424] mb-0.5">{value}</p>
      <p className="text-xs text-[#2A2424]/50">{label}</p>
      {sub && <p className="text-[10px] text-[#2A2424]/30 mt-1">{sub}</p>}
    </motion.div>
  );
}

/* ─── Custom Tooltip ────────────────────────────────────────────── */
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

/* ─── Main Component ────────────────────────────────────────────── */
export default function DashboardPage() {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "quarterly">("monthly");

  return (
    <div className="p-5 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2A2424]" style={{ letterSpacing: "-0.02em" }}>
            Vue d'ensemble
          </h1>
          <p className="text-sm text-[#2A2424]/40 mt-0.5">Lundi 28 juillet 2026 — Bonne journée 👋</p>
        </div>
        <button className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-white border border-[#EDE0E0] rounded-xl text-sm font-semibold text-[#2A2424]/60 hover:text-[#2A2424] transition-colors shadow-sm">
          <Download className="w-4 h-4" />
          Exporter rapport
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="CA du mois" value="1 240 000 FCFA" delta="+12.5%" deltaPositive icon={ShoppingBag} sub="vs mois dernier" />
        <KpiCard label="Commandes" value="47" delta="+8.3%" deltaPositive icon={Package} sub="ce mois" />
        <KpiCard label="Nouveaux clients" value="23" delta="+5%" deltaPositive icon={Users} sub="ce mois" />
        <KpiCard label="Panier moyen" value="26 383 FCFA" delta="-2.1%" deltaPositive={false} icon={Store} sub="ce mois" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Chart — 2/3 width */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-[#2A2424]">Tendance des ventes</h2>
              <p className="text-xs text-[#2A2424]/40 mt-0.5">Chiffre d'affaires en FCFA</p>
            </div>
            <div className="flex items-center gap-1 bg-[#F5F0EB] rounded-xl p-1">
              {(["weekly", "monthly", "quarterly"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all ${
                    period === p ? "bg-[#2A2424] text-white shadow-sm" : "text-[#2A2424]/50 hover:text-[#2A2424]"
                  }`}
                >
                  {p === "weekly" ? "Hebdo" : p === "monthly" ? "Mensuel" : "Trimestriel"}
                </button>
              ))}
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

        {/* Delivery breakdown + Urgent tasks — 1/3 */}
        <div className="flex flex-col gap-4">

          {/* Delivery donut */}
          <div className="bg-white rounded-2xl border border-[#EDE0E0] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#2A2424]">Modes de livraison</h2>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">● Live</span>
            </div>
            <div className="flex items-center gap-4">
              <PieChart width={90} height={90}>
                <Pie data={deliveryData} cx={40} cy={40} innerRadius={28} outerRadius={42} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {deliveryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
              <div className="space-y-2 flex-1">
                {deliveryData.map((d) => (
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
          </div>

          {/* Urgent tasks */}
          <div className="bg-white rounded-2xl border border-[#EDE0E0] p-5 shadow-sm flex-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[#2A2424]">Tâches urgentes</h2>
              <span className="text-[10px] font-bold bg-[#F4EAEB] text-[#C08A8E] px-2 py-0.5 rounded-full">
                {urgentTasks.length} en attente
              </span>
            </div>
            <div className="space-y-2.5">
              {urgentTasks.map((t, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#F5F0EB]">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5 ${t.color}`}>
                    {t.type === "payment" ? "Paiement" : "Stock"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#2A2424] leading-tight">{t.order}</p>
                    <p className="text-[10px] text-[#2A2424]/50">{t.detail}</p>
                  </div>
                  <span className="text-[10px] text-[#2A2424]/30 whitespace-nowrap shrink-0">{t.time}</span>
                </div>
              ))}
            </div>
            <Link href="/dashboard/orders" className="mt-3 flex items-center justify-center gap-1 text-xs font-semibold text-[#C08A8E] hover:text-[#2A2424] transition-colors pt-2 border-t border-[#EDE0E0]">
              Voir toutes les tâches <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom grid: Recent orders + Top products */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Recent orders — 2/3 */}
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
                  {["Commande", "Client", "Montant", "Mode", "Livraison", "Statut"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold text-[#2A2424]/40 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, i) => (
                  <tr key={order.id} className={`border-t border-[#EDE0E0] hover:bg-[#F5F0EB]/50 transition-colors cursor-pointer ${i % 2 === 0 ? "" : ""}`}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-xs font-bold text-[#2A2424] font-mono">{order.id}</p>
                        <p className="text-[10px] text-[#2A2424]/40">{order.items} article{order.items > 1 ? "s" : ""}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-[#2A2424]">{order.customer}</p>
                      <p className="text-[10px] text-[#2A2424]/40">{order.time}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold text-[#2A2424] whitespace-nowrap">{formatPrice(order.amount)} F</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-semibold text-[#2A2424]/60 bg-[#F5F0EB] px-2 py-1 rounded-lg whitespace-nowrap">
                        📱 {order.payment}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-semibold text-[#2A2424]/60">
                        {order.delivery === "Domicile" ? "🏠" : "🏪"} {order.delivery}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top products — 1/3 */}
        <div className="bg-white rounded-2xl border border-[#EDE0E0] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#2A2424]">Top Produits</h2>
            <select className="text-[10px] font-semibold text-[#2A2424]/50 bg-[#F5F0EB] border border-[#EDE0E0] rounded-lg px-2 py-1 outline-none">
              <option>Ce mois</option>
              <option>Cette semaine</option>
              <option>Cette année</option>
            </select>
          </div>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#2A2424]/20 w-4 text-right shrink-0">{i + 1}</span>
                <div className="w-9 h-9 rounded-xl bg-[#F5F0EB] flex items-center justify-center shrink-0 text-sm">
                  🌿
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#2A2424] truncate">{p.name}</p>
                  <p className="text-[10px] text-[#2A2424]/40">{p.sold} vendus</p>
                </div>
                <div className="flex items-center gap-1">
                  {p.trend >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                  <span className={`text-[10px] font-bold ${p.trend >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                    {p.trend > 0 ? "+" : ""}{p.trend}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
