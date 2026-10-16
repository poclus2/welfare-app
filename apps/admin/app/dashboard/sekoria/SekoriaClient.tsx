"use client";

import { useEffect, useState } from "react";
import { BellRing, Download } from "lucide-react";

type Subscriber = {
  id: string;
  first_name: string | null;
  phone: string | null;
  email: string | null;
  consent_text: string;
  consented_at: string;
  source: string | null;
};

const fmt = (d: string) =>
  new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

// People who asked to be told when Sekoria launches (home page form), with the consent they gave
export function SekoriaClient() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/launch-subscribers?campaign=sekoria", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Erreur de chargement");
        setSubscribers(data.launch_subscribers || []);
      })
      .catch((e) => setError(e.message || "Impossible de charger la liste."))
      .finally(() => setLoading(false));
  }, []);

  const exportCsv = () => {
    const cell = (v: string | null) => `"${(v || "").replace(/"/g, '""')}"`;
    const rows = [
      ["Prénom", "WhatsApp", "Email", "Inscrit le", "Consentement"].map(cell).join(";"),
      ...subscribers.map((s) => [s.first_name, s.phone, s.email, fmt(s.consented_at), s.consent_text].map(cell).join(";")),
    ];
    // BOM so Excel opens the accents correctly
    const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sekoria-inscrits-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="p-5 lg:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-[#2A2424]">
            <BellRing className="w-6 h-6" />
            Lancement Sekoria
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {subscribers.length} personne{subscribers.length > 1 ? "s" : ""} inscrite{subscribers.length > 1 ? "s" : ""} pour être
            informée{subscribers.length > 1 ? "s" : ""} du lancement, depuis la page d&apos;accueil.
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={subscribers.length === 0}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-40 self-start"
        >
          <Download className="w-4 h-4" />
          Exporter (CSV)
        </button>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Chargement...</div>
        ) : subscribers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Personne ne s&apos;est encore inscrit.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500">
                <th className="p-4">Prénom</th>
                <th className="p-4">WhatsApp</th>
                <th className="p-4">Email</th>
                <th className="p-4">Inscrit le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {subscribers.map((s) => (
                <tr key={s.id} className="text-sm">
                  <td className="p-4 font-medium text-gray-900">{s.first_name || "—"}</td>
                  <td className="p-4">
                    {s.phone ? (
                      <a href={`https://wa.me/${s.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:underline">
                        {s.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-4 text-gray-500">{s.email || "—"}</td>
                  <td className="p-4 text-gray-500 whitespace-nowrap" title={s.consent_text}>
                    {fmt(s.consented_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
