// Skin Coach look (prototype validated by the owner, 2026-10-14): the shop's magenta as the only accent,
// a near-white pink ground, dark text, Urbanist for headlines and results, Plus Jakarta Sans for the rest.
// #E0187C is the owner's magenta, a touch deeper so white text on it stays readable (4.5:1).
export const SK = {
  accent: "#E0187C",
  accentLight: "#F7B6D4", // start of the gauge / ring gradient
  tint: "#FCEAF3", // pale pink surfaces
  ground: "#FBF8F9",
  surface: "#FFFFFF",
  line: "#EFDDE5",
  lineSoft: "#F3E7EC",
  track: "#F6ECF0", // empty part of a ring
  ink: "#2A2424",
  muted: "#6E5F5B",
} as const;

export const DISPLAY_FONT = "Urbanist, 'Plus Jakarta Sans', sans-serif";
