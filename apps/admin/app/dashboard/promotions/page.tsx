"use client";

import { useState, useEffect } from "react";
import { Copy, Plus, TrendingUp, Users, Tag, Check, Loader2 } from "lucide-react";

export default function PromotionsPage() {
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [newPromo, setNewPromo] = useState({ code: "", rate: 10, discount: 10, customer_id: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/influencer-stats"); // we will proxy this or call medusa directly
      // Actually in the admin dashboard we usually fetch via our Next.js API or direct
      const data = await res.json();
      setInfluencers(data.influencers || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="p-5 lg:p-8 max-w-6xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2A2424]" style={{ letterSpacing: "-0.02em" }}>Influenceurs & Promotions</h1>
          <p className="text-sm text-[#2A2424]/60 mt-0.5">Suivi des performances des ambassadrices et codes promo</p>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="bg-[#2A2424] text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-[#2A2424]/90 transition-colors"
        >
          {showCreate ? "Fermer" : <><Plus className="w-4 h-4" /> Nouveau Code</>}
        </button>
      </div>

      {/* CREATE FORM (Simplified UI placeholder) */}
      {showCreate && (
        <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm mb-6 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-sm font-bold text-[#2A2424] mb-4">Générer un Code Ambassadrice</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-[#2A2424]/60 mb-1">Code Promo (ex: AWA15)</label>
              <input type="text" className="w-full bg-[#F8F5F2] border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-[#2A2424]" placeholder="Code unique" value={newPromo.code} onChange={e => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#2A2424]/60 mb-1">Réduction Client (%)</label>
              <input type="number" className="w-full bg-[#F8F5F2] border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2A2424]" placeholder="Ex: 10" value={newPromo.discount} onChange={e => setNewPromo({...newPromo, discount: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#2A2424]/60 mb-1">Commission Ambassadrice (%)</label>
              <input type="number" className="w-full bg-[#F8F5F2] border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2A2424]" placeholder="Ex: 15" value={newPromo.rate} onChange={e => setNewPromo({...newPromo, rate: Number(e.target.value)})} />
            </div>
            <button className="bg-[#E5B6B9] text-[#2A2424] font-bold px-4 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-[#D5A6A9] transition-colors">
              Créer le code
            </button>
          </div>
          <p className="text-xs text-[#2A2424]/40 mt-3 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5"/> La création finale nécessite une connexion directe à l'API Medusa Promotions.</p>
        </div>
      )}

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#EDE0E0] shadow-sm flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F8F5F2] flex items-center justify-center text-[#2A2424]"><TrendingUp className="w-5 h-5"/></div>
          <div>
            <p className="text-xs font-bold text-[#2A2424]/40 uppercase tracking-wider">CA Généré par Influenceurs</p>
            <p className="text-2xl font-bold text-[#2A2424] mt-0.5">
              {influencers.reduce((acc, curr) => acc + curr.total_sales, 0).toLocaleString("fr-FR")} FCFA
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#EDE0E0] shadow-sm flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E5B6B9]/20 flex items-center justify-center text-[#C2164A]"><Tag className="w-5 h-5"/></div>
          <div>
            <p className="text-xs font-bold text-[#2A2424]/40 uppercase tracking-wider">Commissions à payer</p>
            <p className="text-2xl font-bold text-[#C2164A] mt-0.5">
              {influencers.reduce((acc, curr) => acc + curr.pending_commissions, 0).toLocaleString("fr-FR")} FCFA
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#EDE0E0] shadow-sm flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F8F5F2] flex items-center justify-center text-[#2A2424]"><Users className="w-5 h-5"/></div>
          <div>
            <p className="text-xs font-bold text-[#2A2424]/40 uppercase tracking-wider">Ambassadrices Actives</p>
            <p className="text-2xl font-bold text-[#2A2424] mt-0.5">
              {influencers.length}
            </p>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-[#EDE0E0] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[#EDE0E0] flex items-center justify-between">
           <h2 className="text-sm font-bold text-[#2A2424]">Classement des Performances</h2>
        </div>
        
        {loading ? (
          <div className="p-12 flex justify-center items-center"><Loader2 className="w-6 h-6 animate-spin text-[#2A2424]/40"/></div>
        ) : influencers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-[#2A2424]/40">Aucun influenceur ou code promo actif trouvé.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8F5F2] text-[#2A2424]/60 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Influenceur</th>
                  <th className="px-6 py-4 font-bold">Codes</th>
                  <th className="px-6 py-4 font-bold">Utilisations</th>
                  <th className="px-6 py-4 font-bold">CA Généré</th>
                  <th className="px-6 py-4 font-bold text-right">Commission Dues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE0E0]">
                {influencers.map((inf, i) => (
                  <tr key={i} className="hover:bg-[#FDFDFC] transition-colors">
                    <td className="px-6 py-4 font-medium text-[#2A2424]">{inf.name || inf.influencer_id}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {inf.codes.map((c: any) => (
                           <span key={c.code} className="inline-flex items-center gap-1 bg-[#2A2424] text-white text-[10px] font-bold px-2 py-1 rounded-md tracking-wider">
                             {c.code} <span className="text-white/50">({c.rate}%)</span>
                           </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#2A2424]">{inf.total_uses}</td>
                    <td className="px-6 py-4 font-bold text-[#2A2424]">{inf.total_sales.toLocaleString("fr-FR")} FCFA</td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-[#C2164A]">{inf.pending_commissions.toLocaleString("fr-FR")} FCFA</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
