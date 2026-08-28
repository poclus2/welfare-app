"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity } from "lucide-react";

export function DeliveryAnalytics({ token }: { token: string }) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("https://api.thewelfare.store/admin/orders?limit=100", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const json = await res.json();
        const orders = json.orders || [];
        
        // Aggregate by city
        const cityCounts: Record<string, number> = {};
        
        orders.forEach((order: any) => {
          const city = order.shipping_address?.city || "Inconnu";
          cityCounts[city] = (cityCounts[city] || 0) + 1;
        });

        const chartData = Object.keys(cityCounts)
          .map(city => ({ name: city, commandes: cityCounts[city] }))
          .sort((a, b) => b.commandes - a.commandes)
          .slice(0, 10); // Top 10

        setData(chartData);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrders();
  }, [token]);

  if (isLoading) return <div className="p-8">Chargement des analytiques...</div>;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5" /> 
        Top 10 des Villes de Livraison
      </h2>
      
      {data.length > 0 ? (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip cursor={{ fill: '#f3f4f6' }} />
              <Bar dataKey="commandes" fill="#000000" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-gray-500 italic">Pas assez de données de commandes pour générer le graphique.</p>
      )}
    </div>
  );
}
