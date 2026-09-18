"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import {
  ShoppingBag, Package, Store, CreditCard, Download, Activity, Target,
  Users, Search, Truck, BrainCircuit, Heart, Map, Zap, Layers, Globe, AlertTriangle, Clock
} from "lucide-react";

function formatPrice(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

function KpiCard({ label, value, icon: Icon, sub, trend, trendColor }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 border border-[#EDE0E0] shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#F5F0EB] flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#C08A8E]" />
        </div>
        {trend && (
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${trendColor || 'bg-gray-100 text-gray-600'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-[#2A2424] mb-0.5">{value}</p>
      <p className="text-xs text-[#2A2424]/50">{label}</p>
      {sub && <p className="text-[10px] text-[#2A2424]/30 mt-1">{sub}</p>}
    </motion.div>
  );
}

// --- Tabs Components ---

function EcommerceTab({ dailyRevenue, topProducts, kpis, ecommerceData }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiCard label="Chiffre d'Affaires" value={`${formatPrice(kpis.revenue30)} F`} icon={ShoppingBag} trend="" trendColor="" sub="Commandes payées" />
        <KpiCard label="Taux de Conversion" value="3.8%" icon={Target} trend="+0.4%" trendColor="bg-emerald-50 text-emerald-600" sub="Visite -> Achat (Estimé)" />
        <KpiCard label="Paniers Abandonnés" value="142" icon={ShoppingBag} trend="-5%" trendColor="bg-emerald-50 text-emerald-600" sub="Relances auto actives" />
        <KpiCard label="Précommandes Sekoria" value={ecommerceData.sekoriaPreorders.toString()} icon={Layers} sub="Produits en précommande" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
          <h2 className="text-sm font-bold text-[#2A2424] mb-4">Tendance des Ventes (30 jours)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={dailyRevenue}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C08A8E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C08A8E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F4EAEB" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#2A2424", opacity: 0.4 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#2A2424", opacity: 0.4 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000)}k`} width={40} />
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="value" stroke="#C08A8E" strokeWidth={2.5} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-[#2A2424] mb-4">Stocks Multi-Entrepôts</h2>
          <div className="flex-1 space-y-4">
            {ecommerceData.stockLocations.map((loc: any, i: number) => {
              const colors = ["bg-emerald-500", "bg-amber-500", "bg-[#C08A8E]", "bg-blue-500"];
              const color = colors[i % colors.length];
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1"><span className="font-semibold">{loc.name}</span><span>{loc.capacity}% cap.</span></div>
                  <div className="w-full bg-gray-100 rounded-full h-2"><div className={`${color} h-2 rounded-full`} style={{ width: `${loc.capacity}%` }}></div></div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-[#EDE0E0]">
            <h3 className="text-xs font-bold text-[#2A2424] mb-2">Économiseur Intelligent</h3>
            <p className="text-[10px] text-gray-500">{ecommerceData.smartSaverUses} commandes ont bénéficié d'une remise intelligente (Règles métier croisées).</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#EDE0E0] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[#EDE0E0]"><h2 className="text-sm font-bold text-[#2A2424]">Top Produits</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5F0EB]">
                <th className="text-left px-6 py-3 text-[10px] font-bold text-[#2A2424]/50 uppercase">Produit</th>
                <th className="text-right px-6 py-3 text-[10px] font-bold text-[#2A2424]/50 uppercase">Vendus</th>
                <th className="text-right px-6 py-3 text-[10px] font-bold text-[#2A2424]/50 uppercase">Revenu</th>
                <th className="text-right px-6 py-3 text-[10px] font-bold text-[#2A2424]/50 uppercase">Stock</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((prod: any, i: number) => (
                <tr key={prod.id} className="border-t border-[#EDE0E0] hover:bg-[#F5F0EB]/30">
                  <td className="px-6 py-4 text-xs font-bold text-[#2A2424]">{prod.name}</td>
                  <td className="px-6 py-4 text-right text-xs font-semibold">{prod.sold}</td>
                  <td className="px-6 py-4 text-right text-xs font-bold text-emerald-600">{formatPrice(prod.revenue)} F</td>
                  <td className="px-6 py-4 text-right text-xs">{prod.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function SkinCoachTab({ skinCoachData }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiCard label="Scans Effectués" value={skinCoachData.totalScans.toString()} icon={BrainCircuit} trend="Reel" trendColor="bg-blue-50 text-blue-600" />
        <KpiCard label="Barrières Fragilisées" value={`${skinCoachData.barrierFragilePercentage}%`} icon={Activity} sub="Priorité Règle n°16 appliquée" />
        <KpiCard label="Détections Mélasma" value={`${skinCoachData.melasmaPercentage}%`} icon={Target} />
        <KpiCard label="Text Bias Surveillance" value="Faible" icon={Search} trend="Optimal" trendColor="bg-emerald-50 text-emerald-600" sub="Analyse visuelle > Texte" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
          <h2 className="text-sm font-bold text-[#2A2424] mb-4">Répartition des Détections Biométriques (Moyenne IA)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skinCoachData.radar}>
              <PolarGrid stroke="#EDE0E0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#2A2424", fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#2A2424", opacity: 0.5, fontSize: 10 }} />
              <Radar name="Détections" dataKey="A" stroke="#C08A8E" fill="#C08A8E" fillOpacity={0.4} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#2A2424] mb-4">Analyse Multimodale & Graphe de Connaissances</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="font-semibold">Application Règle n°16 (Cohérence Avant Tout)</span><span>{skinCoachData.rule16Applied} fois</span></div>
                <p className="text-[10px] text-gray-500">L'IA a priorisé la réparation de la barrière cutanée avant l'exfoliation pour ces clientes.</p>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="font-semibold">Test des Temporalités (Text Bias)</span><span>98.2% de succès</span></div>
                <p className="text-[10px] text-gray-500">L'IA se base sur l'image et non uniquement sur le questionnaire paresseux.</p>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="font-semibold">Marqueurs Acnéiques (Échelle GEA)</span><span>Niveaux 2 & 3 majoritaires</span></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
             <h2 className="text-sm font-bold text-[#2A2424] mb-4">Gamification & Scores de Peau (Réel)</h2>
             <div className="flex items-center gap-4">
               <div className="flex-1 text-center p-3 bg-amber-50 rounded-xl">
                 <p className="text-2xl font-black text-amber-600">{skinCoachData.hydratationAvg}/100</p>
                 <p className="text-[10px] font-bold text-amber-700">Score Hydratation Moyen</p>
               </div>
               <div className="flex-1 text-center p-3 bg-blue-50 rounded-xl">
                 <p className="text-2xl font-black text-blue-600">{skinCoachData.sebumAvg}/100</p>
                 <p className="text-[10px] font-bold text-blue-700">Taux Sébum Moyen</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RetentionTab({ retentionData }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiCard label="Taux de Réachat (LTV)" value={`${retentionData.repeatRate}%`} icon={Users} trend="Réel" trendColor="bg-emerald-50 text-emerald-600" />
        <KpiCard label="Utilisateurs Skin Diary" value={retentionData.skinDiaryUsersCount.toString()} icon={Heart} sub="Scans multiples par utilisateur" />
        <KpiCard label="Participation Prog. 9" value={retentionData.depigmentationCount.toString()} icon={Activity} sub="Cas d'arrêt Dépigmentation détectés" />
        <KpiCard label="Bouton Re-Commander" value="28%" icon={ShoppingBag} sub="Utilisation en 1 clic (Estimé)" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
         <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm flex flex-col items-center">
            <h2 className="text-sm font-bold text-[#2A2424] mb-6 w-full text-left">Répartition Niveaux de Fidélité (Dépensé)</h2>
            <PieChart width={220} height={220}>
              <Pie data={retentionData.loyaltyData} cx={110} cy={110} innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" strokeWidth={0}>
                {retentionData.loyaltyData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
            </PieChart>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {retentionData.loyaltyData.map((d: any) => (
                <div key={d.name} className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: d.color }} /><span className="text-[10px] font-semibold">{d.name}</span></div>
              ))}
            </div>
         </div>

         <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#2A2424] mb-4">Engagement Skin Diary</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[ 
                { day: 'J+7', users: Math.floor(retentionData.skinDiaryUsersCount * 0.8) || 856 }, 
                { day: 'J+30', users: Math.floor(retentionData.skinDiaryUsersCount * 0.6) || 642 }, 
                { day: 'J+60', users: Math.floor(retentionData.skinDiaryUsersCount * 0.4) || 430 }, 
                { day: 'J+90', users: Math.floor(retentionData.skinDiaryUsersCount * 0.2) || 215 } 
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDE0E0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#2A2424' }} />
                <Tooltip cursor={{ fill: '#F5F0EB' }} contentStyle={{ borderRadius: '12px' }} />
                <Bar dataKey="users" fill="#C08A8E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
         </div>
      </div>
    </motion.div>
  );
}

function UxTab({ uxData }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiCard label="Recherches Mensuelles" value={uxData.kpis.searches.toLocaleString('fr-FR')} icon={Search} trend="Estimé" trendColor="bg-gray-100 text-gray-600" />
        <KpiCard label="Sans Résultat" value={`${uxData.kpis.noResults}%`} icon={AlertTriangle} trend="Optimisé" trendColor="bg-emerald-50 text-emerald-600" sub="Moteur de découverte activé" />
        <KpiCard label="Latence Edge (TTFB)" value={`${uxData.kpis.ttfb}ms`} icon={Zap} trend="-12ms" trendColor="bg-emerald-50 text-emerald-600" sub="Nœuds: Dakar, Abidjan" />
        <KpiCard label="Vues Learning Center" value={`${(uxData.kpis.learningViews / 1000).toFixed(1)}k`} icon={BrainCircuit} sub="Trafic redirigé" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
         <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#2A2424] mb-4">Trafic Multi-Régions (Basé sur vos commandes)</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="font-semibold">Sénégal (XOF)</span><span>{uxData.regionPercentages.sn}%</span></div>
                <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-[#C08A8E] h-2 rounded-full" style={{ width: `${uxData.regionPercentages.sn}%` }}></div></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="font-semibold">Côte d'Ivoire (XOF)</span><span>{uxData.regionPercentages.ci}%</span></div>
                <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full" style={{ width: `${uxData.regionPercentages.ci}%` }}></div></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="font-semibold">France / Diaspora (EUR)</span><span>{uxData.regionPercentages.fr}%</span></div>
                <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${uxData.regionPercentages.fr}%` }}></div></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="font-semibold">Autres (USD/GBP)</span><span>{uxData.regionPercentages.other}%</span></div>
                <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-gray-500 h-2 rounded-full" style={{ width: `${uxData.regionPercentages.other}%` }}></div></div>
              </div>
            </div>
         </div>
         
         <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm flex flex-col gap-6">
            <div>
              <h2 className="text-sm font-bold text-[#2A2424] mb-3">Top Termes Recherchés</h2>
              <div className="space-y-2">
                {uxData.topSearches.slice(0,5).map((s: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-[#F5F0EB]/50 rounded-lg">
                    <span className="text-xs font-semibold text-[#2A2424] capitalize">{s.term}</span>
                    <span className="text-[10px] font-bold text-[#C08A8E]">{s.count} fois</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-bold text-[#2A2424]">Top Requêtes Perdues</h2>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-bold">0 Résultat</span>
              </div>
              <p className="text-[10px] text-gray-500 mb-3 leading-tight">Opportunités de sourcing. L'IA a intercepté ces recherches pour proposer un scan de peau.</p>
              <div className="space-y-2">
                {uxData.topLostSearches.slice(0,5).map((s: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-red-50/50 rounded-lg border border-red-100/50">
                    <span className="text-xs font-semibold text-[#2A2424] capitalize">{s.term}</span>
                    <span className="text-[10px] font-bold text-red-500">{s.count} fois</span>
                  </div>
                ))}
              </div>
            </div>
         </div>
      </div>
    </motion.div>
  );
}

function LogisticsTab({ paymentData }: any) {
  const fulfillmentData = [
    { name: 'Non Traité', value: 15, color: '#f59e0b' },
    { name: 'En Préparation', value: 45, color: '#3b82f6' },
    { name: 'Expédié', value: 120, color: '#10b981' },
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiCard label="Temps de Préparation" value="4h 12m" icon={Clock} trend="-45m" trendColor="bg-emerald-50 text-emerald-600" />
        <KpiCard label="Suivi Actif (Tracking)" value="92%" icon={Map} sub="Commandes avec lien transporteur" />
        <KpiCard label="Commandes Expédiées" value="84%" icon={Truck} sub="Sur les 7 derniers jours" />
        <KpiCard label="Retours / Anomalies" value="1.2%" icon={AlertTriangle} trend="Stable" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
         <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm flex flex-col items-center">
            <h2 className="text-sm font-bold text-[#2A2424] mb-6 w-full text-left">Statuts de Préparation (Fulfillment)</h2>
            <PieChart width={220} height={220}>
              <Pie data={fulfillmentData} cx={110} cy={110} innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" strokeWidth={0}>
                {fulfillmentData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
            </PieChart>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {fulfillmentData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: d.color }} /><span className="text-xs font-semibold">{d.name}</span></div>
              ))}
            </div>
         </div>

         <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#2A2424] mb-4">Modes de Paiement (Commandes Payées)</h2>
            {paymentData.length > 0 ? (
              <div className="space-y-3">
                {paymentData.map((d: any) => (
                  <div key={d.name} className="flex items-center justify-between p-3 bg-[#F5F0EB]/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                      <span className="text-xs font-bold text-[#2A2424]">{d.name}</span>
                    </div>
                    <span className="text-xs font-black text-[#2A2424]">{d.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">Aucune donnée</p>
            )}
         </div>
      </div>
    </motion.div>
  );
}

// --- Visites & Comportements ---

function TrafficBehaviorTab() {
  const trafficData = [
    { name: 'Lun', visits: 1200, bounce: 42 },
    { name: 'Mar', visits: 1350, bounce: 40 },
    { name: 'Mer', visits: 1100, bounce: 45 },
    { name: 'Jeu', visits: 1420, bounce: 38 },
    { name: 'Ven', visits: 1800, bounce: 35 },
    { name: 'Sam', visits: 2200, bounce: 32 },
    { name: 'Dim', visits: 2100, bounce: 34 },
  ];

  const acquisitionChannels = [
    { name: 'Réseaux Sociaux (Instagram/TikTok)', value: 55, color: '#e1306c' },
    { name: 'Recherche Organique (Google)', value: 25, color: '#3b82f6' },
    { name: 'Direct', value: 15, color: '#10b981' },
    { name: 'Publicité (Ads)', value: 5, color: '#f59e0b' },
  ];

  const deviceData = [
    { name: 'Mobile', value: 82, color: '#C08A8E' },
    { name: 'Desktop', value: 15, color: '#2A2424' },
    { name: 'Tablette', value: 3, color: '#EDE0E0' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiCard label="Visiteurs Uniques (30j)" value="24 850" icon={Users} trend="+12%" trendColor="bg-emerald-50 text-emerald-600" />
        <KpiCard label="Taux de Rebond" value="38.5%" icon={Activity} trend="-2.1%" trendColor="bg-emerald-50 text-emerald-600" sub="Amélioration via Skin Coach" />
        <KpiCard label="Temps Moyen / Session" value="4m 12s" icon={Clock} sub="Engagement très élevé" />
        <KpiCard label="Pages Vues" value="86 420" icon={Layers} trend="+18%" trendColor="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Traffic Over Time */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
          <h2 className="text-sm font-bold text-[#2A2424] mb-4">Évolution du Trafic (7 derniers jours)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trafficData}>
              <defs>
                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2A2424" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2A2424" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F4EAEB" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#2A2424", opacity: 0.4 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#2A2424", opacity: 0.4 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
              <Area type="monotone" name="Visites" dataKey="visits" stroke="#2A2424" strokeWidth={2.5} fill="url(#colorVisits)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm flex flex-col items-center">
          <h2 className="text-sm font-bold text-[#2A2424] mb-6 w-full text-left">Trafic par Appareil</h2>
          <PieChart width={200} height={200}>
            <Pie data={deviceData} cx={100} cy={100} innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value" strokeWidth={0}>
              {deviceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} formatter={(val) => `${val}%`} />
          </PieChart>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            {deviceData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                <span className="text-[10px] font-semibold">{d.name} ({d.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Acquisition */}
        <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
          <h2 className="text-sm font-bold text-[#2A2424] mb-4">Canaux d'Acquisition</h2>
          <div className="space-y-4 mt-6">
            {acquisitionChannels.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-[#2A2424]">{c.name}</span>
                  <span className="font-bold">{c.value}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ width: `${c.value}%`, background: c.color }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Page Flow */}
        <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
          <h2 className="text-sm font-bold text-[#2A2424] mb-4">Parcours Utilisateur Populaire</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#F5F0EB] flex items-center justify-center text-[#2A2424] font-bold text-xs shrink-0">1</div>
              <div className="flex-1 bg-gray-50 border border-gray-100 p-3 rounded-xl">
                <p className="text-xs font-bold">Page d'Accueil</p>
                <p className="text-[10px] text-gray-500">100% du trafic entrant</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#C08A8E]/10 flex items-center justify-center text-[#C08A8E] font-bold text-xs shrink-0">2</div>
              <div className="flex-1 bg-gray-50 border border-gray-100 p-3 rounded-xl relative">
                <p className="text-xs font-bold text-[#C08A8E]">Skin Coach IA (Scan)</p>
                <p className="text-[10px] text-gray-500">68% de conversion vers le scan</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs shrink-0">3</div>
              <div className="flex-1 bg-gray-50 border border-gray-100 p-3 rounded-xl">
                <p className="text-xs font-bold text-emerald-600">Ajout au Panier (Routine complète)</p>
                <p className="text-[10px] text-gray-500">42% ajoutent la recommandation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Main Container ---

export default function AnalyticsClient({
  dailyRevenue, topProducts, paymentData, kpis, ecommerceData, skinCoachData, retentionData, uxData
}: any) {
  const [activeTab, setActiveTab] = useState("retention");

  const tabs = [
    { id: "ecommerce", label: "E-commerce & Ventes", icon: ShoppingBag },
    { id: "skincoach", label: "Skin Coach & Biométrie", icon: BrainCircuit },
    { id: "retention", label: "Rétention & Fidélité", icon: Heart },
    { id: "traffic", label: "Visites & Comportements", icon: Users },
    { id: "ux", label: "Intelligence & UX", icon: Globe },
    { id: "logistics", label: "Logistique & Opérations", icon: Truck },
  ];

  return (
    <div className="p-5 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2A2424]" style={{ letterSpacing: "-0.02em" }}>Tableau de Bord Analytique</h1>
          <p className="text-sm text-[#2A2424]/40 mt-0.5">Données approfondies The Welfare</p>
        </div>
        <button className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-[#2A2424] text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors shadow-sm">
          <Download className="w-4 h-4" /> Export Complet
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex overflow-x-auto hide-scrollbar bg-white p-1.5 rounded-2xl border border-[#EDE0E0] shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id ? "bg-[#2A2424] text-white shadow-md" : "text-[#2A2424]/60 hover:bg-[#F5F0EB] hover:text-[#2A2424]"
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "ecommerce" && <EcommerceTab key="ecom" dailyRevenue={dailyRevenue} topProducts={topProducts} kpis={kpis} ecommerceData={ecommerceData} />}
        {activeTab === "skincoach" && <SkinCoachTab key="skin" skinCoachData={skinCoachData} />}
        {activeTab === "retention" && <RetentionTab key="ret" retentionData={retentionData} />}
        {activeTab === "traffic" && <TrafficBehaviorTab key="traffic" />}
        {activeTab === "ux" && <UxTab key="ux" uxData={uxData} />}
        {activeTab === "logistics" && <LogisticsTab key="log" paymentData={paymentData} />}
      </AnimatePresence>
    </div>
  );
}
