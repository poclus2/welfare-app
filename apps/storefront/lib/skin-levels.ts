import type { FaceZone } from "@/lib/face-map";

// The photo analysis gives estimates, not measurements (client feedback, 2026-10-12): each indicator is shown
// as a level, without a number, and there is no overall score nor skin age. Shared by the result page, its
// PDF and the advisors' space, so all three say the same thing.

export type Tone = 0 | 1 | 2; // 0 = little of it, 2 = a lot of it

export function toneOf(value: number): Tone {
  return value < 33 ? 0 : value < 66 ? 1 : 2;
}

export type SkinMetrics = {
  sebum_level_percentage: number;
  acne_severity_percentage: number;
  hydration_barrier_percentage: number;
  pore_visibility_percentage: number;
  eye_contour_fatigue_percentage: number;
};

export type MetricDef = { key: string; label: string; hint: string; value: number | undefined; good?: boolean };

export function metricDefsOf(metrics: SkinMetrics | null | undefined): MetricDef[] {
  if (!metrics) return [];
  return [
    { key: "sebum", label: "Sébum", hint: "Brillance de la peau", value: metrics.sebum_level_percentage },
    { key: "hydration", label: "Hydratation", hint: "Confort et barrière", value: metrics.hydration_barrier_percentage, good: true },
    { key: "acne", label: "Imperfections", hint: "Boutons et points noirs", value: metrics.acne_severity_percentage },
    { key: "pores", label: "Pores", hint: "Visibilité des pores", value: metrics.pore_visibility_percentage },
    { key: "eyes", label: "Contour des yeux", hint: "Cernes et fatigue", value: metrics.eye_contour_fatigue_percentage },
  ].filter((m) => Number.isFinite(Number(m.value)));
}

// level shown in the ring: for "bad" indicators the ring fills with the amount, for hydration with how good it is
export function ringOf(m: MetricDef): { thirds: 1 | 2 | 3; label: string } {
  const tone = toneOf(Number(m.value));
  if (m.good) return [{ thirds: 1, label: "À renforcer" }, { thirds: 2, label: "Moyenne" }, { thirds: 3, label: "Bonne" }][tone] as { thirds: 1 | 2 | 3; label: string };
  return [{ thirds: 1, label: "Faible" }, { thirds: 2, label: "Modéré" }, { thirds: 3, label: "Marqué" }][tone] as { thirds: 1 | 2 | 3; label: string };
}

// zones drawn on her photo, with the same levels as the rings
export function faceMarkersOf(metrics: SkinMetrics | null | undefined): { zone: FaceZone; title: string; text: string }[] {
  if (!metrics) return [];
  return [
    { zone: "forehead" as const, title: "Zone T", text: ["Peu de brillance", "Brillance modérée", "Brillance marquée"][toneOf(metrics.sebum_level_percentage)]! },
    { zone: "nose" as const, title: "Nez", text: ["Pores discrets", "Pores visibles", "Pores très visibles"][toneOf(metrics.pore_visibility_percentage)]! },
    { zone: "cheekA" as const, title: "Joues", text: ["Hydratation à renforcer", "Hydratation moyenne", "Bonne hydratation"][toneOf(metrics.hydration_barrier_percentage)]! },
  ];
}
