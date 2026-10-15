"use client";

import type { ReactNode } from "react";
import { DISPLAY_FONT, SK } from "@/components/ui/skin-coach/theme";

// Shared pieces of the customer space, in the Skin Coach look (prototype "Espace client" validated by the
// owner, 2026-10-15): pink-white ground, white cards, magenta as the only accent, Urbanist headlines.

export { SK, DISPLAY_FONT };

// "Mes commandes": light first word, bold magenta rest
export function SectionTitle({ light, bold, size = 28, as: Tag = "h2", nowrap = false }: { light: string; bold: string; size?: number; as?: "h1" | "h2"; nowrap?: boolean }) {
  return (
    <Tag style={{ margin: 0, fontFamily: DISPLAY_FONT, fontSize: size, lineHeight: 1.04, fontWeight: 300, letterSpacing: "-0.02em", color: SK.ink }}>
      {light} <span style={{ fontWeight: 700, color: SK.accent, whiteSpace: nowrap ? "nowrap" : undefined }}>{bold}</span>
    </Tag>
  );
}

export function Card({ children, className = "", tint = false }: { children: ReactNode; className?: string; tint?: boolean }) {
  return (
    <div
      className={`rounded-[26px] ${className}`}
      style={tint ? { background: SK.tint } : { background: SK.surface, border: `1px solid ${SK.lineSoft}` }}
    >
      {children}
    </div>
  );
}

export const Eyebrow = ({ children }: { children: ReactNode }) => (
  <p className="text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: SK.muted }}>{children}</p>
);

// A qualitative level as a small ring (no score shown): thirds = how much of the ring is filled
export function MiniRing({ thirds, label, size = 72 }: { thirds: 0 | 1 | 2 | 3; label: string; size?: number }) {
  const stroke = 7;
  const r = (size - stroke) / 2 - 1;
  const C = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={SK.track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={SK.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(thirds / 3) * C} ${C}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center text-[11px] font-bold leading-tight px-3" style={{ color: SK.ink }}>
        {label}
      </div>
    </div>
  );
}

// Levels read from a scan's metrics (0-100), same thresholds as the result page
export type LevelKey = "sebum" | "hydration" | "acne" | "pores";
const TONE = (v: number) => (v < 33 ? 0 : v < 66 ? 1 : 2);
export function levelOf(key: LevelKey, value: unknown): { thirds: 1 | 2 | 3; label: string } | null {
  const v = Number(value);
  if (!Number.isFinite(v)) return null;
  const tone = TONE(v);
  if (key === "hydration") return ([{ thirds: 1, label: "À renforcer" }, { thirds: 2, label: "Moyenne" }, { thirds: 3, label: "Bonne" }] as const)[tone];
  return ([{ thirds: 1, label: "Faible" }, { thirds: 2, label: "Modéré" }, { thirds: 3, label: "Marqué" }] as const)[tone];
}

export const METRIC_KEYS: { key: LevelKey; field: string; label: string }[] = [
  { key: "sebum", field: "sebum_level_percentage", label: "Sébum" },
  { key: "hydration", field: "hydration_barrier_percentage", label: "Hydratation" },
  { key: "acne", field: "acne_severity_percentage", label: "Imperfections" },
  { key: "pores", field: "pore_visibility_percentage", label: "Pores" },
];

// "Peau Mixte à tendance déshydratée" → ["Peau mixte", "à tendance déshydratée"]
export function splitSkinType(type: string): [string, string] {
  const words = String(type || "").trim().split(/\s+/);
  if (words.length <= 2) return ["", words.join(" ")];
  const first = words.slice(0, 2).join(" ");
  return [first.charAt(0).toUpperCase() + first.slice(1).toLowerCase(), words.slice(2).join(" ")];
}
