"use client";

import { useState } from "react";
import { Plus, Trash, Pencil, Check, X, Loader2, Package, MapPin } from "lucide-react";
import { createShippingOptionAction, deleteShippingOptionAction, updateShippingOptionAction } from "./actions";

// Liste des principales villes du Cameroun
const CAMEROON_CITIES = [
  "Yaoundé",
  "Douala",
  "Bafoussam",
  "Bamenda",
  "Garoua",
  "Maroua",
  "Ngaoundéré",
  "Bertoua",
  "Ebolowa",
  "Kribi",
  "Limbe",
  "Buea",
  "Kumba",
  "Nkongsamba",
  "Edéa",
  "Mbalmayo",
  "Dschang",
  "Foumban",
  "Bafia",
  "Sangmélima",
  "Toutes les villes",
];

export function ShippingSettings({
  initialOptions,
}: {
  initialOptions: any[];
  token?: string;
}) {
  const [options, setOptions] = useState(initialOptions);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [isPickup, setIsPickup] = useState(false);
  const [city, setCity] = useState("Toutes les villes");

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");

  const buildName = () => {
    // Auto-generate name if empty
    if (name.trim()) return name.trim();
    if (isPickup) return `Retrait Magasin - ${city}`;
    return `Livraison à domicile - ${city}`;
  };

  const handleCreate = async () => {
    if (price === "") return;
    setIsLoading(true);
    try {
      const finalName = buildName();
      const data: any = await createShippingOptionAction(finalName, parseInt(price, 10), isPickup);
      
      setOptions([...options, data.shipping_option]);
      setIsAdding(false);
      setName("");
      setPrice("");
      setIsPickup(false);
      setCity("Toutes les villes");
    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce mode de livraison ?")) return;
    try {
      await deleteShippingOptionAction(id);
      setOptions(options.filter(o => o.id !== id));
    } catch (err: any) {
      alert("Erreur: " + err.message);
    }
  };

  const handleUpdate = async (id: string) => {
    if (editPrice === "") return;
    try {
      const data: any = await updateShippingOptionAction(id, parseInt(editPrice, 10));
      setOptions(options.map(o => o.id === id ? data.shipping_option : o));
      setEditingId(null);
    } catch (err: any) {
      alert("Erreur: " + err.message);
    }
  };

  const getPrice = (opt: any) => {
    const px = opt.prices?.[0];
    return px ? px.amount : 0;
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-[#2A2424]">Modes de livraison</h2>
          <p className="text-xs text-[#2A2424]/50 mt-1">Configurez les méthodes d'expédition pour le Cameroun</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#2A2424] text-white rounded-xl text-xs font-bold hover:bg-black transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </button>
      </div>

      {isAdding && (
        <div className="bg-[#F5F0EB]/50 rounded-xl border border-[#EDE0E0] p-4 mb-4 flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Ville */}
            <div>
              <label className="block text-[10px] font-bold text-[#2A2424]/60 uppercase mb-1">
                <MapPin className="w-3 h-3 inline mr-1" />Ville (Cameroun)
              </label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#EDE0E0] outline-none focus:border-[#C08A8E] bg-white"
              >
                {CAMEROON_CITIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-[10px] font-bold text-[#2A2424]/60 uppercase mb-1">Type</label>
              <select
                value={isPickup ? "pickup" : "delivery"}
                onChange={e => setIsPickup(e.target.value === "pickup")}
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#EDE0E0] outline-none focus:border-[#C08A8E] bg-white"
              >
                <option value="delivery">🚚 Livraison à Domicile</option>
                <option value="pickup">🏪 Retrait en Magasin</option>
              </select>
            </div>

            {/* Nom personnalisé (optionnel) */}
            <div>
              <label className="block text-[10px] font-bold text-[#2A2424]/60 uppercase mb-1">
                Nom personnalisé <span className="text-[#2A2424]/30 normal-case font-normal">(optionnel)</span>
              </label>
              <input
                type="text"
                placeholder={isPickup ? `Retrait Magasin - ${city}` : `Livraison à domicile - ${city}`}
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#EDE0E0] outline-none focus:border-[#C08A8E]"
              />
            </div>

            {/* Prix */}
            <div>
              <label className="block text-[10px] font-bold text-[#2A2424]/60 uppercase mb-1">Prix (FCFA)</label>
              <input
                type="number"
                placeholder="Ex: 1500"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#EDE0E0] outline-none focus:border-[#C08A8E]"
              />
            </div>
          </div>
          
          {/* Preview du nom */}
          <div className="text-[10px] text-[#2A2424]/40 bg-[#F5F0EB] px-3 py-2 rounded-lg">
            <span className="font-bold">Aperçu :</span> {buildName()} — {price || "0"} FCFA
          </div>

          <div className="flex justify-end gap-2 mt-1">
            <button onClick={() => { setIsAdding(false); setName(""); setPrice(""); setCity("Toutes les villes"); setIsPickup(false); }} className="px-3 py-1.5 text-xs font-bold text-[#2A2424]/60 hover:text-[#2A2424]">Annuler</button>
            <button onClick={handleCreate} disabled={isLoading || price === ""} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#C08A8E] text-white rounded-lg text-xs font-bold hover:bg-[#a67478] disabled:opacity-50">
              {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {options.length === 0 ? (
        <div className="py-8 text-center flex flex-col items-center justify-center">
          <Package className="w-8 h-8 text-[#2A2424]/20 mb-2" />
          <p className="text-sm text-[#2A2424]/50">Aucun mode de livraison configuré.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {options.map((opt) => (
            <div key={opt.id} className="flex items-center justify-between p-3 rounded-xl border border-[#EDE0E0] hover:border-[#C08A8E]/30 transition-colors">
              <div>
                <p className="text-sm font-bold text-[#2A2424]">{opt.name}</p>
                <p className="text-[10px] font-semibold text-[#2A2424]/40 uppercase mt-0.5 flex items-center gap-1">
                  {opt.type?.code?.includes("pickup") ? "🏪 Retrait Magasin" : "🚚 Livraison"}
                  <span className="text-[#2A2424]/20">• Cameroun 🇨🇲</span>
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                {editingId === opt.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editPrice}
                      onChange={e => setEditPrice(e.target.value)}
                      className="w-24 text-xs font-bold px-2 py-1 rounded-md border border-[#EDE0E0] text-center outline-none focus:border-[#C08A8E]"
                    />
                    <span className="text-xs text-[#2A2424]/40">FCFA</span>
                    <button onClick={() => handleUpdate(opt.id)} className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-bold text-[#2A2424] bg-[#F5F0EB] px-3 py-1 rounded-lg">
                      {getPrice(opt).toLocaleString()} FCFA
                    </p>
                    <div className="flex items-center gap-1 border-l border-[#EDE0E0] pl-4">
                      <button 
                        onClick={() => {
                          setEditingId(opt.id);
                          setEditPrice(getPrice(opt).toString());
                        }}
                        className="p-1.5 text-[#2A2424]/40 hover:text-[#2A2424] hover:bg-[#F5F0EB] rounded-md transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(opt.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
