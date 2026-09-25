"use client";

import { useState } from "react";
import { Users, Search, Filter, BarChart2, FileText, ShoppingBag, DollarSign, X, ExternalLink, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";

function StatusBadge({ status }: { status: string }) {
  let colorClass = "bg-gray-100 text-gray-700 border-gray-200";
  let label = status;

  if (status === "pending") {
    colorClass = "bg-amber-50 text-amber-700 border-amber-200";
    label = "En attente";
  } else if (status === "approved") {
    colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    label = "Approuvée";
  } else if (status === "rejected") {
    colorClass = "bg-rose-50 text-rose-700 border-rose-200";
    label = "Refusée";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {label}
    </span>
  );
}

export function AmbassadorClient({ applications, influencers }: { applications: any[], influencers: any[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("metrics");
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setIsUpdating(newStatus);
    try {
      const res = await fetch(`/api/admin/ambassador-applications/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Erreur");
      setSelectedApp((prev: any) => prev ? { ...prev, status: newStatus } : null);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la mise à jour");
    } finally {
      setIsUpdating(null);
    }
  };

  const formatUrl = (val: string, platform: string) => {
    if (!val) return "#";
    if (val.startsWith("http")) return val;
    const v = val.replace(/^@/, "").trim();
    if (platform === "instagram") return `https://instagram.com/${v}`;
    if (platform === "tiktok") return `https://tiktok.com/@${v}`;
    if (platform === "youtube") return `https://youtube.com/@${v}`;
    return val;
  };

  const formatDisplay = (val: string) => {
    if (!val) return "";
    if (val.startsWith("http")) {
      try {
        const url = new URL(val);
        const path = url.pathname !== "/" ? url.pathname : "";
        return (url.hostname.replace("www.", "") + path).substring(0, 30) + (val.length > 30 ? "..." : "");
      } catch {
        return val.substring(0, 30);
      }
    }
    return val.startsWith("@") ? val : `@${val}`;
  };

  const tabs = [
    { id: "metrics", label: "Métriques / Activités", icon: BarChart2 },
    { id: "candidatures", label: "Candidatures", icon: FileText }
  ];

  return (
    <div className="p-5 lg:p-8 space-y-6 max-w-[1200px] w-full pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-[#C08A8E]/10 rounded-xl text-[#C08A8E]">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-[#2A2424]">Ambassadrices</h1>
          </div>
          <p className="text-[#2A2424]/60">Gérez les demandes de partenariat et suivez leurs performances.</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex overflow-x-auto hide-scrollbar bg-white p-1.5 rounded-2xl border border-[#EDE0E0] shadow-sm max-w-fit">
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
      <div className="bg-white rounded-2xl border border-[#EDE0E0] overflow-hidden shadow-sm">
        
        {activeTab === "metrics" && (
          <div className="flex flex-col">
            <div className="p-6 border-b border-[#EDE0E0]">
              <h2 className="text-lg font-bold text-[#2A2424] mb-4">Performances des Ambassadrices</h2>
              
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 border border-[#EDE0E0] rounded-xl flex items-start gap-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Ambassadrices</p>
                    <p className="text-xl font-bold text-[#2A2424] mt-1">{influencers.length}</p>
                  </div>
                </div>
                <div className="p-4 border border-[#EDE0E0] rounded-xl flex items-start gap-4">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Commandes</p>
                    <p className="text-xl font-bold text-[#2A2424] mt-1">
                      {influencers.reduce((acc, inf) => acc + (inf.total_uses || 0), 0)}
                    </p>
                  </div>
                </div>
                <div className="p-4 border border-[#EDE0E0] rounded-xl flex items-start gap-4">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Ventes (FCFA)</p>
                    <p className="text-xl font-bold text-[#2A2424] mt-1">
                      {new Intl.NumberFormat('fr-FR').format(influencers.reduce((acc, inf) => acc + (inf.total_sales || 0), 0))}
                    </p>
                  </div>
                </div>
                <div className="p-4 border border-[#EDE0E0] rounded-xl flex items-start gap-4">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Commissions (FCFA)</p>
                    <p className="text-xl font-bold text-[#2A2424] mt-1">
                      {new Intl.NumberFormat('fr-FR').format(influencers.reduce((acc, inf) => acc + (inf.pending_commissions || 0), 0))}
                    </p>
                  </div>
                </div>
              </div>

            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/80 text-gray-500 font-medium border-b border-[#EDE0E0]">
                  <tr>
                    <th className="py-3 px-6 font-medium">Ambassadrice</th>
                    <th className="py-3 px-6 font-medium">Codes Promo</th>
                    <th className="py-3 px-6 font-medium text-right">Utilisations</th>
                    <th className="py-3 px-6 font-medium text-right">Ventes Générées</th>
                    <th className="py-3 px-6 font-medium text-right">Commissions Dues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE0E0]">
                  {influencers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-500">
                        Aucune donnée d'activité trouvée.
                      </td>
                    </tr>
                  ) : (
                    influencers.map((inf, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-[#2A2424]">{inf.name}</div>
                          <div className="text-xs text-gray-500">{inf.influencer_id}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-1">
                            {inf.codes?.map((c: any) => (
                              <span key={c.code} className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">{c.code} ({c.rate}%)</span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right font-medium">
                          {inf.total_uses}
                        </td>
                        <td className="py-4 px-6 text-right font-medium text-emerald-600">
                          {new Intl.NumberFormat('fr-FR').format(inf.total_sales)} FCFA
                        </td>
                        <td className="py-4 px-6 text-right font-medium text-[#C08A8E]">
                          {new Intl.NumberFormat('fr-FR').format(inf.pending_commissions || 0)} FCFA
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "candidatures" && (
          <div className="flex flex-col">
            {/* Filters bar */}
            <div className="p-4 border-b border-[#EDE0E0] flex items-center justify-between gap-4 bg-gray-50/50">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Rechercher une candidate..." 
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C08A8E]/20"
                />
              </div>
              <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 flex items-center gap-2 hover:bg-gray-50">
                <Filter className="w-4 h-4" /> Filtres
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/80 text-gray-500 font-medium border-b border-[#EDE0E0]">
                  <tr>
                    <th className="py-3 px-6 font-medium">Candidate</th>
                    <th className="py-3 px-6 font-medium">Contact</th>
                    <th className="py-3 px-6 font-medium">Réseaux</th>
                    <th className="py-3 px-6 font-medium">Followers</th>
                    <th className="py-3 px-6 font-medium">Statut</th>
                    <th className="py-3 px-6 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE0E0]">
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        Aucune candidature trouvée.
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-[#2A2424]">{app.first_name} {app.last_name}</div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-[200px]" title={app.motivation}>
                            {app.motivation}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-[#2A2424]">{app.email}</div>
                          <div className="text-xs text-gray-500">{app.phone || "-"}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1 text-xs text-blue-600">
                            {app.instagram && <a href={formatUrl(app.instagram, "instagram")} target="_blank" rel="noreferrer" className="hover:underline">Instagram</a>}
                            {app.tiktok && <a href={formatUrl(app.tiktok, "tiktok")} target="_blank" rel="noreferrer" className="hover:underline">TikTok</a>}
                            {app.youtube && <a href={formatUrl(app.youtube, "youtube")} target="_blank" rel="noreferrer" className="hover:underline">YouTube</a>}
                            {(!app.instagram && !app.tiktok && !app.youtube && app.other_link) && <a href={formatUrl(app.other_link, "other")} target="_blank" rel="noreferrer" className="hover:underline">Lien</a>}
                          </div>
                        </td>
                        <td className="py-4 px-6 font-medium text-[#2A2424]">
                          {app.followers}
                        </td>
                        <td className="py-4 px-6">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button 
                            onClick={() => setSelectedApp(app)}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors shadow-sm"
                          >
                            Voir
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedApp && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedApp(null)}
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-[#EDE0E0]">
                <div>
                  <h2 className="text-xl font-bold text-[#2A2424]">Fiche Candidature</h2>
                  <p className="text-sm text-gray-500 mt-1">Détails soumis par l'ambassadrice</p>
                </div>
                <button 
                  onClick={() => setSelectedApp(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#F5F0EB] rounded-full flex items-center justify-center text-[#2A2424] text-xl font-bold">
                      {selectedApp.first_name[0]}{selectedApp.last_name[0]}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-[#2A2424]">{selectedApp.first_name} {selectedApp.last_name}</h3>
                      <p className="text-[#2A2424]/60">{selectedApp.email}</p>
                    </div>
                  </div>
                  <StatusBadge status={selectedApp.status} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Informations Générales</h4>
                    <ul className="space-y-3">
                      <li className="flex justify-between text-sm">
                        <span className="text-gray-500">Téléphone</span>
                        <span className="font-medium text-[#2A2424]">{selectedApp.phone || "-"}</span>
                      </li>
                      <li className="flex justify-between text-sm">
                        <span className="text-gray-500">Taille Communauté</span>
                        <span className="font-medium text-[#2A2424]">{selectedApp.followers}</span>
                      </li>
                      <li className="flex justify-between text-sm">
                        <span className="text-gray-500">Type de Contenu</span>
                        <span className="font-medium text-[#2A2424]">{selectedApp.content_type}</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Réseaux Sociaux</h4>
                    <ul className="space-y-3">
                      {selectedApp.instagram && (
                        <li className="flex justify-between text-sm items-center">
                          <span className="text-gray-500">Instagram</span>
                          <a href={formatUrl(selectedApp.instagram, "instagram")} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium text-blue-600 hover:underline text-right break-all ml-4">
                            {formatDisplay(selectedApp.instagram)} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        </li>
                      )}
                      {selectedApp.tiktok && (
                        <li className="flex justify-between text-sm items-center">
                          <span className="text-gray-500">TikTok</span>
                          <a href={formatUrl(selectedApp.tiktok, "tiktok")} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium text-blue-600 hover:underline text-right break-all ml-4">
                            {formatDisplay(selectedApp.tiktok)} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        </li>
                      )}
                      {selectedApp.youtube && (
                        <li className="flex justify-between text-sm items-center">
                          <span className="text-gray-500">YouTube</span>
                          <a href={formatUrl(selectedApp.youtube, "youtube")} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium text-blue-600 hover:underline text-right break-all ml-4">
                            {formatDisplay(selectedApp.youtube)} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        </li>
                      )}
                      {selectedApp.other_link && (
                        <li className="flex justify-between text-sm items-center">
                          <span className="text-gray-500">Autre Lien</span>
                          <a href={formatUrl(selectedApp.other_link, "other")} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium text-blue-600 hover:underline text-right break-all ml-4">
                            {formatDisplay(selectedApp.other_link)} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Motivation</h4>
                  <div className="bg-gray-50 p-4 rounded-xl text-sm text-[#2A2424] whitespace-pre-wrap leading-relaxed border border-gray-100">
                    {selectedApp.motivation}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-[#EDE0E0] bg-gray-50/50 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setSelectedApp(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Fermer
                </button>
                {selectedApp.status === "pending" && (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus(selectedApp.id, "rejected")}
                      disabled={isUpdating !== null}
                      className="flex items-center justify-center min-w-[120px] px-5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-200 disabled:opacity-50"
                    >
                      {isUpdating === "rejected" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refuser"}
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(selectedApp.id, "approved")}
                      disabled={isUpdating !== null}
                      className="flex items-center justify-center min-w-[200px] px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#2A2424] hover:bg-black transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isUpdating === "approved" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approuver la candidature"}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
