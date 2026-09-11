import { useState, useEffect } from "react";
import { Sparkle, QrCode, Copy, SpinnerGap } from "@phosphor-icons/react";

export function DashboardInfluenceur() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    fetch("/api/store/influencer-stats?customer_id=cus_demo_1")
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const copyLink = (code: string) => {
    const link = `https://thewelfare.com?promo=${code}`;
    navigator.clipboard.writeText(link);
    setCopied(code);
    setTimeout(() => setCopied(""), 2000);
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-24">
        <SpinnerGap className="w-8 h-8 text-[#2A2424] animate-spin" />
      </div>
    );
  }

  const stats = data?.stats || { total_sales: 0, pending_commissions: 0, total_uses: 0 };
  const promotions = data?.promotions || [];

  return (
    <div className="w-full max-w-[1200px] mx-auto py-12 px-6">
      <div className="flex items-center gap-3 mb-2">
        <Sparkle className="w-6 h-6 text-[#E5B6B9]" />
        <h1 className="text-3xl font-bold text-[#2A2424]">Mon Tableau de bord</h1>
      </div>
      <p className="text-[#2A2424]/60 mb-10 text-lg">Suivez l'impact de vos recommandations en temps réel.</p>
      
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl border border-[#F4EAEB] shadow-sm flex flex-col justify-between min-h-[130px]">
          <p className="text-sm text-[#2A2424]/60 font-medium">Chiffre d'Affaires Généré</p>
          <p className="text-3xl font-bold text-[#2A2424]">{stats.total_sales.toLocaleString("fr-FR")} FCFA</p>
        </div>
        <div className="bg-[#2A2424] p-6 rounded-3xl shadow-md flex flex-col justify-between min-h-[130px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#E5B6B9]/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <p className="text-sm text-white/60 font-medium relative z-10">Commissions Gagnées</p>
          <p className="text-3xl font-bold text-[#E5B6B9] relative z-10">{stats.pending_commissions.toLocaleString("fr-FR")} FCFA</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-[#F4EAEB] shadow-sm flex flex-col justify-between min-h-[130px]">
          <p className="text-sm text-[#2A2424]/60 font-medium">Utilisations de votre Code</p>
          <p className="text-3xl font-bold text-[#2A2424]">{stats.total_uses}</p>
        </div>
      </div>
      
      {/* Outils de partage */}
      <h2 className="text-xl font-bold text-[#2A2424] mb-6">Vos Codes de Réduction</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {promotions.map((promo: any, i: number) => (
          <div key={i} className="bg-[#F8F5F2] p-8 rounded-3xl border border-[#F4EAEB] flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
               <h3 className="text-lg font-bold text-[#2A2424]">Code : <span className="text-[#C2164A]">{promo.code}</span></h3>
               <span className="bg-[#2A2424] text-white text-[10px] px-2 py-1 rounded-md font-bold">{promo.commission_rate}% de commission</span>
            </div>
            <p className="text-sm text-[#2A2424]/60 mb-6">Partagez ce code ou ce lien sur vos réseaux (Linktree, Bio Insta...).</p>
            
            <div className="flex items-center gap-2 mt-auto">
              <input 
                type="text" 
                readOnly 
                value={`https://thewelfare.com?promo=${promo.code}`}
                className="flex-1 bg-white border border-[#F4EAEB] rounded-xl px-4 py-3 text-sm text-[#2A2424] font-medium outline-none"
              />
              <button onClick={() => copyLink(promo.code)} className="bg-[#2A2424] text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-black transition-colors flex items-center gap-2">
                <Copy className="w-4 h-4" /> {copied === promo.code ? "Copié !" : "Copier"}
              </button>
            </div>
          </div>
        ))}

        {promotions.length === 0 && (
          <div className="bg-[#F8F5F2] p-8 rounded-3xl border border-[#F4EAEB] flex flex-col justify-center items-center h-full text-center">
            <p className="text-sm font-bold text-[#2A2424]/60 mb-2">Aucun code actif.</p>
            <p className="text-xs text-[#2A2424]/40">Veuillez contacter l'administration pour générer votre premier code influenceur.</p>
          </div>
        )}
      </div>

      {/* Historique */}
      {data?.recent_orders?.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-[#2A2424] mb-6">Ventes récentes via votre code</h2>
          <div className="bg-white border border-[#F4EAEB] rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8F5F2] text-[#2A2424]/60 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold">Client</th>
                  <th className="px-6 py-4 font-bold text-right">Achat Total</th>
                  <th className="px-6 py-4 font-bold text-right">Votre Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4EAEB]">
                {data.recent_orders.map((order: any, i: number) => (
                  <tr key={i} className="hover:bg-[#FDFDFC] transition-colors">
                    <td className="px-6 py-4 text-[#2A2424]/60 font-medium">
                      {new Date(order.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-6 py-4 font-medium text-[#2A2424]">{order.customer_name}</td>
                    <td className="px-6 py-4 font-bold text-[#2A2424] text-right">{order.total.toLocaleString("fr-FR")} FCFA</td>
                    <td className="px-6 py-4 text-right font-bold text-[#C2164A]">
                      +{order.commission_earned.toLocaleString("fr-FR")} FCFA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
