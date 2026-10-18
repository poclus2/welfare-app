import { ClipboardList, ListChecks, MessageSquareWarning } from "lucide-react";

// What the customer answered, what she was told, and every decision the Skin Coach took in code
// (saved since 2026-10-12: older scans have none of it)

const QUESTION_LABEL: Record<string, string> = {
  q_main_goal: "Objectif",
  q_active_acne: "Boutons actifs",
  q_lightening: "Produits éclaircissants",
  q_post_wash: "Après le nettoyage",
  q_midday_behavior: "À midi",
  q_sensitivity: "Réaction aux produits",
  q_pregnancy: "Grossesse / allaitement",
  q_derm_treatment: "Traitement en cours",
  q_has_allergies: "Allergies",
  q_allergies_list: "Allergènes",
  q_current_routine: "Routine actuelle",
  q_routine_details: "Produits utilisés",
  q_sun_exposure: "Exposition au soleil",
  q_makeup: "Maquillage",
  q_budget: "Budget",
  q_followup_acne: "Précision (boutons)",
  q_followup_spots: "Précision (imperfections)",
  q_followup_dark_since: "Taches : depuis quand",
  q_followup_dark_origin: "Taches : après des boutons ?",
};

const NOTICE_LABEL: Record<string, string> = {
  referral: "Avis dermatologique",
  caution: "Précaution",
  budget: "Budget",
  missing: "Étape manquante",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="grid grid-cols-3 gap-3 py-1.5 border-b border-[#F5F0EB] last:border-0">
      <span className="text-[11px] font-semibold text-[#2A2424]/50">{label}</span>
      <span className="col-span-2 text-xs text-[#2A2424]/80 break-words">{value}</span>
    </div>
  );
}

const list = (v: unknown) => (Array.isArray(v) ? v.join(" · ") : null);

export function ScanAudit({ scan }: { scan: any }) {
  const log = scan.analysis_log || null;
  const responses: { questionId: string; answer: string }[] = Array.isArray(scan.responses) ? scan.responses : [];
  const notices: { kind: string; text: string }[] = Array.isArray(scan.notices) ? scan.notices : [];
  if (!log && !responses.length && !notices.length) {
    return (
      <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
        <p className="text-sm text-[#2A2424]/40 italic">Journal non disponible : diagnostic enregistré avant le 12/10/2026.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {responses.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <ClipboardList className="w-[18px] h-[18px] text-amber-600" />
            </div>
            <h2 className="text-sm font-bold text-[#2A2424]">Réponses au questionnaire</h2>
          </div>
          {responses.map((r, i) => (
            <Row key={i} label={QUESTION_LABEL[r.questionId] || r.questionId} value={r.answer} />
          ))}
        </div>
      )}

      {notices.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
              <MessageSquareWarning className="w-[18px] h-[18px] text-rose-500" />
            </div>
            <h2 className="text-sm font-bold text-[#2A2424]">Messages affichés à la cliente</h2>
          </div>
          {notices.map((n, i) => (
            <Row key={i} label={NOTICE_LABEL[n.kind] || n.kind} value={n.text} />
          ))}
        </div>
      )}

      {log && (
        <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center">
              <ListChecks className="w-[18px] h-[18px] text-sky-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#2A2424]">Décisions du Skin Coach</h2>
              <p className="text-xs text-[#2A2424]/40">Ce que le code a vérifié, exclu ou corrigé</p>
            </div>
          </div>
          <Row label="À valider" value={log.review?.needed ? <span className="font-bold text-rose-700">{list(log.review.reasons)}</span> : null} />
          <Row label="Routine" value={log.routine_plan ? `${({ essential: "essentielle", intermediate: "intermédiaire", premium: "avancée" } as Record<string, string>)[log.routine_plan.tier] || log.routine_plan.tier} · ${log.routine_plan.max_steps} étapes max · démaquillant : ${({ needed: "conseillé", offered: "possible", no: "non" } as Record<string, string>)[log.routine_plan.remover] || log.routine_plan.remover}${log.routine_plan.comfort_toner ? " · toner de confort" : ""}` : null} />
          <Row label="Soin ciblé" value={log.goal_target ? `${log.goal_target.candidates?.length || 0} candidat(s)${log.goal_target.in_routine?.length ? ` · retenu : ${list(log.goal_target.in_routine)}` : " · aucun retenu"}` : null} />
          <Row label="Modèles" value={log.models ? `${log.models.visual} · ${log.models.routine}` : null} />
          <Row label="Analyse photo" value={log.visual_source === "questionnaire" ? "faite pendant le questionnaire" : log.visual_source === "final" ? "faite à la fin" : null} />
          <Row label="Profil de peau" value={log.profile?.label} />
          <Row label="Avis dermatologique" value={log.medical?.referral ? list(log.medical.reasons) : "non"} />
          <Row label="Précautions" value={list(log.medical?.cautions)} />
          <Row label="Acné" value={log.acne ? `acné d'abord : ${log.acne.acneFirst ? "oui" : "non"}${log.acne.acneProne ? " · peau à poussées" : ""}${log.acne.uncertain ? ` · incertain : ${log.acne.uncertain}` : ""}` : null} />
          <Row label="Taches (photos)" value={log.dark_spots?.seen ? `${log.dark_spots.scanPct}/100${log.dark_spots.marks ? " · marques de boutons" : ""}${log.dark_spots.possibleMelasma ? " · anciennes, pas liées aux boutons : avis dermatologique conseillé" : ""}` : null} />
          <Row label="Allergies" value={list(log.safety?.allergies)} />
          <Row label="Autre allergie" value={log.safety?.other_allergy} />
          <Row label="Budget" value={log.budget_max ? `jusqu'à ${log.budget_max.toLocaleString("fr-FR")} FCFA` : "sans limite"} />
          <Row label="Produits exclus" value={log.catalog?.excluded ? Object.entries(log.catalog.excluded).map(([k, v]) => `${k} : ${v}`).join(" · ") : null} />
          <Row label="Catalogue proposé" value={log.catalog?.products ? `${log.catalog.products.length} produits` : null} />
          <Row label="Écartés de la 1re réponse" value={list(log.check_model?.dropped)} />
          <Row label="Problèmes signalés à l'IA" value={list(log.correction?.problems)} />
          <Row label="Correction acceptée" value={log.correction ? (log.correction.accepted ? "oui" : "non") : null} />
          <Row label="Ajouté par le code" value={list(log.added_by_code)} />
          <Row label="Ajusté par le code" value={list(log.adjusted_by_code)} />
          <Row label="Bloqué au contrôle final" value={list(log.final_gate_blocked)} />
          <Row label="Durée" value={log.duration_ms ? `${Math.round(log.duration_ms / 1000)} s` : null} />
          <details className="mt-4">
            <summary className="text-xs font-bold text-[#C08A8E] cursor-pointer">Données brutes (analyse photo, réponse de l'IA)</summary>
            <pre className="mt-2 max-h-96 overflow-auto text-[10px] bg-[#FAF7F5] border border-[#EDE0E0] rounded-xl p-3 whitespace-pre-wrap break-words">
              {JSON.stringify(log, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
