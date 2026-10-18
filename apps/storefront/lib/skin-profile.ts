// What we know about her skin, kept apart by origin (client feedback, 2026-10-12): what the photos show,
// what she declared, and what was clarified by a follow-up question when the two disagreed.
// Pure functions: used by the questionnaire (browser) and by analyze-skin (server).

type Answer = { questionId: string; answer: unknown };

export function answerOf(responses: Answer[], questionId: string): string {
  const r = responses.find((x) => x.questionId === questionId);
  return typeof r?.answer === "string" ? r.answer : "";
}

// ─── Skin type and moisturizer texture ───────────────────────────────────────────────────────────────────────

export type SkinType = "grasse" | "mixte" | "seche" | "normale";
export type SkinProfile = { type: SkinType; dryZones: boolean; sensitive: boolean; label: string };

// From the questionnaire: how the skin feels after cleansing and at midday, how it reacts to new products
export function readSkinProfile(responses: Answer[]): SkinProfile {
  const postWash = answerOf(responses, "q_post_wash");
  const midday = answerOf(responses, "q_midday_behavior");
  const sensitivity = answerOf(responses, "q_sensitivity");
  const tight = /tiraille/i.test(postWash);
  const dryPatches = /zones s[èe]ches|squameuses/i.test(midday);
  const oilyAll = /tout le visage/i.test(midday) || /regraisse/i.test(postWash);
  const tZone = /zone T/i.test(midday);

  let type: SkinType = "normale";
  if (oilyAll && !tight && !dryPatches) type = "grasse";
  else if (tZone || (oilyAll && (tight || dryPatches))) type = "mixte";
  else if (tight || dryPatches) type = "seche";
  const dryZones = tight || dryPatches;
  const sensitive = /sensible|r[ée]active|intol[ée]rante/i.test(sensitivity);

  const label = {
    grasse: "peau grasse",
    mixte: dryZones ? "peau mixte avec des zones sèches (front brillant, joues qui tiraillent)" : "peau mixte",
    seche: "peau sèche",
    normale: "peau normale",
  }[type] + (sensitive ? ", sensible" : "");
  return { type, dryZones, sensitive, label };
}

export const TEXTURE_LABEL: Record<string, string> = {
  gel: "gel",
  gel_creme: "gel-crème",
  emulsion: "émulsion / lotion fluide",
  creme_legere: "crème légère",
  creme_riche: "crème riche",
  baume: "baume",
  huile: "huile",
  mousse: "mousse",
  liquide: "liquide",
  serum: "sérum",
  stick: "stick",
  autre: "autre",
};

// Moisturizer textures that suit each skin, and those to avoid. A combination skin with dry cheeks gets a
// balanced emulsion or a light but comfortable cream, not a pure gel nor a heavy balm.
export function moisturizerTextures(profile: SkinProfile): { preferred: string[]; avoid: string[] } {
  switch (profile.type) {
    case "grasse":
      return { preferred: ["gel", "gel_creme", "emulsion"], avoid: ["creme_riche", "baume", "huile"] };
    case "mixte":
      return profile.dryZones
        ? { preferred: ["emulsion", "creme_legere", "gel_creme"], avoid: ["baume", "huile", "creme_riche"] }
        : { preferred: ["gel_creme", "emulsion", "creme_legere"], avoid: ["baume", "huile"] };
    case "seche":
      return { preferred: ["creme_legere", "creme_riche", "baume", "emulsion"], avoid: ["gel"] };
    default:
      return { preferred: ["emulsion", "gel_creme", "creme_legere"], avoid: ["baume", "huile"] };
  }
}

// Mattifying / oil-control creams dry the cheeks of a combination skin with dry zones
const MATTIFYING = /oil[- ]?control|matifiant|mattif|sebum[- ]?control|pore[- ]?control|anti[- ]?brillance/i;

