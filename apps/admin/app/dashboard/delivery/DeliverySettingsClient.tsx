"use client";

import { useEffect, useState } from "react";
import { Truck, Plus, Trash2, Save, MapPin, Store, Scale, Clock, Activity, Power, PowerOff } from "lucide-react";
import { DeliveryAnalytics } from "../../../components/DeliveryAnalytics"; // We will create this

export function DeliverySettingsClient({ token }: { token: string }) {
  const [activeTab, setActiveTab] = useState("cities");
  const [cities, setCities] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ free_shipping_threshold: 0, cod_fee: 0 });
  const [pickupPoints, setPickupPoints] = useState<any[]>([]);
  const [weightRules, setWeightRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDeliveryData = async () => {
    try {
      const headers = { "Authorization": `Bearer ${token}` };
      const [citiesRes, settingsRes, pointsRes, rulesRes] = await Promise.all([
        fetch("https://api.thewelfare.store/admin/delivery/cities", { headers }),
        fetch("https://api.thewelfare.store/admin/delivery/settings", { headers }),
        fetch("https://api.thewelfare.store/admin/delivery/pickup-points", { headers }),
        fetch("https://api.thewelfare.store/admin/delivery/weight-rules", { headers })
      ]);
      const citiesData = await citiesRes.json();
      const settingsData = await settingsRes.json();
      const pointsData = await pointsRes.json().catch(() => ({ points: [] }));
      const rulesData = await rulesRes.json().catch(() => ({ rules: [] }));
      
      setCities(citiesData.cities || []);
      setSettings(settingsData.setting || { free_shipping_threshold: 0, cod_fee: 0 });
      setPickupPoints(pointsData.points || []);
      setWeightRules(rulesData.rules || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryData();
  }, [token]);

  const apiCall = async (path: string, method: string, body?: any) => {
    const res = await fetch(`https://api.thewelfare.store/admin/delivery/${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) throw new Error("API Error");
    return res.json();
  };

  const handleUpdateSetting = async () => {
    try {
      await apiCall("settings", "POST", { 
        free_shipping_threshold: Number(settings.free_shipping_threshold),
        cod_fee: Number(settings.cod_fee)
      });
      alert("Param�tres mis � jour");
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCity = async (id: string, data: any) => {
    try {
      await apiCall(`cities/${id}`, "POST", data);
      fetchDeliveryData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateNeighborhood = async (id: string, data: any) => {
    try {
      await apiCall(`neighborhoods/${id}`, "POST", data);
      fetchDeliveryData();
    } catch (err) {
      console.error(err);
    }
  };

  // Pickup Points
  const handleAddPickupPoint = async () => {
    try {
      await apiCall("pickup-points", "POST", { name: "Nouveau Point", city: "Douala", address: "" });
      fetchDeliveryData();
    } catch (e) { console.error(e) }
  };
  const handleUpdatePickupPoint = async (id: string, data: any) => {
    try {
      await apiCall(`pickup-points/${id}`, "POST", data);
      fetchDeliveryData();
    } catch (e) { console.error(e) }
  };
  const handleDeletePickupPoint = async (id: string) => {
    if(!confirm("Supprimer ?")) return;
    try {
      await apiCall(`pickup-points/${id}`, "DELETE");
      fetchDeliveryData();
    } catch (e) { console.error(e) }
  };

  // Weight Rules
  const handleAddWeightRule = async () => {
    try {
      await apiCall("weight-rules", "POST", { min_weight: 1000, additional_fee: 1000 });
      fetchDeliveryData();
    } catch (e) { console.error(e) }
  };
  const handleUpdateWeightRule = async (id: string, data: any) => {
    try {
      await apiCall(`weight-rules/${id}`, "POST", data);
      fetchDeliveryData();
    } catch (e) { console.error(e) }
  };
  const handleDeleteWeightRule = async (id: string) => {
    if(!confirm("Supprimer ?")) return;
    try {
      await apiCall(`weight-rules/${id}`, "DELETE");
      fetchDeliveryData();
    } catch (e) { console.error(e) }
  };

  if (isLoading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Truck className="w-6 h-6" />
          Param�tres de Livraison Avanc�s
        </h1>
        <p className="text-gray-500 mt-2">G�rez vos villes, quartiers, points relais, r�gles de poids et analysez vos livraisons.</p>
      </div>

      <div className="flex border-b mb-8 overflow-x-auto">
        <button onClick={() => setActiveTab("cities")} className={`px-4 py-2 font-medium ${activeTab === "cities" ? "border-b-2 border-black text-black" : "text-gray-500"}`}>Villes & Quartiers</button>
        <button onClick={() => setActiveTab("settings")} className={`px-4 py-2 font-medium ${activeTab === "settings" ? "border-b-2 border-black text-black" : "text-gray-500"}`}>G�n�ral & COD</button>
        <button onClick={() => setActiveTab("pickup")} className={`px-4 py-2 font-medium ${activeTab === "pickup" ? "border-b-2 border-black text-black" : "text-gray-500"}`}>Points de Retrait</button>
        <button onClick={() => setActiveTab("weight")} className={`px-4 py-2 font-medium ${activeTab === "weight" ? "border-b-2 border-black text-black" : "text-gray-500"}`}>R�gles de Poids</button>
        <button onClick={() => setActiveTab("analytics")} className={`px-4 py-2 font-medium ${activeTab === "analytics" ? "border-b-2 border-black text-black" : "text-gray-500"}`}>Analytique</button>
      </div>

      {activeTab === "settings" && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-8 space-y-6">
          <h2 className="text-lg font-bold">Param�tres GÃ©nÃ©raux</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Seuil de Livraison Gratuite (FCFA)</label>
              <input 
                type="number" 
                className="w-full px-4 py-2 border rounded-lg"
                value={settings.free_shipping_threshold}
                onChange={(e) => setSettings({ ...settings, free_shipping_threshold: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Frais de Paiement Ã  la Livraison (COD - FCFA)</label>
              <input 
                type="number" 
                className="w-full px-4 py-2 border rounded-lg"
                value={settings.cod_fee}
                onChange={(e) => setSettings({ ...settings, cod_fee: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-1">Surcharge appliqu�er Ã  la livraison.</p>
            </div>
          </div>
          <button 
            onClick={handleUpdateSetting}
            className="px-4 py-2 bg-black text-white rounded-lg flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Enregistrer les paramÃ¨tres
          </button>
        </div>
      )}

      {activeTab === "cities" && (
        <div className="space-y-6">
          {cities.map(city => (
            <div key={city.id} className={`bg-white p-6 rounded-xl border shadow-sm ${!city.is_active ? 'opacity-70 bg-gray-50 border-gray-200' : 'border-gray-100'}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleUpdateCity(city.id, { is_active: !city.is_active })}
                    className={`p-2 rounded-full ${city.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}
                    title={city.is_active ? "D�sactiver la ville" : "Activer la ville"}
                  >
                    {city.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                  </button>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    {city.name}
                  </h3>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="ETA (ex: 24h)"
                      className="w-32 px-3 py-1 border rounded text-sm"
                      defaultValue={city.estimated_time || ""}
                      onBlur={(e) => handleUpdateCity(city.id, { estimated_time: e.target.value })}
                    />
                  </div>
                  {!city.has_neighborhoods && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Tarif fixe :</span>
                      <input 
                        type="number" 
                        className="w-24 px-3 py-1 border rounded"
                        defaultValue={city.fixed_price || 0}
                        onBlur={(e) => handleUpdateCity(city.id, { fixed_price: Number(e.target.value) })}
                      />
                      <span className="text-sm">FCFA</span>
                    </div>
                  )}
                </div>
              </div>

              {city.has_neighborhoods && (
                <div className="pl-7 md:pl-12">
                  <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">Quartiers</h4>
                  <div className="space-y-2">
                    {city.neighborhoods?.map((hood: any) => (
                      <div key={hood.id} className={`flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg border ${!hood.is_active ? 'bg-gray-100 border-gray-200 text-gray-500' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center gap-3 mb-2 md:mb-0">
                          <button 
                            onClick={() => handleUpdateNeighborhood(hood.id, { is_active: !hood.is_active })}
                            className={`p-1.5 rounded-full ${hood.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}
                          >
                            <Power className="w-3 h-3" />
                          </button>
                          <span className="font-medium">{hood.name}</span>
                        </div>
                        <div className="flex items-center gap-4 pl-8 md:pl-0">
                          <input 
                            type="text" 
                            placeholder="ETA (ex: 48h)"
                            className="w-24 px-2 py-1 border rounded text-sm"
                            defaultValue={hood.estimated_time || ""}
                            onBlur={(e) => handleUpdateNeighborhood(hood.id, { estimated_time: e.target.value })}
                          />
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              className="w-24 px-3 py-1 border rounded text-right"
                              defaultValue={hood.price}
                              onBlur={(e) => handleUpdateNeighborhood(hood.id, { price: Number(e.target.value) })}
                            />
                            <span className="text-sm text-gray-500">FCFA</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!city.neighborhoods || city.neighborhoods.length === 0) && (
                      <p className="text-sm text-gray-400 italic">Aucun quartier configurÃ©.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "pickup" && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2"><Store className="w-5 h-5"/> Boutiques & Points de Retrait</h2>
            <button onClick={handleAddPickupPoint} className="flex items-center gap-1 text-sm bg-black text-white px-3 py-1.5 rounded-lg">
              <Plus className="w-4 h-4"/> Ajouter
            </button>
          </div>
          <div className="space-y-4">
            {pickupPoints.map(point => (
              <div key={point.id} className="p-4 border rounded-lg flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 w-full max-w-sm">
                    <button 
                      onClick={() => handleUpdatePickupPoint(point.id, { is_active: !point.is_active })}
                      className={`p-1.5 rounded-full ${point.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}
                    >
                      <Power className="w-3 h-3" />
                    </button>
                    <input className="font-bold border-b focus:border-black outline-none px-1 w-full" defaultValue={point.name} onBlur={e => handleUpdatePickupPoint(point.id, { name: e.target.value })} placeholder="Nom de la boutique" />
                  </div>
                  <button onClick={() => handleDeletePickupPoint(point.id)} className="text-red-500 p-2"><Trash2 className="w-4 h-4"/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input className="text-sm border rounded px-3 py-2" defaultValue={point.city} onBlur={e => handleUpdatePickupPoint(point.id, { city: e.target.value })} placeholder="Ville" />
                  <input className="text-sm border rounded px-3 py-2 md:col-span-2" defaultValue={point.address} onBlur={e => handleUpdatePickupPoint(point.id, { address: e.target.value })} placeholder="Adresse compl�te" />
                  <input className="text-sm border rounded px-3 py-2" defaultValue={point.phone} onBlur={e => handleUpdatePickupPoint(point.id, { phone: e.target.value })} placeholder="T�l�phone" />
                  <input className="text-sm border rounded px-3 py-2" defaultValue={point.opening_hours} onBlur={e => handleUpdatePickupPoint(point.id, { opening_hours: e.target.value })} placeholder="Horaires (ex: 8h - 18h)" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Tarif :</span>
                    <input type="number" className="text-sm border rounded px-3 py-2 w-24" defaultValue={point.price} onBlur={e => handleUpdatePickupPoint(point.id, { price: Number(e.target.value) })} />
                    <span className="text-sm">FCFA</span>
                  </div>
                </div>
              </div>
            ))}
            {pickupPoints.length === 0 && <p className="text-gray-500 italic">Aucun point de retrait configurÃ©.</p>}
          </div>
        </div>
      )}

      {activeTab === "weight" && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2"><Scale className="w-5 h-5"/> R�gles de Poids (Surcharges)</h2>
            <button onClick={handleAddWeightRule} className="flex items-center gap-1 text-sm bg-black text-white px-3 py-1.5 rounded-lg">
              <Plus className="w-4 h-4"/> Ajouter
            </button>
          </div>
          <div className="space-y-4">
            {weightRules.map(rule => (
              <div key={rule.id} className="flex flex-wrap items-center gap-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm">De</span>
                  <input type="number" className="w-24 border rounded px-2 py-1" defaultValue={rule.min_weight} onBlur={e => handleUpdateWeightRule(rule.id, { min_weight: Number(e.target.value) })} />
                  <span className="text-sm">g</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Ã </span>
                  <input type="number" className="w-24 border rounded px-2 py-1" placeholder="Infini" defaultValue={rule.max_weight || ""} onBlur={e => handleUpdateWeightRule(rule.id, { max_weight: e.target.value ? Number(e.target.value) : null })} />
                  <span className="text-sm">g</span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm">Surcharge : +</span>
                  <input type="number" className="w-24 border rounded px-2 py-1" defaultValue={rule.additional_fee} onBlur={e => handleUpdateWeightRule(rule.id, { additional_fee: Number(e.target.value) })} />
                  <span className="text-sm">FCFA</span>
                  <button onClick={() => handleDeleteWeightRule(rule.id)} className="text-red-500 p-2 ml-2"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
            ))}
            {weightRules.length === 0 && <p className="text-gray-500 italic">Aucune rÃ¨gle de poids configurÃ©e.</p>}
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <DeliveryAnalytics token={token} />
      )}
    </div>
  );
}
