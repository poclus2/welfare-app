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
const PREGNANCY_ALWAYS = /retinol|retinal|retinyl|retinoate|retinoique|retinoic|tretinoin|adapalene|hydroquinone/;
// sunscreen filters such as ethylhexyl salicylate are not salicylic acid and stay allowed
const PREGNANCY_LEAVE_ON = /salicylic|acide salicylique|betaine salicylate|salicylate de betaine/;
const CLEANSER_RE = /nettoy|cleans|foam|mousse|wash|demaquill|gel lavant/i;

export type SafetyProfile = {
  allergies: typeof ALLERGY_RULES;
  otherAllergy: string; // free text of "Autres (à préciser)", left to the model
  pregnant: boolean;
};

export function readSafetyProfile(allergyAnswer: string, pregnancyAnswer: string): SafetyProfile {
  const otherIdx = allergyAnswer.indexOf(OTHER_ALLERGY_PREFIX);
  return {
    allergies: ALLERGY_RULES.filter((r) => allergyAnswer.includes(r.label)),
    otherAllergy: otherIdx >= 0 ? allergyAnswer.slice(otherIdx + OTHER_ALLERGY_PREFIX.length).trim().slice(0, 200) : "",
    pregnant: /^oui/i.test(pregnancyAnswer.trim()),
  };
}

export function needsInciCheck(profile: SafetyProfile): boolean {
  return profile.allergies.length > 0 || profile.pregnant;
}

// Why this product can't be offered, or null if it can. A product without an INCI list can't be checked,
// so it is excluded whenever there is something to check.
export function exclusionReason(
  product: { title: string; category: string; inci: string },
  profile: SafetyProfile
): string | null {
  if (!needsInciCheck(profile)) return null;
  const inci = normalizeInci(product.inci || "");
  if (!inci.trim()) return "composition inconnue";

  for (const rule of profile.allergies) {
    if (rule.re.test(inci)) return `allergie : ${rule.name}`;
  }
  if (profile.pregnant) {
    if (PREGNANCY_ALWAYS.test(inci)) return "grossesse : rétinoïde / hydroquinone";
    const isCleanser = product.category === "Nettoyant" || CLEANSER_RE.test(normalizeInci(product.title));
    if (!isCleanser && PREGNANCY_LEAVE_ON.test(inci)) return "grossesse : acide salicylique sans rinçage";
  }
  return null;
}
