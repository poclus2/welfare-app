
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, MapPin, Plus, PencilSimple, Trash, CheckCircle, WarningCircle, X } from "@phosphor-icons/react";
import { sdk } from "@/lib/medusa";

export default function ProfileTab({ customer, onUpdate }: { customer: any, onUpdate: () => void }) {
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [formData, setFormData] = useState({
    first_name: customer?.first_name || "",
    last_name: customer?.last_name || "",
    phone: customer?.phone || "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  // Address State
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    first_name: "",
    last_name: "",
    address_1: "",
    address_2: "",
    city: "",
    postal_code: "",
    country_code: "FR",
    phone: "",
  });

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await sdk.store.customer.update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
      });
      setMessage({ type: "success", text: "Informations mises à jour." });
      setIsEditingInfo(false);
      onUpdate();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Une erreur est survenue." });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (editingAddressId) {
        await sdk.store.customer.updateAddress(editingAddressId, addressForm);
        setMessage({ type: "success", text: "Adresse modifiée." });
      } else {
        await sdk.store.customer.createAddress(addressForm);
        setMessage({ type: "success", text: "Nouvelle adresse ajoutée." });
      }
      setIsAddingAddress(false);
      setEditingAddressId(null);
      onUpdate();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Erreur." });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Voulez-vous supprimer cette adresse ?")) return;
    setLoading(true);
    try {
      await sdk.store.customer.deleteAddress(id);
      setMessage({ type: "success", text: "Adresse supprimée." });
      onUpdate();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Erreur lors de la suppression." });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const openEditAddress = (addr: any) => {
    setAddressForm({
      first_name: addr.first_name || "",
      last_name: addr.last_name || "",
      address_1: addr.address_1 || "",
      address_2: addr.address_2 || "",
      city: addr.city || "",
      postal_code: addr.postal_code || "",
      country_code: addr.country_code || "FR",
      phone: addr.phone || "",
    });
    setEditingAddressId(addr.id);
    setIsAddingAddress(true);
  };

  const InputField = ({ label, type = "text", value, onChange, required = false, disabled = false }: any) => (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="w-full bg-white/50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#2A2424] focus:outline-none focus:ring-2 focus:ring-[#C97C85]/30 focus:border-[#C97C85] transition-all disabled:opacity-50 shadow-sm"
      />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
              message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.type === "success" ? <CheckCircle weight="fill" className="w-5 h-5" /> : <WarningCircle weight="fill" className="w-5 h-5" />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* --- PERSONAL INFO --- */}
        <div className="bg-white/60 backdrop-blur-2xl rounded-[2rem] p-8 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-b from-white to-gray-50/50 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_4px_8px_rgba(201,124,133,0.15)] border border-gray-100">
                <User weight="fill" className="w-5 h-5 text-[#C97C85]" />
              </div>
              <h3 className="text-xl font-semibold text-[#2A2424]">Mes Informations</h3>
            </div>
            {!isEditingInfo && (
              <button 
                onClick={() => setIsEditingInfo(true)}
                className="text-sm font-medium text-gray-500 hover:text-[#C97C85] transition-colors flex items-center gap-1.5"
              >
                <PencilSimple weight="bold" /> Modifier
              </button>
            )}
          </div>

          {!isEditingInfo ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Prénom</p>
                  <p className="text-sm font-medium text-[#2A2424]">{customer?.first_name || "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nom</p>
                  <p className="text-sm font-medium text-[#2A2424]">{customer?.last_name || "-"}</p>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email</p>
                <p className="text-sm font-medium text-[#2A2424]">{customer?.email}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Téléphone</p>
                <p className="text-sm font-medium text-[#2A2424]">{customer?.phone || "Non renseigné"}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateInfo} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Prénom" value={formData.first_name} onChange={(e: any) => setFormData({...formData, first_name: e.target.value})} required />
                <InputField label="Nom" value={formData.last_name} onChange={(e: any) => setFormData({...formData, last_name: e.target.value})} required />
              </div>
              <InputField label="Email (Lecture seule)" value={customer?.email} disabled />
              <InputField label="Téléphone" type="tel" value={formData.phone} onChange={(e: any) => setFormData({...formData, phone: e.target.value})} />
              
              <div className="pt-4 flex items-center gap-3">
                <button type="submit" disabled={loading} className="px-6 py-2.5 bg-[#C97C85] text-white text-sm font-semibold rounded-xl hover:bg-[#b0656e] transition-all shadow-[0_4px_14px_0_rgba(201,124,133,0.39)] hover:shadow-[0_6px_20px_rgba(201,124,133,0.23)] hover:-translate-y-[1px] disabled:opacity-70">
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </button>
                <button type="button" onClick={() => setIsEditingInfo(false)} className="px-6 py-2.5 text-gray-500 text-sm font-medium hover:text-[#2A2424] transition-colors">
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>

        {/* --- ADDRESSES --- */}
        <div className="bg-white/60 backdrop-blur-2xl rounded-[2rem] p-8 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-b from-white to-gray-50/50 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_4px_8px_rgba(139,92,246,0.15)] border border-gray-100">
                <MapPin weight="fill" className="w-5 h-5 text-[#8B5CF6]" />
              </div>
              <h3 className="text-xl font-semibold text-[#2A2424]">Carnet d'adresses</h3>
            </div>
            {!isAddingAddress && (
              <button 
                onClick={() => {
                  setAddressForm({ first_name: "", last_name: "", address_1: "", address_2: "", city: "", postal_code: "", country_code: "FR", phone: "" });
                  setEditingAddressId(null);
                  setIsAddingAddress(true);
                }}
                className="text-sm font-medium text-[#8B5CF6] hover:text-[#7c3aed] transition-colors flex items-center gap-1.5"
              >
                <Plus weight="bold" /> Ajouter
              </button>
            )}
          </div>

          {isAddingAddress ? (
            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                <h4 className="font-semibold text-[#2A2424]">{editingAddressId ? "Modifier l'adresse" : "Nouvelle adresse"}</h4>
                <button type="button" onClick={() => setIsAddingAddress(false)} className="text-gray-400 hover:text-[#2A2424] transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Prénom" value={addressForm.first_name} onChange={(e: any) => setAddressForm({...addressForm, first_name: e.target.value})} required />
                <InputField label="Nom" value={addressForm.last_name} onChange={(e: any) => setAddressForm({...addressForm, last_name: e.target.value})} required />
              </div>
              
              <InputField label="Adresse" value={addressForm.address_1} onChange={(e: any) => setAddressForm({...addressForm, address_1: e.target.value})} required />
              <InputField label="Complément (Optionnel)" value={addressForm.address_2} onChange={(e: any) => setAddressForm({...addressForm, address_2: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Code Postal" value={addressForm.postal_code} onChange={(e: any) => setAddressForm({...addressForm, postal_code: e.target.value})} required />
                <InputField label="Ville" value={addressForm.city} onChange={(e: any) => setAddressForm({...addressForm, city: e.target.value})} required />
              </div>
              
              <InputField label="Téléphone (Optionnel)" value={addressForm.phone} onChange={(e: any) => setAddressForm({...addressForm, phone: e.target.value})} />

              <div className="pt-4 flex items-center gap-3">
                <button type="submit" disabled={loading} className="px-6 py-2.5 bg-[#8B5CF6] text-white text-sm font-semibold rounded-xl hover:bg-[#7c3aed] transition-all shadow-[0_4px_14px_0_rgba(139,92,246,0.39)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.23)] hover:-translate-y-[1px] disabled:opacity-70">
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {customer?.addresses?.length > 0 ? (
                customer.addresses.map((addr: any) => (
                  <div key={addr.id} className="group relative p-5 rounded-2xl border border-white bg-white/40 hover:bg-white hover:border-gray-100 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-[1px] transition-all">
                    <p className="font-semibold text-[#2A2424] mb-1">{addr.first_name} {addr.last_name}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {addr.address_1} {addr.address_2 ? `, ${addr.address_2}` : ""}<br />
                      {addr.postal_code} {addr.city}, {addr.country_code.toUpperCase()}<br />
                      {addr.phone && <span className="text-gray-400 mt-1 block">{addr.phone}</span>}
                    </p>
                    
                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditAddress(addr)} className="p-1.5 text-gray-400 hover:text-[#8B5CF6] hover:bg-purple-50 rounded-lg transition-colors" title="Modifier"><PencilSimple className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteAddress(addr.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer"><Trash className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-white/40 rounded-2xl border border-white border-dashed">
                  <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 font-medium">Aucune adresse enregistrée.</p>
                </div>
              )}
            </div>
          )}
        </div>
        
      </div>
    </motion.div>
  );
}
