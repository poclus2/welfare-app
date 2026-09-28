"use client";

import { useEffect, useState } from "react";
import { Layers, Plus, Trash2, Search, Edit3, Power, PowerOff, X, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function CollectionsClient({ token }: { token: string }) {
  const [collections, setCollections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<any>(null);
  
  const [title, setTitle] = useState("");
  const [handle, setHandle] = useState("");

  const fetchCollections = async () => {
    try {
      const res = await fetch(`https://api.thewelfarecm.com/admin/collections?limit=100`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setCollections(data.collections || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [token]);

  const apiCall = async (path: string, method: string, body?: any) => {
    const res = await fetch(`https://api.thewelfarecm.com/admin/collections${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
    }
    return res.json();
  };

  const handleOpenNew = () => {
    setEditingCollection(null);
    setTitle("");
    setHandle("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (col: any) => {
    setEditingCollection(col);
    setTitle(col.title || "");
    setHandle(col.handle || "");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      if (editingCollection) {
        await apiCall(`/${editingCollection.id}`, "POST", { title, handle });
      } else {
        await apiCall("", "POST", { title, handle });
      }
      setIsModalOpen(false);
      await fetchCollections();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la sauvegarde.");
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette marque/collection ?")) return;
    try {
      setIsLoading(true);
      await apiCall(`/${id}`, "DELETE");
      await fetchCollections();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la suppression.");
      setIsLoading(false);
    }
  };

  const filteredCollections = collections.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) || 
    (c.handle && c.handle.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="w-6 h-6" />
            Marques & Collections
          </h1>
          <p className="text-gray-500 mt-2">Gérez vos collections de produits (Marques, Catégories phares, etc.).</p>
        </div>
        <button onClick={handleOpenNew} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
          <Plus className="w-4 h-4" />
          Ajouter une marque
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50 rounded-t-2xl">
          <Search className="w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Rechercher une marque..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none flex-1 text-sm placeholder:text-gray-400"
          />
        </div>

        {isLoading && collections.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Chargement...</div>
        ) : filteredCollections.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">Aucune collection trouvée.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 bg-white">
                  <th className="p-4">Titre (Marque)</th>
                  <th className="p-4">Handle (URL)</th>
                  <th className="p-4">Produits</th>
                  <th className="p-4">Créé le</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCollections.map(col => (
                  <tr key={col.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium text-sm text-gray-900">{col.title}</td>
                    <td className="p-4 text-sm text-gray-500">{col.handle}</td>
                    <td className="p-4 text-sm text-gray-500">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {col.products?.length || 0}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {new Date(col.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenEdit(col)} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(col.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 className="font-bold text-lg">{editingCollection ? "Modifier la marque" : "Nouvelle marque"}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Titre de la marque *</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ex: L'Oréal Paris"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Handle (Optionnel)</label>
                  <input 
                    type="text" 
                    value={handle} 
                    onChange={e => setHandle(e.target.value)}
                    placeholder="ex: loreal-paris"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">S'il est vide, il sera généré automatiquement.</p>
                </div>
              </div>
              <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black">
                  Annuler
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={!title || isLoading}
                  className="px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
