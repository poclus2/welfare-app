import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";
import Link from "next/link";
import { ArrowRight, ScanFace, Calendar, User, Sparkles, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

function SkinTypeBadge({ type }: { type: string }) {
  const normalized = type?.toLowerCase() || "";
  let colorClass = "bg-[#F5F0EB] text-[#8A6E5A] border-[#D4B5A8]";
  if (normalized.includes("grasse") || normalized.includes("mixte")) {
    colorClass = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (normalized.includes("sèche") || normalized.includes("seche") || normalized.includes("déshydratée")) {
    colorClass = "bg-blue-50 text-blue-700 border-blue-200";
  } else if (normalized.includes("normale")) {
    colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (normalized.includes("sensible")) {
    colorClass = "bg-rose-50 text-rose-700 border-rose-200";
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${colorClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {type}
    </span>
  );
}

function AgeIndicator({ age }: { age: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <User className="w-3.5 h-3.5 text-[#C08A8E]" />
      <span className="text-sm font-semibold text-[#2A2424]">{age} ans</span>
    </div>
  );
}

export default async function SkinScansPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) return null;

  const data = await fetchAdmin<{ skin_scans: any[] }>(
    `/skin-scans`,
    token
  ).catch((e) => {
    console.error("Failed to fetch skin scans", e);
    return { skin_scans: [] };
  });

  const scans = data?.skin_scans ?? [];
  const totalScans = scans.length;
  const avgAge = totalScans > 0
    ? Math.round(scans.reduce((acc: number, s: any) => acc + (s.estimated_skin_age || 0), 0) / totalScans)
    : 0;

  return (
    <div className="p-5 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#C08A8E]/10 flex items-center justify-center">
              <ScanFace className="w-5 h-5 text-[#C08A8E]" />
            </div>
            <h1 className="text-3xl font-bold text-[#2A2424]" style={{ letterSpacing: "-0.03em" }}>
              Skin Coach Scans
            </h1>
          </div>
          <p className="text-sm text-[#2A2424]/40 ml-[52px]">Historique complet des diagnostics de peau</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-[#EDE0E0] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold text-[#2A2424]/40 tracking-widest">Total Scans</span>
            <div className="w-8 h-8 rounded-lg bg-[#C08A8E]/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#C08A8E]" />
            </div>
          </div>
          <p className="text-4xl font-bold text-[#2A2424]" style={{ letterSpacing: "-0.04em" }}>{totalScans}</p>
          <p className="text-xs text-[#2A2424]/40 mt-1">diagnostics effectués</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#EDE0E0] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold text-[#2A2424]/40 tracking-widest">Âge Moyen</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <User className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-4xl font-bold text-[#2A2424]" style={{ letterSpacing: "-0.04em" }}>
            {avgAge > 0 ? `${avgAge}` : "—"}
          </p>
          <p className="text-xs text-[#2A2424]/40 mt-1">ans cutanés estimés</p>
        </div>
      </div>

      {/* Scans Table */}
      <div className="bg-white rounded-2xl border border-[#EDE0E0] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EDE0E0]">
          <div>
            <h2 className="text-sm font-bold text-[#2A2424]">Tous les Scans</h2>
            <p className="text-xs text-[#2A2424]/40 mt-0.5">{totalScans} résultat{totalScans !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#2A2424]/30 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            Powered by AI
          </div>
        </div>
        
        {scans.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#F5F0EB] flex items-center justify-center">
              <ScanFace className="w-8 h-8 text-[#C08A8E]/40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#2A2424]/60">Aucun scan enregistré</p>
              <p className="text-xs text-[#2A2424]/30 mt-1">Les diagnostics Skin Coach apparaîtront ici</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F5F0EB]/60">
                  <th className="text-left px-6 py-3.5 text-[10px] font-bold text-[#2A2424]/40 uppercase tracking-widest whitespace-nowrap">#</th>
                  <th className="text-left px-6 py-3.5 text-[10px] font-bold text-[#2A2424]/40 uppercase tracking-widest whitespace-nowrap">Type de Peau</th>
                  <th className="text-left px-6 py-3.5 text-[10px] font-bold text-[#2A2424]/40 uppercase tracking-widest whitespace-nowrap">Âge Cutané</th>
                  <th className="text-left px-6 py-3.5 text-[10px] font-bold text-[#2A2424]/40 uppercase tracking-widest whitespace-nowrap">Date</th>
                  <th className="text-right px-6 py-3.5 text-[10px] font-bold text-[#2A2424]/40 uppercase tracking-widest whitespace-nowrap">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F0EB]">
                {scans.map((scan: any, index: number) => (
                  <tr key={scan.id} className="hover:bg-[#FAF7F5] transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-[#2A2424]/30">#{totalScans - index}</span>
                    </td>
                    <td className="px-6 py-4">
                      {scan.final_skin_type
                        ? <SkinTypeBadge type={scan.final_skin_type} />
                        : <span className="text-xs text-[#2A2424]/30 italic">Non renseigné</span>
                      }
                    </td>
                    <td className="px-6 py-4">
                      {scan.estimated_skin_age
                        ? <AgeIndicator age={scan.estimated_skin_age} />
                        : <span className="text-xs text-[#2A2424]/30 italic">—</span>
                      }
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#2A2424]/30" />
                        <span className="text-xs text-[#2A2424]/60">
                          {new Date(scan.created_at).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </span>
                        <span className="text-[10px] text-[#2A2424]/30 ml-1">
                          {new Date(scan.created_at).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/dashboard/skin-scans/${scan.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C08A8E] hover:text-[#2A2424] transition-colors group-hover:gap-2.5"
                      >
                        Voir le rapport <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
