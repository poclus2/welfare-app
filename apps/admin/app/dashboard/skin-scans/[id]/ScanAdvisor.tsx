"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Headset, Loader2, Send } from "lucide-react";

// The skin advisor this scan was given to (in turn, or the customer's usual one), whether she was told on
// WhatsApp, and giving it to another one (or telling the same one again).

type AdvisorOption = { id: string; name: string; active: boolean };

export function ScanAdvisor({
  scanId,
  advisor,
  notifiedAt,
  advisors,
}: {
  scanId: string;
  advisor: { id: string; name: string; active: boolean } | null;
  notifiedAt: string | null;
  advisors: AdvisorOption[];
}) {
  const router = useRouter();
  const active = advisors.filter((a) => a.active);
  const [picked, setPicked] = useState(advisor?.active ? advisor.id : active[0]?.id || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const give = async () => {
    if (!picked) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/skin-scans/${scanId}/advisor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ advisor_id: picked }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || "Attribution impossible");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const status = !advisor
    ? "Confié à personne"
    : notifiedAt
      ? `Prévenue sur WhatsApp le ${new Date(notifiedAt).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
      : "Pas encore prévenue (message WhatsApp non parti)";

  return (
    <div className="bg-white rounded-2xl border border-[#EDE0E0] p-5 shadow-sm print:hidden">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
          <Headset className="w-4 h-4 text-violet-600" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#2A2424] truncate">{advisor ? advisor.name : "Conseillère"}</h3>
          <p className={`text-xs ${advisor && notifiedAt ? "text-emerald-600" : "text-[#2A2424]/40"}`}>{status}</p>
        </div>
      </div>
      {active.length > 0 ? (
        <div className="flex flex-col gap-2">
          <select value={picked} onChange={(e) => setPicked(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#EDE0E0] text-sm bg-white">
            {active.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <button onClick={give} disabled={saving || !picked} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {picked === advisor?.id ? "Renvoyer" : "Confier"}
          </button>
        </div>
      ) : (
        <p className="text-xs text-[#2A2424]/40">Aucune conseillère active (menu Conseillères).</p>
      )}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
