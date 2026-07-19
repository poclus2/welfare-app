import { Sparkles, QrCode, Copy } from "lucide-react";

export function DashboardInfluenceur() {
  return (
    <div className="w-full max-w-[1200px] mx-auto py-12 px-6">
      <div className="flex items-center gap-3 mb-2">
        <Sparkles className="w-6 h-6 text-[#E5B6B9]" />
        <h1 className="text-3xl font-bold text-[#2A2424]">Mon Tableau de bord</h1>
      </div>
      <p className="text-[#2A2424]/60 mb-10 text-lg">Bienvenue dans votre espace influenceur exclusif.</p>
      
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl border border-[#F4EAEB] shadow-sm flex flex-col justify-between h-32">
          <p className="text-sm text-[#2A2424]/60 font-medium">Ventes générées</p>
          <p className="text-3xl font-bold text-[#2A2424]">1 245 €</p>
        </div>
        <div className="bg-[#2A2424] p-6 rounded-3xl shadow-md flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#E5B6B9]/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <p className="text-sm text-white/60 font-medium relative z-10">Commissions disponibles</p>
          <p className="text-3xl font-bold text-white relative z-10">124.50 €</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-[#F4EAEB] shadow-sm flex flex-col justify-between h-32">
          <p className="text-sm text-[#2A2424]/60 font-medium">Clics sur votre lien</p>
          <p className="text-3xl font-bold text-[#2A2424]">342</p>
        </div>
      </div>
      
      {/* Outils de partage */}
      <h2 className="text-xl font-bold text-[#2A2424] mb-6">Outils de partage</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Lien affilié */}
        <div className="bg-[#F8F5F2] p-8 rounded-3xl border border-[#F4EAEB] flex flex-col h-full">
          <h3 className="text-lg font-bold text-[#2A2424] mb-2">Votre lien affilié</h3>
          <p className="text-sm text-[#2A2424]/60 mb-6">Partagez ce lien sur vos réseaux (Linktree, Bio Insta...).</p>
          
          <div className="flex items-center gap-2 mt-auto">
            <input 
              type="text" 
              readOnly 
              value="https://thewelfare.shop/ref/kbeauty-fan"
              className="flex-1 bg-white border border-[#F4EAEB] rounded-xl px-4 py-3 text-sm text-[#2A2424] outline-none"
            />
            <button className="bg-[#2A2424] text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-black transition-colors flex items-center gap-2">
              <Copy className="w-4 h-4" /> Copier
            </button>
          </div>
        </div>
        
        {/* QR Code */}
        <div className="bg-[#F8F5F2] p-8 rounded-3xl border border-[#F4EAEB] flex flex-col h-full">
          <h3 className="text-lg font-bold text-[#2A2424] mb-2">Votre QR Code</h3>
          <p className="text-sm text-[#2A2424]/60 mb-6">Idéal pour les événements ou l'impression.</p>
          
          <div className="mt-auto flex items-center justify-center bg-white border border-[#F4EAEB] rounded-2xl p-6 w-fit mx-auto shadow-sm">
            <QrCode className="w-24 h-24 text-[#2A2424]" strokeWidth={1} />
          </div>
        </div>
        
      </div>
    </div>
  );
}
