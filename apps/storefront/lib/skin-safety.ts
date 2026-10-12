// Allergies and pregnancy: products the customer must not be offered are removed in code, from the product's
// INCI list (product.metadata.raw_inci), before the model sees the catalog. The model is never trusted with this.
// raw_inci is partly in French (translated labels), so every rule matches the INCI name AND its French form.
// Matching is done on accent-free lowercase text.

export function normalizeInci(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// One rule per option of the "q_allergies_list" question (skin-coach-flow.tsx). The key is the option label,
// found with includes() because the labels themselves contain commas.
// Owner's decision for "Extraits botaniques": only the named plants are excluded (the model is asked to be
// careful with other extracts).
export const ALLERGY_RULES: { label: string; name: string; re: RegExp }[] = [
  {
    label: "Parfums synthétiques (Fragrance)",
    name: "parfum",
    re: /\b(fragrance|parfum|perfume)\b/,
  },
  {
    label: "Huiles Essentielles (Tea tree, Lavande, Agrumes...)",
    name: "huiles essentielles",
    re: /melaleuca|tea ?tree|arbre a the|lavand|citrus|bergamot|bergamote|orange (peel|fruit|flower|leaf) oil|huile (essentielle|d'ecorce|de zeste)|lemon(grass)? (peel )?oil|eucalyptus|rosmarinus|romarin|mentha|peppermint|menthe|limonene|linalool|citral|geraniol|eugenol|citronellol/,
  },
  {
    label: "Extraits Botaniques (Aloé Vera, Armoise, Thé vert...)",
    name: "aloé / armoise / thé vert",
    re: /\baloe\b|aloe barbadensis|artemisia|armoise|camellia sinensis|green tea|the vert/,
  },
  {
    label: "Mucine d'escargot (Snail Mucin)",
    name: "mucine d'escargot",
    re: /snail|escargot/,
  },
  {
    label: "Propolis / Miel / Venin d'abeille",
    name: "propolis / miel / venin",
    re: /propolis|honey|\bmiel\b|\bmel\b|bee venom|\bvenin\b|royal jelly|gelee royale|beeswax|cire d'abeille/,
  },
  {
    label: "Centella Asiatica (Cica)",
    name: "centella",
    re: /centella|madecass|asiatic(oside|\s?acid)|acide asiatique|hydrocotyl|\bcica\b/,
  },
  {
    label: "Ferments (Galactomyces, Bifida...)",
    name: "ferments",
    re: /ferment|galactomyces|bifida|lactobacillus|saccharomyces|lactococcus|streptococcus thermophilus/,
  },
  {
    label: "Vitamine C pure (Acide L-Ascorbique)",
    name: "acide ascorbique",
    re: /(^|[^a-z])(l-)?ascorbic acid|acide (l-)?ascorbique/,
  },
  {
    label: "Rétinol / Rétinoïdes (Vitamine A)",
    name: "rétinoïdes",
    re: /retinol|retinal|retinyl|retinoate|retinoique|retinoic|tretinoin|adapalene/,
  },
  {
    label: "Acides Exfoliants (AHA, BHA, Acide Glycolique...)",
    name: "acides exfoliants",
    // citric acid is left out on purpose: it is a pH adjuster in almost every formula
    re: /glycolic|glycolique|lactic acid|acide lactique|mandelic|mandelique|salicylic|acide salicylique|betaine salicylate|salicylate de betaine|malic acid|acide malique|tartaric|tartrique|gluconolactone|lactobionic|lactobionique|\bpha\b|\baha\b|\bbha\b/,
  },
  {
    label: "Niacinamide (Vitamine B3)",
    name: "niacinamide",
    re: /niacinamide|nicotinamide/,
  },
  {
    label: "Alcools asséchants (Alcohol Denat, Ethanol)",
    name: "alcool asséchant",
    // a whole INCI entry, so fatty alcohols (cetyl, cetearyl, stearyl alcohol...) are not caught
    re: /(^|,)\s*(alcohol|alcool|ethanol|alcohol denat\.?|denatured alcohol|alcool denature|sd alcohol[^,]*)\s*(,|$)/,
  },
  {
    label: "Filtres Solaires Chimiques (Oxybenzone, Octocrylene...)",
    name: "filtres chimiques",
    re: /oxybenzone|benzophenone|octocrylen|avobenzone|butyl methoxydibenzoylmethane|octinoxate|ethylhexyl methoxycinnamate|methoxycinnamate d'ethylhexyle|homosalate|octisalate|ethylhexyl salicylate|salicylate d'ethylhexyle|bis-ethylhexyloxyphenol|ethylhexyl triazone|diethylamino hydroxybenzoyl|diethylhexyl butamido triazone|methylene bis-benzotriazolyl|drometrizole|polysilicone-15|ensulizole|phenylbenzimidazole sulfonic/,
  },
  {
    label: "Silicones (Dimethicone...)",
    name: "silicones",
    re: /methicone|siloxane|silicone|silsesquioxane|dimethiconol/,
  },
];


export const OTHER_ALLERGY_PREFIX = "Autres:";

// Owner's "standard" choice: retinoids, hydroquinone, and salicylic acid in leave-on products (cleansers are fine).
const RETINOIDS = /retinol|retinal|retinyl|retinoate|retinoique|retinoic|tretinoin|adapalene/;
const PREGNANCY_ALWAYS = new RegExp(`${RETINOIDS.source}|hydroquinone`);
// sunscreen filters such as ethylhexyl salicylate are not salicylic acid and stay allowed
const SALICYLIC = /salicylic|acide salicylique|betaine salicylate|salicylate de betaine/;
const CLEANSER_RE = /nettoy|cleans|foam|mousse|wash|demaquill|gel lavant/i;

// Under a dermatological treatment, or when a doctor's opinion is recommended: no product that can irritate
// on top of it (retinoids, exfoliating acids, benzoyl peroxide).
const EXFOLIATING_ACIDS = ALLERGY_RULES.find((r) => r.name === "acides exfoliants")!.re;
const BENZOYL_PEROXIDE = /benzoyl peroxide|peroxyde de benzoyle/;
// Lightening / depigmenting actives: not stacked on top of lightening products she uses now, nor on an
// unusual pigmentation (possible exogenous ochronosis) that a dermatologist should see first.
const DEPIGMENTING = /hydroquinone|tranexamic|tranexamique|kojic|kojique|arbutin|arbutine|glutathion|mequinol|monobenzone|mercur|clobetasol|betamethasone/;

// An INCI list is a comma-separated list of ingredient names. Some product sheets hold an excuse written by the
// AI sheet tool instead ("INCI non visible sur l'image…", "The image provides … but not the INCI list"), or a
// partial list: neither can prove that an ingredient is absent. Same rule as apps/admin/lib/product-sheet.ts.
const NOT_INCI_RE = /\b(image|photo|visibles?|lisibles?|illisibles?|impossible|cannot|unable|sorry|not provided|not available|not visible|n'est pas|ne sont pas|non disponibles?|aucune liste|pas fournie|resolution|floue?|incompl[eè]te?|partielle?|exemple|example|non applicable)\b/i;

export function isUsableInci(inci: string): boolean {
  const text = normalizeInci(inci || "").trim();
  if (!text || NOT_INCI_RE.test(text)) return false; // also catches "[illisible]" passages
  return text.split(/[,;]/).filter((x) => x.trim()).length >= 4;
}

// The product name is checked too ("…& BHA Cleanser"), after removing what it says the product is free of.
function titleForMatching(title: string): string {
  return normalizeInci(title || "")
    .replace(/\b(sans|without|zero|no|free from)\s+[a-z' ]{0,30}/g, " ")
    .replace(/[a-z]+[- ]free\b/g, " ");
}

export type SafetyProfile = {
  allergies: typeof ALLERGY_RULES;
  otherAllergy: string; // free text of "Autres (à préciser)", left to the model
  pregnant: boolean;
  gentleOnly: boolean; // dermatological treatment or doctor's opinion recommended: nothing irritating
  noDepigmenting: boolean; // lightening products used now, or unusual pigmentation
};

export type SafetyAnswers = { allergies: string; pregnancy: string; dermTreatment: string; lightening: string };

export function readSafetyProfile(
  answers: SafetyAnswers,
  medical: { gentleOnly: boolean; noDepigmenting: boolean } = { gentleOnly: false, noDepigmenting: false }
): SafetyProfile {
  const otherIdx = answers.allergies.indexOf(OTHER_ALLERGY_PREFIX);
  return {
    allergies: ALLERGY_RULES.filter((r) => answers.allergies.includes(r.label)),
    otherAllergy: otherIdx >= 0 ? answers.allergies.slice(otherIdx + OTHER_ALLERGY_PREFIX.length).trim().slice(0, 200) : "",
    pregnant: /^oui/i.test(answers.pregnancy.trim()),
    gentleOnly: medical.gentleOnly,
    noDepigmenting: medical.noDepigmenting,
  };
}

export function needsInciCheck(profile: SafetyProfile): boolean {
  return profile.allergies.length > 0 || profile.pregnant || profile.gentleOnly || profile.noDepigmenting;
}

// Why this product can't be offered, or null if it can. Applied to the catalog before the model sees it, and
// again to the final routine before it is shown. A product whose composition can't be read is excluded
// whenever there is something to check: we can't prove it is safe.
export function exclusionReason(
  product: { title: string; category: string; inci: string },
  profile: SafetyProfile
): string | null {
  if (!needsInciCheck(profile)) return null;

  const title = titleForMatching(product.title);
  for (const rule of profile.allergies) {
    if (rule.re.test(title)) return `allergie : ${rule.name} (nom du produit)`;
  }
  if (!isUsableInci(product.inci)) return "composition inconnue ou illisible";

  const inci = normalizeInci(product.inci);
  for (const rule of profile.allergies) {
    if (rule.re.test(inci)) return `allergie : ${rule.name}`;
  }
  const isCleanser = product.category === "Nettoyant" || CLEANSER_RE.test(normalizeInci(product.title));
  if (profile.pregnant) {
    if (PREGNANCY_ALWAYS.test(inci) || PREGNANCY_ALWAYS.test(title)) return "grossesse : rétinoïde / hydroquinone";
    if (!isCleanser && SALICYLIC.test(inci)) return "grossesse : acide salicylique sans rinçage";
  }
  if (profile.gentleOnly) {
    if (RETINOIDS.test(inci) || EXFOLIATING_ACIDS.test(inci) || BENZOYL_PEROXIDE.test(inci) || /\b(bha|aha|pha|retinol)\b/.test(title)) {
      return "traitement ou avis médical : actif potentiellement irritant";
    }
  }
  if (profile.noDepigmenting && (DEPIGMENTING.test(inci) || /eclairciss|whitening|blanchi|dark spot|anti-taches|tranexam|arbutin/.test(title))) {
    return "produits éclaircissants / pigmentation : actif dépigmentant";
  }
  return null;
}

// ─── Situations that call for a doctor's opinion ─────────────────────────────────────────────────────────────
// Decided in code from the photo analysis flags and the questionnaire, never left to the model.

export type MedicalFlags = { severe_acne?: boolean; unusual_pigmentation?: boolean; other_lesion?: boolean; notes?: string };

export type MedicalDecision = {
  referral: boolean; // a dermatologist should see her: essentials-only, gentle routine, no promise
  reasons: string[];
  cautions: string[]; // softer: she should check the routine with her doctor
  gentleOnly: boolean;
  noDepigmenting: boolean;
};

// acne_severity_percentage at or above which acne counts as severe even without the explicit flag
export const SEVERE_ACNE_SCORE = 70;

export function decideMedical(
  flags: MedicalFlags | undefined,
  acneScore: unknown,
  answers: { dermTreatment: string; lightening: string }
): MedicalDecision {
  const reasons: string[] = [];
  const cautions: string[] = [];
  const score = Number(acneScore);
  if (flags?.severe_acne || (Number.isFinite(score) && score >= SEVERE_ACNE_SCORE)) {
    reasons.push("des signes d'acné importante (boutons profonds, nodules ou marques persistantes) sont visibles sur vos photos");
  }
  if (flags?.unusual_pigmentation) {
    reasons.push("une pigmentation inhabituelle est visible sur vos photos");
  }
  if (flags?.other_lesion) {
    reasons.push("une lésion de la peau mérite d'être examinée");
  }
  const inTreatment = /^oui/i.test(answers.dermTreatment.trim());
  const lighteningNow = /actuellement/i.test(answers.lightening);
  if (inTreatment) cautions.push("vous suivez un traitement pour la peau : faites valider cette routine par votre médecin ou votre dermatologue avant de l'associer à votre traitement");
  if (lighteningNow) cautions.push("vous utilisez actuellement des produits éclaircissants : nous n'y ajoutons aucun actif dépigmentant, et nous vous conseillons d'en parler à un professionnel de santé");
  const referral = reasons.length > 0;
  return {
    referral,
    reasons,
    cautions,
    gentleOnly: referral || inTreatment,
    noDepigmenting: lighteningNow || !!flags?.unusual_pigmentation,
  };
}
