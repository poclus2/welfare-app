import Link from "next/link";
import { redirect } from "next/navigation";
import { CaretRight, CheckCircle, Clock, ImageSquare, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { advisorApi, type AdvisorScanRow } from "@/lib/advisor-api";
import { DISPLAY_FONT, SK } from "@/components/ui/skin-coach/theme";
import { AdvisorHeader } from "@/components/advisor/advisor-header";

export const dynamic = "force-dynamic";

const fmtDate = (d: string) =>
  new Date(d).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Douala" });

export default async function AdvisorHomePage({ searchParams }: { searchParams: Promise<{ vue?: string; q?: string }> }) {
  const { vue, q } = await searchParams;
  const [me, list] = await Promise.all([
    advisorApi<{ advisor: { name: string } }>("/advisor/me"),
    advisorApi<{ scans: AdvisorScanRow[] }>("/advisor/skin-scans"),
  ]);
  if (me.status === 401 || list.status === 401) redirect("/conseillere/login");

  const all = list.data?.scans || [];
  const query = (q || "").trim().toLowerCase();
  const pendingCount = all.filter((s) => !s.review_status).length;
  const showAll = vue === "toutes" || !!query;
  const urgent = (s: AdvisorScanRow) => !s.review_status && s.review_flags.length > 0;
  const scans = all
    .filter((s) => showAll || !s.review_status)
    .filter((s) => !query || s.id.toLowerCase().includes(query) || (s.customer_name || "").toLowerCase().includes(query))
    // routines the Skin Coach flagged for a human review come first while they wait (the order stays by date otherwise)
    .sort((a, b) => Number(urgent(b)) - Number(urgent(a)));

  return (
    <div className="max-w-2xl mx-auto px-4 pb-16">
      <AdvisorHeader name={me.data?.advisor.name || ""} />

      <h1 style={{ fontFamily: DISPLAY_FONT, fontSize: 30, lineHeight: 1.05, fontWeight: 300, margin: "8px 0 4px" }}>
        Vos <span style={{ fontWeight: 700, color: SK.accent }}>diagnostics</span>
      </h1>
      <p className="text-[14px] mb-5" style={{ color: SK.muted }}>
        {pendingCount === 0 ? "Rien à relire pour le moment." : `${pendingCount} diagnostic${pendingCount > 1 ? "s" : ""} à relire.`}
      </p>

      <form className="mb-4">
        {vue === "toutes" && <input type="hidden" name="vue" value="toutes" />}
        <input
          name="q"
          defaultValue={q || ""}
          placeholder="N° du diagnostic (reçu sur WhatsApp) ou nom"
          className="w-full h-12 px-4 rounded-2xl text-[15px] outline-none"
          style={{ background: SK.surface, border: `1px solid ${SK.line}` }}
        />
      </form>

      <div className="flex gap-2 mb-4">
        {[
          { key: "", label: "À relire" },
          { key: "toutes", label: "Tous" },
        ].map((t) => {
          const on = (t.key === "toutes") === showAll && !query;
          return (
            <Link
              key={t.key}
              href={t.key ? "/conseillere?vue=toutes" : "/conseillere"}
              className="px-4 h-9 rounded-full flex items-center text-[13px] font-bold"
              style={on ? { background: SK.ink, color: "#fff" } : { background: SK.surface, color: SK.ink, border: `1px solid ${SK.line}` }}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {list.status !== 200 && <p className="text-[14px] font-semibold mb-4" style={{ color: "#B42318" }}>{list.message || "Liste indisponible."}</p>}

      <div className="flex flex-col gap-2.5">
        {scans.map((s) => (
          <Link
            key={s.id}
            href={`/conseillere/scans/${s.id}`}
            className="rounded-[20px] p-4 flex items-center gap-3 active:scale-[0.99] transition-transform"
            style={{ background: SK.surface, border: `1px solid ${SK.lineSoft}` }}
          >
            <span className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: s.review_status ? "#E7F5EE" : s.review_flags.length ? "#FDECEA" : SK.tint }}>
              {s.review_status ? (
                <CheckCircle className="w-5 h-5" weight="fill" style={{ color: "#0B6B45" }} />
              ) : s.review_flags.length ? (
                <WarningCircle className="w-5 h-5" weight="fill" style={{ color: "#B42318" }} />
              ) : (
                <Clock className="w-5 h-5" style={{ color: SK.accent }} />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold truncate">{s.customer_name || "Cliente sans compte"}</p>
              <p className="text-[13px] truncate" style={{ color: SK.muted }}>{s.final_skin_type} · {fmtDate(s.created_at)}</p>
              {!s.review_status && s.review_flags.length > 0 && (
                <p className="text-[12px] font-bold mt-0.5" style={{ color: "#B42318" }}>
                  À valider en priorité · {s.review_flags.length} signalement{s.review_flags.length > 1 ? "s" : ""}
                </p>
              )}
              <p className="text-[11px] font-mono truncate mt-0.5" style={{ color: SK.muted }}>n° {s.id}</p>
            </div>
            {!s.has_photos && <ImageSquare className="w-4 h-4 shrink-0" style={{ color: SK.muted }} aria-label="Photos supprimées" />}
            <CaretRight className="w-4 h-4 shrink-0" style={{ color: SK.muted }} />
          </Link>
        ))}
        {scans.length === 0 && list.status === 200 && (
          <p className="text-[14px] text-center py-10" style={{ color: SK.muted }}>
            {query ? "Aucun diagnostic ne correspond (seuls ceux qui vous sont confiés apparaissent ici)." : "Aucun diagnostic ici."}
          </p>
        )}
      </div>
    </div>
  );
}