export function textureFit(
  product: { title: string; texture?: string },
  profile: SkinProfile
): "preferred" | "ok" | "avoid" | "unknown" {
  if (profile.dryZones && MATTIFYING.test(product.title)) return "avoid";
  if (!product.texture) return "unknown";
  const { preferred, avoid } = moisturizerTextures(profile);
  if (avoid.includes(product.texture)) return "avoid";
  return preferred.includes(product.texture) ? "preferred" : "ok";
}

// ─── Observed vs declared: acne and dark spots ───────────────────────────────────────────────────────────────

// acne_severity_percentage (0-100, photo analysis) at or above which acne counts as active,
// and below which the photos show no real active acne
export const ACNE_SCAN_THRESHOLD = 30;
export const ACNE_SCAN_LOW = 15;

// The photo model counts the lesions zone by zone; the acne score comes from these counts with a fixed grid
// (the model's own 0-100 guess had no scale: 0-25 on every scan, even with visible pimples, 2026-10-18).
// Grades follow the usual global acne grading (clear, almost clear, mild, moderate, severe) and land on
// the thresholds above: grade 1 from 15 (ACNE_SCAN_LOW), grade 2 from 30 (active acne), grade 4 from 75
// (at or above SEVERE_ACNE_SCORE in skin-safety: dermatologist referral).
export const ACNE_ZONES = ["forehead", "nose", "cheek_left_view", "cheek_right_view", "chin_jaw"] as const;
export type AcneZoneCount = { comedones?: unknown; papules_pustules?: unknown; nodules_cysts?: unknown };
export type AcneGrading = {
  grade: 0 | 1 | 2 | 3 | 4;
  score: number;
  totals: { comedones: number; inflammatory: number; nodules: number };
};

const count = (v: unknown) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
};

// null when the model gave no usable counts (the model's own percentage is then kept)
export function acneGradingFromCounts(counts: unknown): AcneGrading | null {
  if (!counts || typeof counts !== "object") return null;
  const zones = ACNE_ZONES.map((z) => (counts as Record<string, AcneZoneCount | undefined>)[z]).filter(
    (z): z is AcneZoneCount => !!z && typeof z === "object"
  );
  if (zones.length === 0) return null;
  const C = zones.reduce((s, z) => s + count(z.comedones), 0);
  const I = zones.reduce((s, z) => s + count(z.papules_pustules), 0);
  const N = zones.reduce((s, z) => s + count(z.nodules_cysts), 0);
  const totals = { comedones: C, inflammatory: I, nodules: N };
  if (N >= 2 || I > 30) return { grade: 4, score: Math.min(95, 75 + Math.round((Math.max(0, I - 30) + 3 * N) / 2)), totals };
  if (N === 1 || I > 10 || C > 30) return { grade: 3, score: 50 + Math.min(19, Math.max(I - 10, Math.round((C - 30) / 3), 0)), totals };
  if (I > 2 || C > 10) return { grade: 2, score: 30 + Math.min(19, Math.max(2 * (I - 2), Math.round((C - 10) / 2), 0)), totals };
  if (I > 0 || C > 2) return { grade: 1, score: 15 + Math.min(14, 4 * I + C), totals };
  return { grade: 0, score: 2 * C, totals };
}
// dark_spots_percentage (0-100) at or above which the photos show spots worth asking about.
// First value, to adjust on real scans (dark skin: shadows and natural shade differences are not spots).
export const DARK_SCAN_THRESHOLD = 35;
// Follow-up questions asked at most at the end of the questionnaire (owner's decision, 2026-10-14)
export const MAX_FOLLOWUPS = 2;

export type FollowUpQuestion = { id: string; text: string; options: string[] };

// Wording from the owner (2026-10-14): the questionnaire adapts to the photos without contradicting the
// customer. A photo can be wrong (light, shadows): her answer wins.

