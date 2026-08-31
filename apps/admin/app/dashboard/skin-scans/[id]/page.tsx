import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Activity, FileText, CheckCircle2, ScanFace, User, Calendar, Droplets, Zap, Eye, Circle, Sparkles } from "lucide-react";
import { ScanImageGallery } from "./ScanImageGallery";

export const dynamic = "force-dynamic";

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-semibold text-[#2A2424]/50 uppercase tracking-widest">{label}</span>
        <span className="text-xs font-bold text-[#2A2424]">{value}%</span>
      </div>
      <div className="h-1.5 bg-[#F5F0EB] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

function SkinTypePill({ type }: { type: string }) {
  const normalized = type?.toLowerCase() || "";
  let gradient = "from-[#C08A8E] to-pink-400";
  if (normalized.includes("grasse") || normalized.includes("mixte")) {
    gradient = "from-amber-400 to-orange-400";
  } else if (normalized.includes("sèche") || normalized.includes("déshydratée")) {
    gradient = "from-blue-400 to-cyan-400";
  } else if (normalized.includes("normale")) {
    gradient = "from-emerald-400 to-teal-400";
  } else if (normalized.includes("sensible")) {
    gradient = "from-rose-400 to-red-300";
  }
  return (
    <span className={`inline-flex items-center gap-2 bg-gradient-to-r ${gradient} text-white text-sm font-bold px-4 py-2 rounded-xl shadow-sm`}>
      <ScanFace className="w-4 h-4 opacity-80" />
      {type}
    </span>
  );
}

export default async function SkinScanDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  const { id } = await params;

  if (!token) return null;

  const data = await fetchAdmin<{ skin_scan: any }>(
    `/skin-scans/${id}`,
    token
  ).catch((e) => {
    console.error("Failed to fetch skin scan details", e);
    return null;
  });

  const scan = data?.skin_scan;

  if (!scan) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <ScanFace className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <p className="font-bold text-[#2A2424] mb-1">Scan introuvable</p>
          <p className="text-sm text-[#2A2424]/40">Ce diagnostic n'existe pas ou a été supprimé.</p>
        </div>
        <Link href="/dashboard/skin-scans" className="inline-flex items-center gap-2 text-sm font-bold text-[#C08A8E] hover:text-[#2A2424] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour aux scans
        </Link>
      </div>
    );
  }

  const metrics = scan.metrics;

  return (
    <div className="p-5 lg:p-8 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard/skin-scans" className="text-[#2A2424]/40 hover:text-[#C08A8E] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="text-[#2A2424]/20">|</span>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2A2424]/40">
          <Link href="/dashboard/skin-scans" className="hover:text-[#2A2424] transition-colors">Skin Scans</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#2A2424] font-mono text-[11px]">{scan.id}</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#2A2424] to-[#3D2B2B] rounded-3xl p-8 text-white relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#C08A8E]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-pink-400/10 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ScanFace className="w-5 h-5 text-[#C08A8E]" />
                <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Diagnostic Skin Coach</span>
              </div>
              <h1 className="text-3xl font-bold leading-tight" style={{ letterSpacing: "-0.03em" }}>
                Rapport de Scan
              </h1>
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              <div className="flex items-center gap-2 text-white/50 text-xs">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(scan.created_at).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
              <div className="text-white/30 text-xs">
                {new Date(scan.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>

          {/* Key stats row */}
          <div className="flex flex-wrap gap-4">
            {scan.final_skin_type && <SkinTypePill type={scan.final_skin_type} />}
            {scan.estimated_skin_age && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-xl px-4 py-2">
                <User className="w-4 h-4 text-white/60" />
                <span className="text-sm font-bold text-white">{scan.estimated_skin_age} ans</span>
                <span className="text-white/40 text-xs">cutanés</span>
              </div>
            )}
            {scan.melanin_phototype && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-xl px-4 py-2">
                <Sparkles className="w-4 h-4 text-white/60" />
                <span className="text-sm font-bold text-white">{scan.melanin_phototype}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Face Images */}
      <ScanImageGallery images={scan.images} />


      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT: Qwen Analysis Card */}
        <div className="lg:col-span-2 space-y-6">

          {/* Qwen Summary */}
          <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-[#C08A8E]/10 flex items-center justify-center">
                <Activity className="w-4.5 h-4.5 text-[#C08A8E]" style={{ width: "18px", height: "18px" }} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#2A2424]">Analyse Visuelle IA</h2>
                <p className="text-xs text-[#2A2424]/40">Résultats du diagnostic Qwen Vision</p>
              </div>
            </div>

            {/* Concerns tags */}
            {scan.concerns && scan.concerns.length > 0 && (
              <div className="mb-5">
                <span className="text-[10px] uppercase font-bold text-[#2A2424]/40 tracking-widest block mb-2.5">Problématiques identifiées</span>
                <div className="flex flex-wrap gap-2">
                  {scan.concerns.map((concern: string, i: number) => (
                    <span key={i} className="text-xs font-semibold px-3 py-1.5 bg-[#F5F0EB] text-[#8A6E5A] rounded-lg border border-[#EDE0E0]">
                      {concern}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Qwen summary text */}
            {scan.qwen_raw_summary ? (
              <div>
                <span className="text-[10px] uppercase font-bold text-[#2A2424]/40 tracking-widest block mb-2.5">Résumé clinique</span>
                <div className="bg-[#FAF7F5] rounded-xl p-4 border border-[#EDE0E0]">
                  <p className="text-sm text-[#2A2424]/70 leading-relaxed whitespace-pre-wrap">{scan.qwen_raw_summary}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#2A2424]/30 italic">Résumé non disponible pour ce scan.</p>
            )}
          </div>

          {/* Claude Recommendations */}
          <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <FileText className="w-4.5 h-4.5 text-emerald-600" style={{ width: "18px", height: "18px" }} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#2A2424]">Prescription Skin Coach</h2>
                <p className="text-xs text-[#2A2424]/40">Recommandations personnalisées Claude</p>
              </div>
            </div>

            {/* Routine recommendations */}
            {scan.routine && scan.routine.length > 0 ? (
              <div className="mb-5">
                <span className="text-[10px] uppercase font-bold text-[#2A2424]/40 tracking-widest block mb-3">Routine K-Beauty recommandée</span>
                <div className="space-y-3">
                  {scan.routine.map((rec: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 bg-emerald-50/60 border border-emerald-100 p-4 rounded-xl">
                      <div className="flex items-center justify-center w-6 h-6 bg-emerald-500/20 rounded-lg shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        {typeof rec === "object" ? (
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              {rec.step_number && (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                                  Étape {rec.step_number}
                                </span>
                              )}
                              {(rec.step_name || rec.category) && (
                                <span className="text-xs font-bold text-[#2A2424]">{rec.step_name || rec.category}</span>
                              )}
                            </div>
                            
                            {rec.product_name && (
                              <div className="mt-2 mb-2 p-2.5 bg-white rounded-lg border border-emerald-100/50 flex justify-between items-center shadow-sm">
                                <span className="text-sm font-medium text-emerald-900">{rec.product_name}</span>
                                {rec.medusa_product_id && (
                                  <a href={`https://thewelfare.store/shop/product/${rec.medusa_product_id}`} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase font-bold text-emerald-600 hover:underline shrink-0 ml-2">
                                    Voir produit
                                  </a>
                                )}
                              </div>
                            )}

                            {rec.target_concern && (
                              <p className="text-xs text-[#2A2424]/50 mb-1">
                                <span className="font-semibold">Cible :</span> {rec.target_concern}
                              </p>
                            )}
                            {(rec.explanation_for_client || rec.explanation) && (
                              <p className="text-xs text-[#2A2424]/70 mt-1 leading-relaxed">{rec.explanation_for_client || rec.explanation}</p>
                            )}
                          </>
                        ) : (
                          <p className="text-xs font-medium text-[#2A2424]">{rec}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-5 p-4 bg-[#FAF7F5] rounded-xl border border-[#EDE0E0]">
                <p className="text-sm text-[#2A2424]/40 italic text-center">Aucune routine enregistrée pour ce scan.</p>
              </div>
            )}

            {/* Claude raw summary */}
            {scan.claude_raw_summary && (
              <div>
                <span className="text-[10px] uppercase font-bold text-[#2A2424]/40 tracking-widest block mb-2.5">Message personnalisé</span>
                <div className="bg-[#FAF7F5] rounded-xl p-4 border border-[#EDE0E0]">
                  <p className="text-sm text-[#2A2424]/70 leading-relaxed whitespace-pre-wrap">{scan.claude_raw_summary}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Metrics sidebar */}
        <div className="space-y-6">
          
          {/* Skin Metrics */}
          {metrics && (
            <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Circle className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2A2424]">Métriques cutanées</h3>
                  <p className="text-xs text-[#2A2424]/40">Scanner IA haute précision</p>
                </div>
              </div>

              <div className="space-y-4">
                {metrics.sebum_level_percentage !== undefined && (
                  <MetricBar
                    label="Sébum"
                    value={metrics.sebum_level_percentage}
                    color="bg-gradient-to-r from-amber-400 to-orange-400"
                  />
                )}
                {metrics.hydration_barrier_percentage !== undefined && (
                  <MetricBar
                    label="Hydratation"
                    value={metrics.hydration_barrier_percentage}
                    color="bg-gradient-to-r from-blue-400 to-cyan-400"
                  />
                )}
                {metrics.acne_severity_percentage !== undefined && (
                  <MetricBar
                    label="Acné"
                    value={metrics.acne_severity_percentage}
                    color="bg-gradient-to-r from-red-400 to-rose-400"
                  />
                )}
                {metrics.pore_visibility_percentage !== undefined && (
                  <MetricBar
                    label="Pores visibles"
                    value={metrics.pore_visibility_percentage}
                    color="bg-gradient-to-r from-violet-400 to-purple-400"
                  />
                )}
                {metrics.eye_contour_fatigue_percentage !== undefined && (
                  <MetricBar
                    label="Fatigue oculaire"
                    value={metrics.eye_contour_fatigue_percentage}
                    color="bg-gradient-to-r from-slate-400 to-gray-400"
                  />
                )}
              </div>
            </div>
          )}

          {/* Scan ID */}
          <div className="bg-[#FAF7F5] rounded-2xl border border-[#EDE0E0] p-5">
            <span className="text-[10px] uppercase font-bold text-[#2A2424]/40 tracking-widest block mb-2">Identifiant du scan</span>
            <p className="text-xs font-mono text-[#2A2424]/60 break-all">{scan.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
