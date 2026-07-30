import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";
import { ShippingSettings } from "./ShippingSettings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) return null;

  let shippingOptions = [];
  try {
    const data = await fetchAdmin<{ shipping_options: any[] }>("/welfare-shipping", token);
    shippingOptions = data.shipping_options || [];
  } catch (err) {
    console.error("Error fetching shipping options:", err);
  }

  return (
    <div className="p-5 lg:p-8 space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-[#2A2424]" style={{ letterSpacing: "-0.02em" }}>Paramètres</h1>
        <p className="text-sm text-[#2A2424]/40 mt-0.5">Configuration de la plateforme</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Settings */}
          <ShippingSettings initialOptions={shippingOptions} token={token} />
          
          <div className="bg-white rounded-2xl border border-[#EDE0E0] p-12 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[#F5F0EB] flex items-center justify-center mb-4 text-3xl">⚙️</div>
            <h2 className="text-base font-bold text-[#2A2424] mb-1">Autres Paramètres</h2>
            <p className="text-sm text-[#2A2424]/40 max-w-xs">Le paramétrage des devises et des taxes sera bientôt disponible.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#2A2424] to-[#1A1616] text-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold mb-2">Informations Boutique</h3>
            <p className="text-sm text-white/60 mb-4">The Welfare Store</p>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Devise par défaut</span>
                <span className="font-bold">FCFA (XOF)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Pays de livraison</span>
                <span className="font-bold">Sénégal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
