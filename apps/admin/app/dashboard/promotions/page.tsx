"use client";

import { useState, useEffect } from "react";
import { Copy, Plus, TrendingUp, Users, Tag, Check, Loader2, CheckCircle, XCircle, FileText } from "lucide-react";

export default function PromotionsPage() {
  const [activeTab, setActiveTab] = useState("performances");
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [newPromo, setNewPromo] = useState({ code: "", rate: 10, discount: 10, customer_id: "" });
  
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);

  useEffect(() => {
    fetchStats();
    fetchApplications();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/influencer-stats");
      const data = await res.json();
      setInfluencers(data.influencers || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const res = await fetch("/api/admin/ambassador-applications");
      const data = await res.json();
      setApplications(data.ambassador_applications || []);
    } catch (e) {
      console.error(e);
    }
    setLoadingApps(false);
  };

  const updateAppStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/ambassador-applications/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setApplications(apps => apps.map(a => a.id === id ? { ...a, status } : a));
        if (selectedApp?.id === id) setSelectedApp({ ...selectedApp, status });
      }
    } catch (e) {
      console.error(e);
    }
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
          <p className="text-sm text-[#2A2424]/60 mt-0.5">Suivi des performances des ambassadrices et demandes de candidatures</p>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="bg-[#2A2424] text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-[#2A2424]/90 transition-colors"
        >
          {showCreate ? "Fermer" : <><Plus className="w-4 h-4" /> Nouveau Code</>}
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-6 border-b border-[#EDE0E0]">
        <button 
          onClick={() => setActiveTab("performances")}
          className={`pb-3 text-sm font-bold transition-colors ${activeTab === "performances" ? "text-[#C2164A] border-b-2 border-[#C2164A]" : "text-[#2A2424]/60 hover:text-[#2A2424]"}`}
        >
          Performances
        </button>
        <button 
          onClick={() => setActiveTab("candidatures")}
          className={`pb-3 text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === "candidatures" ? "text-[#C2164A] border-b-2 border-[#C2164A]" : "text-[#2A2424]/60 hover:text-[#2A2424]"}`}
        >
          Demandes de Candidatures
          {applications.filter(a => a.status === "pending").length > 0 && (
            <span className="bg-[#C2164A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {applications.filter(a => a.status === "pending").length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "performances" && (
        <div className="space-y-6 animate-in fade-in">
          {/* CREATE FORM */}
          {showCreate && (
            <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm mb-6">
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
      )}

      {activeTab === "candidatures" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
          {/* Liste des candidatures */}
          <div className="lg:col-span-2 bg-white border border-[#EDE0E0] rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="px-6 py-4 border-b border-[#EDE0E0]">
              <h2 className="text-sm font-bold text-[#2A2424]">Toutes les candidatures</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingApps ? (
                <div className="flex justify-center items-center h-full"><Loader2 className="w-6 h-6 animate-spin text-[#2A2424]/40"/></div>
              ) : applications.length === 0 ? (
                <div className="p-12 text-center h-full flex flex-col items-center justify-center">
                  <FileText className="w-12 h-12 text-[#2A2424]/20 mb-3" />
                  <p className="text-sm text-[#2A2424]/60 font-medium">Aucune candidature pour le moment.</p>
                </div>
              ) : (
                <ul className="divide-y divide-[#EDE0E0]">
                  {applications.map((app) => (
                    <li 
                      key={app.id} 
                      onClick={() => setSelectedApp(app)}
                      className={`p-5 cursor-pointer transition-colors ${selectedApp?.id === app.id ? "bg-[#F4EAEB]" : "hover:bg-[#F8F5F2]"}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-[#2A2424]">{app.first_name} {app.last_name}</p>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                          app.status === "pending" ? "bg-amber-100 text-amber-800" :
                          app.status === "approved" ? "bg-emerald-100 text-emerald-800" :
                          "bg-rose-100 text-rose-800"
                        }`}>
                          {app.status === "pending" ? "En attente" : app.status === "approved" ? "Approuvé" : "Rejeté"}
                        </span>
                      </div>
                      <p className="text-xs text-[#2A2424]/60 flex gap-2">
                        <span>{app.followers} abonnés</span>
                        <span>•</span>
                        <span>{app.content_type}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Détails de la candidature */}
          <div className="bg-white border border-[#EDE0E0] rounded-2xl shadow-sm overflow-hidden h-[600px] flex flex-col">
            <div className="px-6 py-4 border-b border-[#EDE0E0]">
              <h2 className="text-sm font-bold text-[#2A2424]">Détails du Profil</h2>
            </div>
            {selectedApp ? (
              <div className="p-6 flex-1 overflow-y-auto space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-[#2A2424]">{selectedApp.first_name} {selectedApp.last_name}</h3>
                  <a href={`mailto:${selectedApp.email}`} className="text-sm text-[#C2164A] font-medium hover:underline">{selectedApp.email}</a>
                  {selectedApp.phone && <p className="text-sm text-[#2A2424]/70">{selectedApp.phone}</p>}
                </div>

                <div className="space-y-3 pt-4 border-t border-[#EDE0E0]">
                  <p className="text-xs font-bold text-[#2A2424]/50 uppercase tracking-wider">Réseaux Sociaux</p>
                  {selectedApp.instagram && <p className="text-sm"><strong className="text-[#2A2424]">Instagram:</strong> {selectedApp.instagram}</p>}
                  {selectedApp.tiktok && <p className="text-sm"><strong className="text-[#2A2424]">TikTok:</strong> {selectedApp.tiktok}</p>}
                  {selectedApp.youtube && <p className="text-sm"><strong className="text-[#2A2424]">YouTube:</strong> {selectedApp.youtube}</p>}
                  {selectedApp.other_link && <p className="text-sm"><strong className="text-[#2A2424]">Autre:</strong> {selectedApp.other_link}</p>}
                  <p className="text-sm"><strong className="text-[#2A2424]">Taille d'audience:</strong> {selectedApp.followers}</p>
                  <p className="text-sm"><strong className="text-[#2A2424]">Type de contenu:</strong> {selectedApp.content_type}</p>
                </div>

                <div className="space-y-2 pt-4 border-t border-[#EDE0E0]">
                  <p className="text-xs font-bold text-[#2A2424]/50 uppercase tracking-wider">Motivation</p>
                  <p className="text-sm text-[#2A2424]/80 leading-relaxed bg-[#F8F5F2] p-4 rounded-xl italic">
                    "{selectedApp.motivation}"
                  </p>
                </div>

                {selectedApp.status === "pending" && (
                  <div className="pt-6 flex gap-3">
                    <button 
                      onClick={() => updateAppStatus(selectedApp.id, "approved")}
                      className="flex-1 bg-[#2A2424] text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" /> Approuver
                    </button>
                    <button 
                      onClick={() => updateAppStatus(selectedApp.id, "rejected")}
                      className="flex-1 bg-white border border-[#EDE0E0] text-[#2A2424] py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#F8F5F2] transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Rejeter
                    </button>
                  </div>
                )}
                {selectedApp.status !== "pending" && (
                   <div className="pt-6 text-center">
                     <p className="text-sm font-bold text-[#2A2424]/50">
                       Candidature {selectedApp.status === "approved" ? "approuvée" : "rejetée"}.
                     </p>
                   </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-6 text-[#2A2424]/40">
                <Users className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">Sélectionnez une candidature pour voir les détails.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
