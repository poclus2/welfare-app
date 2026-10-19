"use client";

import { useState } from "react";
import { CheckCircle, CircleNotch, FilePdf, FirstAidKit, Info, WarningCircle, X } from "@phosphor-icons/react";
import type { AdvisorScan } from "@/lib/advisor-api";
import type { FaceMap } from "@/lib/face-map";
import { DISPLAY_FONT, SK } from "@/components/ui/skin-coach/theme";
import { FaceScanFrame } from "@/components/ui/skin-coach/face-scan-frame";
import { faceMarkersOf, metricDefsOf, ringOf } from "@/lib/skin-levels";
import { withoutScores } from "@/lib/coach-message";
import { QUESTION_LABEL } from "@/lib/skin-questions";
import { AdvisorReview } from "@/components/advisor/advisor-review";

// One scan in the advisor's space: what the customer saw (diagnostic, notices, routine), plus what the
// advisor needs to judge it (her three photos, her answers, the AI's observations), then the review.

export type ProductCard = { title: string; brand?: string; thumbnail?: string; handle?: string; amount?: number; currency: string };

const fmtPrice = (amount: number, currency: string) =>
  `${Math.round(amount).toLocaleString("fr-FR")} ${["XAF", "XOF"].includes(currency.toUpperCase()) ? "FCFA" : currency.toUpperCase()}`;
const plainSpaces = (s: string) => s.replace(/[  ]/g, " "); // the PDF fonts have no narrow space

const card = { background: SK.surface, border: `1px solid ${SK.lineSoft}` };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[26px] p-5 flex flex-col gap-3" style={card}>
      <h2 style={{ fontFamily: DISPLAY_FONT, fontSize: 20, fontWeight: 700, margin: 0 }}>{title}</h2>
      {children}
    </section>
  );
}

