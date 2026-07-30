"use client";

import { useState } from "react";
import { Plus, Trash, Pencil, Check, X, Loader2, Package } from "lucide-react";

export function ShippingSettings({
  initialOptions,
  token
}: {
  initialOptions: any[];
  token: string;
}) {
  const [options, setOptions] = useState(initialOptions);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [isPickup, setIsPickup] = useState(false);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");

  const refreshOptions = async () => {
    try {
      const res = await fetch("/api/admin/shipping-options", {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Actually, standard admin API is on backend URL. We need to fetch from MEDUSA_BACKEND_URL
      // The prop initialOptions is passed from server. To refresh, we can just trigger a router.refresh() 
      // or we just update the local state which is faster.
    } catch (err) {}
  };

  const handleCreate = async () => {
    if (!name.trim() || price === "") return;
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://api.thewelfare.store"}/admin/welfare-shipping`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          price: parseInt(price, 10),
          isPickup
        })
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      
      setOptions([...options, data.shipping_option]);
      setIsAdding(false);
      setName("");
      setPrice("");
      setIsPickup(false);
    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce mode de livraison ?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://api.thewelfare.store"}/admin/welfare-shipping/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(await res.text());
      setOptions(options.filter(o => o.id !== id));
    } catch (err: any) {
      alert("Erreur: " + err.message);
    }
  };

  const handleUpdate = async (id: string) => {
    if (editPrice === "") return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://api.thewelfare.store"}/admin/welfare-shipping/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ price: parseInt(editPrice, 10) })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
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
          <p className="text-xs text-[#2A2424]/50 mt-1">Configurez les méthodes d'expédition pour vos clients</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-[#2A2424]/60 uppercase mb-1">Nom</label>
              <input
                type="text"
                placeholder="Ex: Retrait Magasin"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#EDE0E0] outline-none focus:border-[#C08A8E]"
              />
            </div>
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
            <div>
              <label className="block text-[10px] font-bold text-[#2A2424]/60 uppercase mb-1">Type</label>
              <select
                value={isPickup ? "pickup" : "delivery"}
                onChange={e => setIsPickup(e.target.value === "pickup")}
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#EDE0E0] outline-none focus:border-[#C08A8E] bg-white"
              >
                <option value="delivery">Livraison à Domicile</option>
                <option value="pickup">Retrait en Magasin</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-xs font-bold text-[#2A2424]/60 hover:text-[#2A2424]">Annuler</button>
            <button onClick={handleCreate} disabled={isLoading} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#C08A8E] text-white rounded-lg text-xs font-bold hover:bg-[#a67478]">
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
                <p className="text-[10px] font-semibold text-[#2A2424]/40 uppercase mt-0.5">
                  {opt.type?.code?.includes("pickup") ? "Retrait Magasin" : "Livraison"}
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
                      {getPrice(opt)} FCFA
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