// She declared pimples (or acne is her goal), the photos show none
export const FOLLOWUP_ACNE: FollowUpQuestion = {
  id: "q_followup_acne",
  text: "Vous avez indiqué avoir des boutons. Est-ce que vous en avez régulièrement ou seulement de temps en temps ?",
  options: [
    "J'en ai régulièrement",
    "J'en ai de temps en temps",
    "J'en ai rarement",
    "J'en avais avant, mais plus maintenant",
  ],
};

// The photos show pimples she didn't mention
export const FOLLOWUP_SPOTS: FollowUpQuestion = {
  id: "q_followup_spots",
  text: "Avez-vous parfois des boutons, même si ce n'est pas votre principale préoccupation ?",
  options: ["Oui, souvent", "Oui, parfois", "Rarement", "Non"],
};

// The photos show darker areas and spots are not her goal
export const FOLLOWUP_DARK_SINCE: FollowUpQuestion = {
  id: "q_followup_dark_since",
  text: "Nous avons remarqué quelques zones plus foncées sur vos photos. Savez-vous depuis quand elles sont apparues ?",
  options: ["Depuis quelques jours ou semaines", "Depuis plusieurs mois", "Depuis plusieurs années", "Je ne sais pas"],
};

export const FOLLOWUP_DARK_ORIGIN: FollowUpQuestion = {
  id: "q_followup_dark_origin",
  text: "Est-ce que ces taches sont apparues après des boutons ?",
  options: [
    "Oui, ce sont des marques laissées par des boutons",
    "Non, elles sont apparues autrement",
    "Certaines oui, d'autres non",
    "Je ne sais pas",
  ],
};

export const FOLLOWUP_QUESTIONS = [FOLLOWUP_ACNE, FOLLOWUP_SPOTS, FOLLOWUP_DARK_SINCE, FOLLOWUP_DARK_ORIGIN];

const isAcneGoal = (goal: string) => /acn[ée]|imperfection/i.test(goal);
const isSpotGoal = (goal: string) => /tache|pigment/i.test(goal);

type ScanMetrics = { acne_severity_percentage?: unknown; dark_spots_percentage?: unknown } | null | undefined;

// The acne question to ask when the photos and the answers disagree (they exclude each other), or null
function acneFollowUp(acneScore: unknown, responses: Answer[]): FollowUpQuestion | null {
  const pct = Number(acneScore);
  if (!Number.isFinite(pct)) return null;
  const declaredActive = /^oui/i.test(answerOf(responses, "q_active_acne").trim());
  const goalIsAcne = isAcneGoal(answerOf(responses, "q_main_goal"));
  if ((declaredActive || goalIsAcne) && pct < ACNE_SCAN_LOW) return FOLLOWUP_ACNE;
  if (!declaredActive && !goalIsAcne && pct >= ACNE_SCAN_THRESHOLD) return FOLLOWUP_SPOTS;
  return null;
}

// The follow-up questions for this scan, in order, at most MAX_FOLLOWUPS. Asked at the end of the
// questionnaire, once the photo analysis is back. When acne and dark spots both need asking, the acne
// question comes first (it decides the acne-first rule) and only "after pimples?" is kept for the spots.
export function followUpQuestions(metrics: ScanMetrics, responses: Answer[]): FollowUpQuestion[] {
  const acne = acneFollowUp(metrics?.acne_severity_percentage, responses);
  const dark = Number(metrics?.dark_spots_percentage);
  const darkUnmentioned = Number.isFinite(dark) && dark >= DARK_SCAN_THRESHOLD && !isSpotGoal(answerOf(responses, "q_main_goal"));
  const questions = [
    ...(acne ? [acne] : []),
    ...(darkUnmentioned ? (acne ? [FOLLOWUP_DARK_ORIGIN] : [FOLLOWUP_DARK_SINCE, FOLLOWUP_DARK_ORIGIN]) : []),
  ];
  return questions.slice(0, MAX_FOLLOWUPS);
}

