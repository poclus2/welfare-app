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

// ─── Observed vs declared: acne ──────────────────────────────────────────────────────────────────────────────

// acne_severity_percentage (0-100, photo analysis) at or above which acne counts as active,
// and below which the photos show no real active acne
export const ACNE_SCAN_THRESHOLD = 30;
export const ACNE_SCAN_LOW = 15;

export type FollowUpQuestion = { id: string; text: string; options: string[] };

export const FOLLOWUP_ACNE: FollowUpQuestion = {
  id: "q_followup_acne",
  text: "Une précision : sur vos photos, nous ne voyons pas de boutons actifs aujourd'hui. Vos boutons apparaissent-ils plutôt par poussées ?",
  options: [
    "Oui, par poussées (cycle, stress…), mais pas en ce moment",
    "J'en ai en ce moment, même s'ils sont peu visibles sur les photos",
    "J'ai surtout des points noirs et des pores dilatés",
  ],
};

export const FOLLOWUP_SPOTS: FollowUpQuestion = {
  id: "q_followup_spots",
  text: "Une précision : nos photos montrent quelques imperfections. De quoi s'agit-il plutôt ?",
  options: [
    "De boutons récents ou en cours",
    "De marques laissées par d'anciens boutons",
    "Je ne sais pas",
  ],
};

const isAcneGoal = (goal: string) => /acn[ée]|imperfection/i.test(goal);

// The follow-up to ask when the photos and the answers disagree about acne (at most one: they exclude each
// other), or null. Asked at the end of the questionnaire, once the photo analysis is back.
export function acneFollowUp(acneScore: unknown, responses: Answer[]): FollowUpQuestion | null {
  const pct = Number(acneScore);
  if (!Number.isFinite(pct)) return null;
  const declaredActive = /^oui/i.test(answerOf(responses, "q_active_acne").trim());
  const goalIsAcne = isAcneGoal(answerOf(responses, "q_main_goal"));
  if ((declaredActive || goalIsAcne) && pct < ACNE_SCAN_LOW) return FOLLOWUP_ACNE;
  if (!declaredActive && !goalIsAcne && pct >= ACNE_SCAN_THRESHOLD) return FOLLOWUP_SPOTS;
  return null;
}

export type AcneReading = {
  goal: string;
  goalIsAcne: boolean;
  declaredActive: boolean; // after the follow-up, if any
  detectedActive: boolean; // after the follow-up, if any
  acneProne: boolean; // breakouts come and go, nothing active today
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

  const flare = answerOf(responses, "q_followup_acne");
  if (/^oui, par pouss[ée]es|points noirs/i.test(flare)) { declaredActive = false; acneProne = true; }
  else if (/^j.en ai en ce moment/i.test(flare)) declaredActive = true;
  const spots = answerOf(responses, "q_followup_spots");
  if (/marques/i.test(spots)) detectedActive = false;
  if (/r[ée]cents/i.test(spots)) declaredActive = true;

  let uncertain: string | null = null;
  if (!flare && !spots && known) {
    if (declaredActive && pct < ACNE_SCAN_LOW) uncertain = "elle déclare des boutons actifs que les photos ne montrent pas";
    else if (!declaredActive && !goalIsAcne && pct >= ACNE_SCAN_THRESHOLD) uncertain = "les photos montrent des imperfections qu'elle n'a pas mentionnées";
  }
  return { goal, goalIsAcne, declaredActive, detectedActive, acneProne, uncertain, scanAcnePct: known ? pct : null };
}