export function AdvisorScanView({ scan, products }: { scan: AdvisorScan; products: Record<string, ProductCard> }) {
  const [zoom, setZoom] = useState<string | null>(null);
  const [pdfState, setPdfState] = useState<"idle" | "busy" | "error">("idle");

  const customerName = [scan.customer?.first_name, scan.customer?.last_name].filter(Boolean).join(" ");
  const images = scan.images || {};
  const faceMap = images.front_map as FaceMap | undefined;
  const metrics = scan.metrics;
  const levels = metricDefsOf(metrics);
  const markers = faceMarkersOf(metrics);
  const routine: any[] = Array.isArray(scan.routine) ? scan.routine : [];
  // the routine now in force: the corrected one when she (or the team) corrected it
  const current: any[] = scan.review_status === "corrected" && scan.reviewed_routine?.length ? scan.reviewed_routine : routine;
  const concerns = Array.from(new Set(routine.map((s) => s.target_concern).filter(Boolean))) as string[];
  const message = withoutScores(scan.claude_raw_summary || "");
  const responses = Array.isArray(scan.responses) ? scan.responses : [];
  const notices = Array.isArray(scan.notices) ? scan.notices : [];
  const date = new Date(scan.created_at);

  const handlePdf = async () => {
    if (pdfState === "busy") return;
    setPdfState("busy");
    try {
      const { downloadDiagnosticPdf } = await import("@/components/ui/skin-coach/diagnostic-pdf");
      const toBuy = current.filter((s) => !s.already_owned && s.medusa_product_id && products[s.medusa_product_id]?.amount);
      const total = toBuy.reduce((sum, s) => sum + (products[s.medusa_product_id]?.amount || 0), 0);
      await downloadDiagnosticPdf({
        firstName: scan.customer?.first_name || undefined,
        date,
        skinType: scan.final_skin_type,
        phototype: scan.melanin_phototype || undefined,
        concerns,
        levels: levels.map((m) => {
          const r = ringOf(m);
          return { label: m.label, level: r.label, thirds: r.thirds, hint: m.hint };
        }),
        message,
        notices,
        reviewed: scan.review_status || undefined,
        face: images.front && faceMap && markers.length ? { photo: images.front, map: faceMap, markers } : undefined,
        routine: current.map((s) => {
          const p = s.medusa_product_id ? products[s.medusa_product_id] : null;
          return {
            stepName: s.step_name,
            productTitle: p?.title || s.product_name || "Produit recommandé",
            brand: p?.brand,
            price: p?.amount != null ? plainSpaces(fmtPrice(p.amount, p.currency)) : undefined,
            imageUrl: p?.thumbnail,
            why: s.explanation_for_client || s.explanation,
          };
        }),
        total: total > 0 ? plainSpaces(fmtPrice(total, toBuy[0] ? products[toBuy[0].medusa_product_id]?.currency || "XAF" : "XAF")) : undefined,
      });
      setPdfState("idle");
    } catch (e) {
      console.error("[Advisor] PDF failed", e);
      setPdfState("error");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ─── WHO / WHEN / STATUS ─── */}
      <section className="rounded-[26px] p-5 flex flex-col gap-3" style={card}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 style={{ fontFamily: DISPLAY_FONT, fontSize: 26, fontWeight: 700, margin: 0, lineHeight: 1.1 }}>
              {customerName || "Cliente sans compte"}
            </h1>
            <p className="text-[13px] mt-1" style={{ color: SK.muted }}>
              {date.toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Douala" })}
            </p>
            <p className="text-[12px] font-mono mt-1 break-all" style={{ color: SK.muted }}>n° {scan.id}</p>
          </div>
          <span
            className="shrink-0 px-3 py-1.5 rounded-full text-[12px] font-bold"
            style={scan.review_status ? { background: "#E7F5EE", color: "#0B6B45" } : { background: SK.tint, color: SK.accent }}
          >
            {scan.review_status === "validated" ? "Validée" : scan.review_status === "corrected" ? "Corrigée" : "À relire"}
          </span>
        </div>
        <button
          onClick={handlePdf}
          disabled={pdfState === "busy"}
          className="h-12 rounded-full flex items-center justify-center gap-2 text-[14px] font-bold disabled:opacity-60"
          style={{ border: `1px solid ${SK.ink}` }}
        >
          {pdfState === "busy" ? <CircleNotch className="w-5 h-5 animate-spin" /> : <FilePdf className="w-5 h-5" style={{ color: SK.accent }} />}
          {pdfState === "error" ? "PDF impossible, réessayer" : "Télécharger le rapport PDF"}
        </button>
      </section>

      {/* ─── WHY THE SKIN COACH ASKS FOR A HUMAN REVIEW ─── */}
      {scan.review_flags?.length > 0 && (
        <section className="rounded-[26px] p-5 flex gap-3" style={{ background: "#FDECEA", border: "1px solid #F3B8B1" }}>
          <WarningCircle className="w-6 h-6 shrink-0" weight="fill" style={{ color: "#B42318" }} />
          <div className="min-w-0">
            <p className="text-[15px] font-bold mb-1">Routine à valider par vous</p>
            <ul className="flex flex-col gap-1 list-disc pl-4">
              {scan.review_flags.map((r, i) => (
                <li key={i} className="text-[14px] leading-relaxed">{r}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ─── PHOTOS ─── */}
      <Section title="Photos">
        {images.front || images.left || images.right ? (
          <>
            {images.front && faceMap && markers.length > 0 && <FaceScanFrame photo={images.front} map={faceMap} markers={markers} height={380} />}
            <div className="grid grid-cols-3 gap-2">
              {([["front", "Face"], ["left", "Gauche"], ["right", "Droite"]] as const).map(([key, label]) =>
                images[key] ? (
                  <button key={key} onClick={() => setZoom(images[key]!)} className="flex flex-col gap-1">
                    <img src={images[key]} alt={label} className="w-full aspect-[3/4] object-cover rounded-2xl" />
                    <span className="text-[12px] font-semibold" style={{ color: SK.muted }}>{label}</span>
                  </button>
                ) : (
                  <div key={key} className="aspect-[3/4] rounded-2xl" style={{ background: SK.track }} />
                )
              )}
            </div>
          </>
        ) : (
          <p className="text-[14px]" style={{ color: SK.muted }}>
            Photos supprimées : elles sont gardées 7 jours quand la cliente n&apos;a pas de compte, 6 mois sinon.
          </p>
        )}
      </Section>

      {/* ─── DIAGNOSTIC ─── */}
      <Section title="Diagnostic">
        <p className="text-[18px] font-bold" style={{ fontFamily: DISPLAY_FONT }}>{scan.final_skin_type}</p>
        {scan.melanin_phototype && <p className="text-[14px]" style={{ color: SK.muted }}>Phototype : {scan.melanin_phototype}</p>}
        {levels.length > 0 && (
          // the customer's rings, as compact rows: indicator, level, three-segment gauge
          <div className="flex flex-col">
            {levels.map((m, i) => {
              const r = ringOf(m);
              return (
                <div key={m.key} className="flex items-center gap-3 py-2" style={{ borderTop: i ? `1px solid ${SK.lineSoft}` : undefined }}>
                  <span className="text-[14px] font-bold flex-1 min-w-0">{m.label}</span>
                  <span className="text-[13px] font-semibold" style={{ color: SK.muted }}>{r.label}</span>
                  <span className="flex gap-1 shrink-0" aria-hidden="true">
                    {[1, 2, 3].map((t) => (
                      <span key={t} className="w-5 h-2 rounded-full" style={{ background: t <= r.thirds ? SK.accent : SK.track }} />
                    ))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {(scan.concerns || []).length > 0 && (
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] mb-1.5" style={{ color: SK.muted }}>Observé sur les photos</p>
            <div className="flex flex-wrap gap-1.5">
              {(scan.concerns || []).map((c, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full text-[12px]" style={{ background: SK.tint }}>{c}</span>
              ))}
            </div>
          </div>
        )}
        {scan.qwen_raw_summary && (
          <details>
            <summary className="text-[13px] font-bold cursor-pointer" style={{ color: SK.accent }}>Raisonnement de l&apos;analyse des photos</summary>
            <p className="text-[13px] leading-relaxed whitespace-pre-wrap mt-2" style={{ color: SK.muted }}>{scan.qwen_raw_summary}</p>
          </details>
        )}
        {message && (
          <div className="rounded-2xl p-4" style={{ background: SK.ground }}>
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] mb-1" style={{ color: SK.muted }}>Message du Skin Coach</p>
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{message}</p>
          </div>
        )}
      </Section>

      {/* ─── NOTICES ─── */}
      {notices.length > 0 && (
        <div className="flex flex-col gap-3">
          {notices.map((n, i) => {
            const strong = n.kind === "referral";
            return (
              <div key={i} className="rounded-[22px] p-4 flex gap-3" style={{ background: strong ? SK.tint : SK.surface, border: `1px solid ${strong ? SK.accent : SK.line}` }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: strong ? SK.accent : SK.tint }}>
                  {strong ? <FirstAidKit className="w-4 h-4 text-white" /> : <Info className="w-4 h-4" style={{ color: SK.accent }} />}
                </div>
                <div>
                  {strong && <p className="text-[14px] font-bold mb-1">Avis dermatologique recommandé</p>}
                  <p className="text-[14px] leading-relaxed">{n.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── ANSWERS ─── */}
      <Section title="Ses réponses">
        {responses.length > 0 ? (
          <div className="flex flex-col">
            {responses.map((r, i) => (
              <div key={i} className="py-2 flex flex-col sm:flex-row sm:gap-3" style={{ borderTop: i ? `1px solid ${SK.lineSoft}` : undefined }}>
                <span className="text-[12px] font-bold sm:w-40 shrink-0" style={{ color: SK.muted }}>{QUESTION_LABEL[r.questionId] || r.questionId}</span>
                <span className="text-[14px]">{r.answer}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[14px]" style={{ color: SK.muted }}>Réponses non enregistrées pour ce diagnostic.</p>
        )}
      </Section>

      {/* ─── ROUTINE ─── */}
      <Section title={scan.review_status === "corrected" ? "Routine corrigée" : "Routine proposée"}>
        {current.map((s, i) => {
          const p = s.medusa_product_id ? products[s.medusa_product_id] : null;
          return (
            <div key={i} className="flex gap-3 py-2" style={{ borderTop: i ? `1px solid ${SK.lineSoft}` : undefined }}>
              <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center" style={{ background: SK.ground }}>
                {p?.thumbnail ? <img src={p.thumbnail} alt="" className="w-full h-full object-contain" /> : <span className="text-[18px] font-bold" style={{ fontFamily: DISPLAY_FONT }}>{i + 1}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold uppercase tracking-[0.06em]" style={{ color: SK.accent }}>{i + 1}. {s.step_name}</p>
                <p className="text-[15px] font-bold leading-snug">{p?.title || s.product_name || "Produit recommandé"}</p>
                <p className="text-[12px]" style={{ color: SK.muted }}>
                  {[p?.brand, p?.amount != null ? fmtPrice(p.amount, p.currency) : null].filter(Boolean).join(" · ")}
                  {s.already_owned ? " · déjà dans sa routine" : ""}
                  {s.evening_only ? " · le soir seulement" : ""}
                </p>
                {(s.explanation_for_client || s.explanation) && (
                  <p className="text-[13px] leading-relaxed mt-1" style={{ color: SK.muted }}>{s.explanation_for_client || s.explanation}</p>
                )}
              </div>
            </div>
          );
        })}
        {current.length === 0 && <p className="text-[14px]" style={{ color: SK.muted }}>Aucune routine enregistrée.</p>}
      </Section>

      {/* ─── REVIEW ─── */}
      <AdvisorReview
        scanId={scan.id}
        routine={routine}
        reviewedRoutine={scan.reviewed_routine}
        reviewStatus={scan.review_status}
        corrections={scan.review_corrections}
        reviewedBy={scan.reviewed_by}
        reviewedAt={scan.reviewed_at}
      />

      {scan.review_status && (
        <p className="text-[12px] text-center flex items-center justify-center gap-1.5" style={{ color: SK.muted }}>
          <CheckCircle className="w-4 h-4" weight="fill" style={{ color: "#0B6B45" }} />
          {scan.has_account ? "La cliente voit la routine relue dans son compte." : "Sans compte, la cliente ne voit pas la routine relue : envoyez-la-lui sur WhatsApp."}
        </p>
      )}

      {zoom && (
        <button onClick={() => setZoom(null)} className="fixed inset-0 z-[200] bg-black/85 flex items-center justify-center p-4" aria-label="Fermer">
          <img src={zoom} alt="" className="max-w-full max-h-full object-contain rounded-2xl" />
          <X className="absolute top-4 right-4 w-7 h-7 text-white" />
        </button>
      )}
    </div>
  );
}