export type AcneReading = {
  goal: string;
  goalIsAcne: boolean;
  declaredActive: boolean; // after the follow-up, if any
  detectedActive: boolean; // after the follow-up, if any
  acneProne: boolean; // breakouts come and go, nothing active today
  rare: boolean; // pimples are rare: no strong anti-acne active
  past: boolean; // she had pimples before, not any more
  uncertain: string | null; // disagreement left unresolved (no follow-up answer)
  scanAcnePct: number | null;
};

export function readAcne(responses: Answer[], scanAcnePct: unknown): AcneReading {
  const goal = answerOf(responses, "q_main_goal");
  const goalIsAcne = isAcneGoal(goal);
  const pct = Number(scanAcnePct);
  const known = Number.isFinite(pct);
  let declaredActive = /^oui/i.test(answerOf(responses, "q_active_acne").trim());
  let detectedActive = known && pct >= ACNE_SCAN_THRESHOLD;
  let acneProne = false;
  let rare = false;
  let past = false;

  // she declared pimples the photos don't show
  const frequency = answerOf(responses, "q_followup_acne");
  if (/r[ée]guli[èe]rement/i.test(frequency)) declaredActive = true;
  else if (/de temps en temps/i.test(frequency)) { declaredActive = false; acneProne = true; }
  else if (/rarement/i.test(frequency)) { declaredActive = false; rare = true; }
  else if (/avant/i.test(frequency)) { declaredActive = false; past = true; }

  // the photos show pimples she didn't mention: her answer wins over the photo
  const seen = answerOf(responses, "q_followup_spots");
  if (/souvent/i.test(seen)) declaredActive = true;
  else if (/parfois/i.test(seen)) acneProne = true;
  else if (/^(rarement|non)/i.test(seen.trim())) { detectedActive = false; rare = /^rarement/i.test(seen.trim()); }

  let uncertain: string | null = null;
  if (!frequency && !seen && known) {
    if (declaredActive && pct < ACNE_SCAN_LOW) uncertain = "elle déclare des boutons actifs que les photos ne montrent pas";
    else if (!declaredActive && !goalIsAcne && pct >= ACNE_SCAN_THRESHOLD) uncertain = "les photos montrent des imperfections qu'elle n'a pas mentionnées";
  }
  return { goal, goalIsAcne, declaredActive, detectedActive, acneProne, rare, past, uncertain, scanAcnePct: known ? pct : null };
}

export type DarkSpotReading = {
  scanPct: number | null;
  seen: boolean; // the photos show spots and spots are not her goal
  since: "recent" | "months" | "years" | "unknown" | null; // null = not asked
  origin: "acne_marks" | "other" | "mixed" | "unknown" | null; // null = not asked
  marks: boolean; // at least some are marks left by pimples
  possibleMelasma: boolean; // for years, not after pimples: gentle care and a dermatologist's opinion
};

export function readDarkSpots(responses: Answer[], metrics: ScanMetrics): DarkSpotReading {
  const pct = Number(metrics?.dark_spots_percentage);
  const known = Number.isFinite(pct);
  const seen = known && pct >= DARK_SCAN_THRESHOLD && !isSpotGoal(answerOf(responses, "q_main_goal"));
  const sinceAnswer = answerOf(responses, "q_followup_dark_since");
  const since = !sinceAnswer ? null
    : /semaines|jours/i.test(sinceAnswer) ? "recent"
    : /mois/i.test(sinceAnswer) ? "months"
    : /ann[ée]es/i.test(sinceAnswer) ? "years"
    : "unknown";
  const originAnswer = answerOf(responses, "q_followup_dark_origin");
  const origin = !originAnswer ? null
    : /^oui/i.test(originAnswer.trim()) ? "acne_marks"
    : /^non/i.test(originAnswer.trim()) ? "other"
    : /certaines/i.test(originAnswer) ? "mixed"
    : "unknown";
  return {
    scanPct: known ? pct : null,
    seen,
    since,
    origin,
    marks: origin === "acne_marks" || origin === "mixed",
    possibleMelasma: since === "years" && origin === "other",
  };
}
