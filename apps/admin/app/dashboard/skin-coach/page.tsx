import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";
import { SkinCoachSettings } from "./SkinCoachSettings";

export const dynamic = "force-dynamic";

type AIConfig = {
  mode: "top_stock" | "manual_selection";
  min_stock_threshold: number;
  max_routine_steps: number;
  manual_product_ids: string[];
  enforce_stock_filter: boolean;
};

const DEFAULT_CONFIG: AIConfig = {
  mode: "top_stock",
  min_stock_threshold: 1,
  max_routine_steps: 5,
  manual_product_ids: [],
  enforce_stock_filter: true,
};

export default async function SkinCoachPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;

  let config: AIConfig = DEFAULT_CONFIG;
  try {
    const data = await fetchAdmin<{ config: AIConfig }>("/ai-config", token);
    config = { ...DEFAULT_CONFIG, ...data.config };
  } catch (err) {
    console.error("[SkinCoachPage] Error fetching AI config:", err);
  }

  return (
    <div className="p-5 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold text-[#2A2424]"
            style={{ letterSpacing: "-0.02em" }}
          >
            Skin Coach IA
          </h1>
          <p className="text-sm text-[#2A2424]/40 mt-0.5">
            Paramétrez la stratégie de recommandation produit de votre IA
          </p>
        </div>
        {/* Status badge */}
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-green-700">
            Mode actif :{" "}
            {config.mode === "top_stock" ? "Top Stock" : "Sélection manuelle"}
          </span>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-gradient-to-r from-[#F5F0EB] to-[#F4EAEB] border border-[#EDE0E0] rounded-2xl p-5 flex gap-4">
        <span className="text-3xl shrink-0">🤖</span>
        <div>
          <p className="text-sm font-bold text-[#2A2424] mb-1">
            Comment fonctionne le Skin Coach IA ?
          </p>
          <p className="text-xs text-[#2A2424]/60 leading-relaxed">
            À chaque Skin Scan, notre IA analyse la peau de la cliente en 2 étapes : un diagnostic visuel par QWEN VL,
            puis une prescription de routine K-Beauty par Claude. Ici, vous contrôlez <strong>quels produits</strong> Claude
            peut recommander — selon votre stock ou votre propre sélection éditoriale.
          </p>
        </div>
      </div>

      {/* Main settings */}
      <SkinCoachSettings initialConfig={config} token={token} />
    </div>
  );
}
